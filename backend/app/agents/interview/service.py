import uuid
import json
import logging
import os
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile
from openai import OpenAI

from app.config.config import settings
from app.models.interview import Resume, InterviewSession, InterviewQuestion, InterviewFeedback
from app.agents.interview.graph import interview_graph
from app.agents.interview.state import InterviewState
from app.agents.interview.prompt import EVALUATE_ANSWERS_SYSTEM_PROMPT, CONSOLIDATE_REPORT_SYSTEM_PROMPT

logger = logging.getLogger("app.agents.interview.service")


class InterviewService:
    """
    Coordinator Layer executing LangGraph workflows, evaluating mock interviews,
    and persisting resumes, session details, and feedbacks to database.
    """

    @staticmethod
    def upload_resume(db: Session, user_id: uuid.UUID, file: UploadFile) -> Resume:
        """
        Saves the physical PDF/DOCX resume file, parses text, structures contact/skills content,
        and records the Resume metadata inside MySQL.
        """
        # Ensure uploads target directory is initialized
        upload_dir = settings.UPLOAD_FOLDER
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        # Unique path filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"resume_{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        # Invoke parsing nodes to structure raw text
        initial_state = InterviewState(
            user_id=user_id,
            file_path=file_path,
            target_role=None,
            company_name=None,
            resume_raw_text="",
            parsed_resume={},
            ats_analysis={},
            gap_analysis={},
            company_roadmap={},
            questions=[],
            final_report={}
        )

        logger.info(f"Invoking Resume Parse Graph for file: {file.filename}")
        final_state = interview_graph.invoke(initial_state)
        parsed_data = final_state.get("parsed_resume", {})

        db_resume = Resume(
            user_id=user_id,
            file_name=file.filename,
            file_path=file_path,
            parsed_json=json.dumps(parsed_data)
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)
        return db_resume

    @staticmethod
    def analyze_ats(db: Session, user_id: uuid.UUID, resume_id: uuid.UUID, target_role: str) -> Dict[str, Any]:
        """
        Evaluates the parsed resume against targeted roles, calculating ATS match ratings
        and identifying formatting, keyword, and project suggestions.
        """
        db_resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
        if not db_resume:
            raise ValueError("Resume not found or access denied.")

        parsed_json = json.loads(db_resume.parsed_json)
        skills = parsed_json.get("skills", [])

        # Run pipeline starting from ATS analysis nodes
        initial_state = InterviewState(
            user_id=user_id,
            file_path=None,
            target_role=target_role,
            company_name=None,
            resume_raw_text="",
            parsed_resume=parsed_json,
            ats_analysis={},
            gap_analysis={},
            company_roadmap={},
            questions=[],
            final_report={}
        )

        logger.info(f"Invoking ATS Analysis nodes for target role: {target_role}")
        final_state = interview_graph.invoke(initial_state)

        ats_data = final_state.get("ats_analysis", {})
        gap_data = final_state.get("gap_analysis", {})

        return {
            "ats_score": ats_data.get("ats_score", 65.0),
            "strengths": ats_data.get("strengths", []),
            "weaknesses": ats_data.get("weaknesses", []),
            "missing_skills": gap_data.get("missing_skills", []),
            "formatting_suggestions": ats_data.get("formatting_suggestions", []),
            "keyword_suggestions": gap_data.get("keyword_suggestions", []),
            "project_suggestions": gap_data.get("project_suggestions", [])
        }

    @staticmethod
    def generate_company_prep(db: Session, user_id: uuid.UUID, company_name: str, role: str) -> Dict[str, Any]:
        """
        Creates a custom preparation roadmap for the selected company and role, matching relevant
        knowledge base documents using Shared RAG queries.
        """
        # Run pipeline focused on the preparation node
        initial_state = InterviewState(
            user_id=user_id,
            file_path=None,
            target_role=role,
            company_name=company_name,
            resume_raw_text="",
            parsed_resume={},
            ats_analysis={},
            gap_analysis={},
            company_roadmap={},
            questions=[],
            final_report={}
        )

        logger.info(f"Invoking Company prep node for {company_name} - {role}")
        final_state = interview_graph.invoke(initial_state)
        return final_state.get("company_roadmap", {})

    @staticmethod
    def create_mock_interview(db: Session, user_id: uuid.UUID, role: str, company: str) -> InterviewSession:
        """
        Creates a new InterviewSession entry and populates it with generated
        Technical, HR, Behavioral, and Coding mock questions.
        """
        # Lookup user resume if one is uploaded
        db_resume = db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).first()
        parsed_resume = json.loads(db_resume.parsed_json) if db_resume else {}

        # Invoke question generator nodes
        initial_state = InterviewState(
            user_id=user_id,
            file_path=None,
            target_role=role,
            company_name=company,
            resume_raw_text="",
            parsed_resume=parsed_resume,
            ats_analysis={},
            gap_analysis={},
            company_roadmap={},
            questions=[],
            final_report={}
        )

        logger.info(f"Invoking Mock Question generator for {company} - {role}")
        final_state = interview_graph.invoke(initial_state)
        questions_list = final_state.get("questions", [])

        # Persist Session
        db_session = InterviewSession(
            user_id=user_id,
            company=company,
            role=role,
            overall_score=0.0
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)

        # Persist Questions
        for q in questions_list:
            db_q = InterviewQuestion(
                session_id=db_session.id,
                question=q.get("question", "Conceptual check"),
                category=q.get("category", "Technical"),
                difficulty=q.get("difficulty", "Medium")
            )
            db.add(db_q)

        db.commit()
        db.refresh(db_session)
        return db_session

    @staticmethod
    def submit_answers(db: Session, user_id: uuid.UUID, session_id: uuid.UUID, answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates candidate's student_answer inputs against the questions list, scoring them
        out of 10. Refines overall session scoring and records Strengths, Weaknesses, and Recommendations.
        """
        db_session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id
        ).first()

        if not db_session:
            raise ValueError("Interview session not found or access denied.")

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        evaluation_scores = []

        # Evaluate each answer
        for ans in answers:
            q_id = uuid.UUID(ans["question_id"]) if isinstance(ans["question_id"], str) else ans["question_id"]
            db_q = db.query(InterviewQuestion).filter(
                InterviewQuestion.id == q_id,
                InterviewQuestion.session_id == session_id
            ).first()

            if not db_q:
                continue

            student_ans = ans["student_answer"]
            db_q.student_answer = student_ans

            # Call OpenAI to score answer
            prompt = EVALUATE_ANSWERS_SYSTEM_PROMPT.format(
                role=db_session.role,
                company=db_session.company,
                question=db_q.question,
                answer=student_ans
            )

            try:
                response = client.chat.completions.create(
                    model=settings.OPENAI_CHAT_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a tech placement interviewer scoring answers in JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3
                )
                eval_data = json.loads(response.choices[0].message.content or "{}")
                db_q.score = float(eval_data.get("score", 5.0))
                db_q.feedback = eval_data.get("feedback", "Completed evaluation.")
                evaluation_scores.append(db_q.score)
            except Exception as e:
                logger.error(f"Failed to score question {q_id}: {e}")
                db_q.score = 5.0
                db_q.feedback = "Fallback evaluation score."
                evaluation_scores.append(5.0)

        # Consolidate Feedback Report
        scores_list_str = ", ".join([str(s) for s in evaluation_scores])
        prompt = CONSOLIDATE_REPORT_SYSTEM_PROMPT.format(
            role=db_session.role,
            company=db_session.company,
            scores=scores_list_str
        )

        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": "You are a placement panel advisor summarizing feedback in JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            report_data = json.loads(response.choices[0].message.content or "{}")
            overall_score = float(report_data.get("overall_score", 70.0))
            strengths = report_data.get("strengths", "Solid baseline answers.")
            weaknesses = report_data.get("weaknesses", "Areas of technical clarity can be expanded.")
            recommendations = report_data.get("recommendations", "Solve more mock test questions.")
        except Exception as e:
            logger.error(f"Failed to consolidate final feedback: {e}")
            overall_score = sum(evaluation_scores) / len(evaluation_scores) * 10 if evaluation_scores else 60.0
            strengths = "Feedback evaluation error fallback."
            weaknesses = "None"
            recommendations = "Consult tutor sections."

        # Update Session overall score
        db_session.overall_score = overall_score

        # Save Feedback row
        db_feedback = InterviewFeedback(
            session_id=db_session.id,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations
        )
        db.add(db_feedback)
        db.commit()

        return {
            "session_id": db_session.id,
            "overall_score": overall_score,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations,
            "questions": [
                {
                    "id": q.id,
                    "question": q.question,
                    "category": q.category,
                    "difficulty": q.difficulty,
                    "student_answer": q.student_answer,
                    "score": q.score,
                    "feedback": q.feedback
                }
                for q in db_session.questions
            ]
        }
