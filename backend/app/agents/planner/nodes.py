import json
import logging
from datetime import datetime, date
from openai import OpenAI
from app.config.config import settings
from app.agents.planner.state import PlannerState
from app.rag.rag_service import RAGService
from app.agents.planner.prompt import (
    PLANNER_ANALYZE_SYSTEM_PROMPT,
    PLANNER_PLAN_SYSTEM_PROMPT,
    PLANNER_REVISION_SYSTEM_PROMPT,
    PLANNER_RECOMMENDATIONS_SYSTEM_PROMPT
)

logger = logging.getLogger("app.agents.planner.nodes")


def analyze_request_node(state: PlannerState) -> PlannerState:
    """
    Node 1: Analyze Request - Evaluates scope, constraints, and target day count.
    """
    logger.info("Executing analyze_request_node")
    req = state.get("request_data", {})
    
    # Calculate target study duration in days
    try:
        exam_date_val = req.get("exam_date")
        if isinstance(exam_date_val, str):
            exam_dt = datetime.strptime(exam_date_val, "%Y-%m-%d").date()
        else:
            exam_dt = exam_date_val
            
        today = date.today()
        delta = (exam_dt - today).days
        days_count = max(delta, 1) # Must study at least 1 day
    except Exception as err:
        logger.error(f"Date calculation failed in planner analysis: {err}")
        days_count = 7  # Default fallback to 1 week plan

    req["days_count"] = days_count
    
    prompt = PLANNER_ANALYZE_SYSTEM_PROMPT.format(
        goal=req.get("goal"),
        subjects=req.get("subjects"),
        hours_per_day=req.get("hours_per_day"),
        exam_date=req.get("exam_date"),
        skill_level=req.get("skill_level"),
        days_count=days_count
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful university planner advisor that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS
        )
        raw_content = response.choices[0].message.content or "{}"
        state["analysis"] = json.loads(raw_content)
    except Exception as e:
        logger.error(f"Analyze request node failed: {e}")
        state["analysis"] = {
            "estimated_difficulty": "Medium",
            "focus_areas": [],
            "challenges": []
        }

    return state


def retrieve_content_node(state: PlannerState) -> PlannerState:
    """
    Node 2: Retrieve Relevant Content - Calls RAG matching subjects/goals.
    """
    logger.info("Executing retrieve_content_node")
    user_id = state.get("user_id")
    req = state.get("request_data", {})
    query = f"{req.get('subjects')} {req.get('goal')}"

    try:
        # Search the knowledge base for top 5 matches
        context_chunks = RAGService.search(user_id=user_id, question=query, top_k=5)
        state["context_chunks"] = context_chunks
        logger.info(f"Retrieved {len(context_chunks)} chunks for planner context.")
    except Exception as e:
        logger.error(f"Retrieve content node failed: {e}")
        state["context_chunks"] = []

    return state


def generate_study_plan_node(state: PlannerState) -> PlannerState:
    """
    Node 3: Generate Study Plan - Structures daily syllabus distribution.
    """
    logger.info("Executing generate_study_plan_node")
    req = state.get("request_data", {})
    context_chunks = state.get("context_chunks", [])
    days_count = req.get("days_count", 7)

    # Format retrieved RAG context
    if context_chunks:
        context_blocks = []
        for index, chunk in enumerate(context_chunks):
            context_blocks.append(
                f"Reference File: '{chunk['file_name']}' (Page {chunk['page']})\n"
                f"Syllabus Content: {chunk['text']}"
            )
        context_str = "\n\n---\n\n".join(context_blocks)
    else:
        context_str = "No uploaded reference documents found in Knowledge Base."

    prompt = PLANNER_PLAN_SYSTEM_PROMPT.format(
        goal=req.get("goal"),
        subjects=req.get("subjects"),
        hours_per_day=req.get("hours_per_day"),
        preferred_days=", ".join(req.get("preferred_study_days", [])),
        days_count=days_count,
        context=context_str
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful university planner advisor that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS
        )
        raw_content = response.choices[0].message.content or "{}"
        plan_data = json.loads(raw_content)
        state["plan_days"] = plan_data.get("plan_days", [])
        logger.info(f"Draft plan created for {len(state['plan_days'])} days.")
    except Exception as e:
        logger.error(f"Generate study plan node failed: {e}")
        # Build simple fallback days
        fallback_days = []
        for day in range(1, days_count + 1):
            fallback_days.append({
                "day_number": day,
                "topic": f"Study subject topic review (Day {day})",
                "estimated_hours": req.get("hours_per_day", 2)
            })
        state["plan_days"] = fallback_days

    return state


def generate_revision_strategy_node(state: PlannerState) -> PlannerState:
    """
    Node 4: Generate Revision Strategy - Refines schedule injecting test and mock exam markers.
    """
    logger.info("Executing generate_revision_strategy_node")
    req = state.get("request_data", {})
    plan_days = state.get("plan_days", [])
    days_count = len(plan_days)

    prompt = PLANNER_REVISION_SYSTEM_PROMPT.format(
        goal=req.get("goal"),
        days_count=days_count,
        original_schedule=json.dumps(plan_days)
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful university planner advisor that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS
        )
        raw_content = response.choices[0].message.content or "{}"
        revision_data = json.loads(raw_content)
        
        # Overwrite plan_days with refined schedule
        state["plan_days"] = revision_data.get("plan_days", plan_days)
        state["revision_strategy"] = {
            "summary": revision_data.get("revision_strategy_summary", "Refined schedule with spaced repetition.")
        }
        logger.info("Successfully injected revision strategy.")
    except Exception as e:
        logger.error(f"Generate revision strategy node failed: {e}")
        state["revision_strategy"] = {"summary": "Standard daily progression."}

    return state


def generate_recommendations_node(state: PlannerState) -> PlannerState:
    """
    Node 5: Generate Recommendations - Suggests weak topics and lists PDF materials references.
    """
    logger.info("Executing generate_recommendations_node")
    req = state.get("request_data", {})
    plan_days = state.get("plan_days", [])
    context_chunks = state.get("context_chunks", [])

    sources_str = ", ".join(list(set([c["file_name"] for c in context_chunks]))) if context_chunks else "None"

    prompt = PLANNER_RECOMMENDATIONS_SYSTEM_PROMPT.format(
        goal=req.get("goal"),
        completed_schedule=json.dumps(plan_days),
        sources=sources_str
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful university planner advisor that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS
        )
        raw_content = response.choices[0].message.content or "{}"
        state["recommendations"] = json.loads(raw_content)
        logger.info("Successfully generated planner recommendations.")
    except Exception as e:
        logger.error(f"Generate recommendations node failed: {e}")
        state["recommendations"] = {
            "weak_topics_suggestions": [],
            "recommended_pdfs": [],
            "estimated_completion_weeks": 1,
            "motivational_summary": "Stay positive and study consistently to reach your goal!"
        }

    return state
