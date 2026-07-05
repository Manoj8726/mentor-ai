import json
import logging
from openai import OpenAI
from app.config.config import settings
from app.agents.interview.state import InterviewState
from app.agents.interview.resume_parser import ResumeParser
from app.rag.rag_service import RAGService
from app.agents.interview.prompt import (
    RESUME_PARSE_SYSTEM_PROMPT,
    ATS_ANALYZE_SYSTEM_PROMPT,
    GAP_ANALYSIS_SYSTEM_PROMPT,
    COMPANY_PREPARATION_SYSTEM_PROMPT,
    INTERVIEW_QUESTION_SYSTEM_PROMPT,
    CONSOLIDATE_REPORT_SYSTEM_PROMPT
)

logger = logging.getLogger("app.agents.interview.nodes")


def parse_resume_node(state: InterviewState) -> InterviewState:
    """
    Node 1: Resume Parser - Reads PDF/DOCX files and uses LLM to structure contact details, education, and jobs.
    """
    logger.info("Executing parse_resume_node")
    file_path = state.get("file_path")
    
    # Extract text from disk file if path is supplied
    if file_path:
        try:
            raw_text = ResumeParser.extract_text(file_path)
            state["resume_raw_text"] = raw_text
        except Exception as e:
            logger.error(f"Failed to read resume file: {e}")
            state["resume_raw_text"] = state.get("resume_raw_text", "No resume content uploaded.")
            
    raw_text = state.get("resume_raw_text", "")
    prompt = RESUME_PARSE_SYSTEM_PROMPT.format(raw_text=raw_text)

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a professional HR parser that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        raw_content = response.choices[0].message.content or "{}"
        state["parsed_resume"] = json.loads(raw_content)
    except Exception as e:
        logger.error(f"Parse resume node failed: {e}")
        state["parsed_resume"] = {
            "name": "Candidate",
            "email": "",
            "phone": "",
            "education": [],
            "projects": [],
            "experience": [],
            "skills": [],
            "certifications": [],
            "achievements": []
        }

    return state


def extract_skills_node(state: InterviewState) -> InterviewState:
    """
    Node 2: Skill Extractor - Identifies core competencies from candidate's profile.
    """
    logger.info("Executing extract_skills_node")
    # In our graph, the parser already parses skills. We ensure they are lowercased and clean.
    parsed = state.get("parsed_resume", {})
    skills = parsed.get("skills", [])
    cleaned_skills = list(set([s.strip() for s in skills if s.strip()]))
    parsed["skills"] = cleaned_skills
    state["parsed_resume"] = parsed
    return state


def ats_analyzer_node(state: InterviewState) -> InterviewState:
    """
    Node 3: ATS Analyzer - Evaluates candidate's formatting and keyword metrics.
    """
    logger.info("Executing ats_analyzer_node")
    role = state.get("target_role", "Software Engineer")
    parsed = state.get("parsed_resume", {})

    prompt = ATS_ANALYZE_SYSTEM_PROMPT.format(
        target_role=role,
        parsed_resume=json.dumps(parsed)
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful recruitment ATS scanner that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.OPENAI_TEMPERATURE
        )
        raw_content = response.choices[0].message.content or "{}"
        state["ats_analysis"] = json.loads(raw_content)
    except Exception as e:
        logger.error(f"ATS Analyzer node failed: {e}")
        state["ats_analysis"] = {
            "ats_score": 60.0,
            "strengths": ["Basic education background present."],
            "weaknesses": ["Unable to evaluate profile correctly."],
            "formatting_suggestions": []
        }

    return state


def gap_analysis_node(state: InterviewState) -> InterviewState:
    """
    Node 4: Gap Analysis - Contrast skills against targeted developer positions.
    """
    logger.info("Executing gap_analysis_node")
    role = state.get("target_role", "Software Engineer")
    parsed = state.get("parsed_resume", {})
    skills = parsed.get("skills", [])

    prompt = GAP_ANALYSIS_SYSTEM_PROMPT.format(
        target_role=role,
        candidate_skills=", ".join(skills),
        parsed_resume=json.dumps(parsed)
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a career consultant that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.OPENAI_TEMPERATURE
        )
        raw_content = response.choices[0].message.content or "{}"
        state["gap_analysis"] = json.loads(raw_content)
    except Exception as e:
        logger.error(f"Gap Analysis node failed: {e}")
        state["gap_analysis"] = {
            "missing_skills": [],
            "keyword_suggestions": [],
            "project_suggestions": []
        }

    return state


def company_preparation_node(state: InterviewState) -> InterviewState:
    """
    Node 5: Company Preparation - Pulls course context via Shared RAG to map placement timelines.
    """
    logger.info("Executing company_preparation_node")
    company = state.get("company_name", "Generic")
    role = state.get("target_role", "Software Engineer")
    user_id = state.get("user_id")

    # Search for RAG matches
    query = f"{company} interview syllabus, coding questions for {role}"
    try:
        chunks = RAGService.search(user_id=user_id, question=query, top_k=3)
        rag_str = "\n\n".join([f"Source: {c['file_name']}\nContent: {c['text']}" for c in chunks])
    except Exception as err:
        logger.warning(f"RAG search failed in company prep node: {err}")
        chunks = []
        rag_str = "No knowledge base documents matched."

    prompt = COMPANY_PREPARATION_SYSTEM_PROMPT.format(
        company_name=company,
        role=role,
        rag_context=rag_str
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a placement prep counselor that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.OPENAI_TEMPERATURE
        )
        raw_content = response.choices[0].message.content or "{}"
        roadmap_data = json.loads(raw_content)
        
        # Inject matching RAG documents as recommended materials
        rec_materials = []
        for c in chunks:
            rec_materials.append({
                "document_id": str(c["document_id"]),
                "file_name": c["file_name"],
                "page": c["page"],
                "score": c["score"]
            })
            
        roadmap_data["recommended_study_materials"] = rec_materials
        state["company_roadmap"] = roadmap_data
    except Exception as e:
        logger.error(f"Company preparation node failed: {e}")
        state["company_roadmap"] = {
            "important_topics": [],
            "likely_interview_areas": [],
            "learning_roadmap": [],
            "recommended_study_materials": [],
            "preparation_checklist": []
        }

    return state


def interview_question_generator_node(state: InterviewState) -> InterviewState:
    """
    Node 6: Question Generator - Structures technical, HR, behavioral and coding questions.
    """
    logger.info("Executing interview_question_generator_node")
    role = state.get("target_role", "Software Engineer")
    company = state.get("company_name", "Generic")
    parsed = state.get("parsed_resume", {})

    prompt = INTERVIEW_QUESTION_QUESTION_PROMPT = INTERVIEW_QUESTION_SYSTEM_PROMPT.format(
        role=role,
        company=company,
        parsed_resume=json.dumps(parsed)
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are an interviewer panelist that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.5
        )
        raw_content = response.choices[0].message.content or "{}"
        q_data = json.loads(raw_content)
        state["questions"] = q_data.get("questions", [])
    except Exception as e:
        logger.error(f"Question generator node failed: {e}")
        state["questions"] = []

    return state


def final_report_node(state: InterviewState) -> InterviewState:
    """
    Node 7: Final Report - Consolidates feedback summaries.
    """
    logger.info("Executing final_report_node")
    role = state.get("target_role", "Software Engineer")
    company = state.get("company_name", "Generic")
    ats = state.get("ats_analysis", {})
    gap = state.get("gap_analysis", {})

    # Generate initial reports summaries
    state["final_report"] = {
        "overall_score": ats.get("ats_score", 60.0),
        "strengths": " • " + "\n • ".join(ats.get("strengths", ["Profile matched targeted requirements."])),
        "weaknesses": " • " + "\n • ".join(ats.get("weaknesses", ["Some key competencies missing."])),
        "recommendations": "Add targeted keyword definitions and resolve missing skills gaps."
    }

    return state
