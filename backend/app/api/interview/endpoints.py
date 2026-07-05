import logging
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.auth.deps import get_current_active_user
from app.models.user import User
from app.models.interview import InterviewSession, InterviewQuestion, InterviewFeedback, Resume
from app.schemas.interview import (
    ResumeUploadResponse,
    ATSAnalysisRequest,
    ATSAnalysisResponse,
    CompanyPrepRequest,
    CompanyPrepResponse,
    MockInterviewRequest,
    MockInterviewResponse,
    MockSubmitRequest,
    MockSubmitResponse,
    SessionResponse
)
from app.agents.interview.service import InterviewService

logger = logging.getLogger("app.api.interview.endpoints")
router = APIRouter()


@router.post("/upload-resume", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Accepts resume PDF or DOCX file upload, extracts raw text, structures skills metadata,
    and returns parsed outcomes.
    """
    logger.info(f"User {current_user.email} uploading resume {file.filename}")
    
    # Validate extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("pdf", "docx", "doc"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF and DOCX files are accepted."
        )

    try:
        db_resume = InterviewService.upload_resume(db, current_user.id, file)
        import json
        return {
            "id": db_resume.id,
            "file_name": db_resume.file_name,
            "parsed_json": json.loads(db_resume.parsed_json),
            "created_at": db_resume.created_at
        }
    except Exception as e:
        logger.error(f"Failed to process resume upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume processing failed: {str(e)}"
        )


@router.post("/analyze", response_model=ATSAnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_ats_score(
    request: ATSAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Performs ATS keyword match, skills gap checks, and structures formatting hints.
    """
    try:
        analysis = InterviewService.analyze_ats(db, current_user.id, request.resume_id, request.target_role)
        return analysis
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err)
        )
    except Exception as e:
        logger.error(f"Failed to compile ATS: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ATS analysis compilation failed: {str(e)}"
        )


@router.post("/company-preparation", response_model=CompanyPrepResponse, status_code=status.HTTP_200_OK)
def company_preparation(
    request: CompanyPrepRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generates preparation roadmaps, checklist focus points, and pulls matching RAG documents.
    """
    try:
        roadmap = InterviewService.generate_company_prep(db, current_user.id, request.company_name, request.role)
        return {
            "company": request.company_name,
            "role": request.role,
            "important_topics": roadmap.get("important_topics", []),
            "likely_interview_areas": roadmap.get("likely_interview_areas", []),
            "learning_roadmap": roadmap.get("learning_roadmap", []),
            "recommended_study_materials": roadmap.get("recommended_study_materials", []),
            "preparation_checklist": roadmap.get("preparation_checklist", [])
        }
    except Exception as e:
        logger.error(f"Failed to compile roadmap: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Roadmap preparation failed: {str(e)}"
        )


@router.post("/mock", response_model=MockInterviewResponse, status_code=status.HTTP_201_CREATED)
def start_mock_interview(
    request: MockInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Creates an interview session and compiles technical, HR, behavioral, and coding questions.
    """
    try:
        session = InterviewService.create_mock_interview(db, current_user.id, request.role, request.company)
        return {
            "session_id": session.id,
            "company": session.company,
            "role": session.role,
            "questions": [
                {
                    "id": q.id,
                    "question": q.question,
                    "category": q.category,
                    "difficulty": q.difficulty
                }
                for q in session.questions
            ]
        }
    except Exception as e:
        logger.error(f"Failed to start mock session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate mock session: {str(e)}"
        )


@router.post("/mock/submit", response_model=MockSubmitResponse, status_code=status.HTTP_200_OK)
def submit_interview_answers(
    request: MockSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Scores the candidate's answers and saves overall strengths/weaknesses.
    """
    try:
        answers_list = [{"question_id": ans.question_id, "student_answer": ans.student_answer} for ans in request.answers]
        result = InterviewService.submit_answers(db, current_user.id, request.session_id, answers_list)
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err)
        )
    except Exception as e:
        logger.error(f"Submission failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation compilation failed: {str(e)}"
        )


@router.get("/history", response_model=List[SessionResponse], status_code=status.HTTP_200_OK)
def list_interview_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves previous interview sessions and scores.
    """
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).order_by(InterviewSession.created_at.desc()).all()
    return sessions


@router.get("/report/{session_id}", response_model=MockSubmitResponse, status_code=status.HTTP_200_OK)
def get_interview_report(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Loads full results scorecard for a finished mock session.
    """
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied."
        )

    # Resolve Feedback row
    fdb = session.feedback
    if not fdb:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session answers have not been evaluated yet."
        )

    return {
        "session_id": session.id,
        "overall_score": session.overall_score,
        "strengths": fdb.strengths,
        "weaknesses": fdb.weaknesses,
        "recommendations": fdb.recommendations,
        "questions": [
            {
                "id": q.id,
                "question": q.question,
                "category": q.category,
                "difficulty": q.difficulty,
                "student_answer": q.student_answer or "No answer submitted.",
                "score": q.score or 0.0,
                "feedback": q.feedback or "No feedback."
            }
            for q in session.questions
        ]
    }
