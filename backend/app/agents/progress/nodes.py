import json
import logging
from openai import OpenAI
from app.config.config import settings
from app.agents.progress.state import ProgressState
from app.rag.rag_service import RAGService
from app.agents.progress.prompt import (
    BEHAVIOR_ANALYZE_SYSTEM_PROMPT,
    WEAK_TOPIC_DETECTION_SYSTEM_PROMPT,
    AI_RECOMMENDATION_SYSTEM_PROMPT,
    READINESS_PREDICT_SYSTEM_PROMPT
)

logger = logging.getLogger("app.agents.progress.nodes")


def collect_learning_data_node(state: ProgressState) -> ProgressState:
    """
    Node 1: Collect Learning Data - Validates the aggregated analytics data
    pre-loaded by the coordinator service layer.
    """
    logger.info("Executing collect_learning_data_node")
    raw = state.get("collected_raw_data", {})
    
    # Inject default fallback metrics if completely empty
    if not raw:
        state["collected_raw_data"] = {
            "tutor_conversations_count": 0,
            "tutor_messages_count": 0,
            "quiz_errors_sample": [],
            "study_plans_count": 0,
            "study_completion_percentage": 0.0,
            "incomplete_topics_sample": [],
            "mock_interviews_count": 0,
            "interview_score_avg": 0.0,
            "interview_mistakes_sample": [],
            "resume_score_max": 0.0,
            "parsed_resume": {},
            "knowledge_base_usage": 0,
            "weekly_activity_chart": [],
            "interview_score_trend_chart": []
        }
    return state


def analyze_learning_behaviour_node(state: ProgressState) -> ProgressState:
    """
    Node 2: Analyze Learning Behaviour - Evaluates candidates consistency metrics.
    """
    logger.info("Executing analyze_learning_behaviour_node")
    raw = state.get("collected_raw_data", {})

    prompt = BEHAVIOR_ANALYZE_SYSTEM_PROMPT.format(
        raw_statistics=json.dumps(raw)
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a learning psychologist that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        raw_content = response.choices[0].message.content or "{}"
        state["behavior_analysis"] = json.loads(raw_content)
    except Exception as e:
        logger.error(f"Analyze behaviour node failed: {e}")
        state["behavior_analysis"] = {
            "behavior_summary": "Inconsistent study logs. Start setting daily goals.",
            "consistency_score": 40.0
        }

    return state


def identify_weak_areas_node(state: ProgressState) -> ProgressState:
    """
    Node 3: Identify Weak Areas - Scans tutor errors, failed days, and low mock scores.
    """
    logger.info("Executing identify_weak_areas_node")
    raw = state.get("collected_raw_data", {})

    history_str = (
        f"Quiz Errors: {raw.get('quiz_errors_sample', [])}\n"
        f"Incomplete Study Topics: {raw.get('incomplete_topics_sample', [])}\n"
        f"Interview Mistakes: {raw.get('interview_mistakes_sample', [])}"
    )

    prompt = WEAK_TOPIC_DETECTION_SYSTEM_PROMPT.format(
        learning_history=history_str
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are an educational diagnostics tool that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        raw_content = response.choices[0].message.content or "{}"
        data = json.loads(raw_content)
        state["weak_topics"] = data.get("weak_topics", [])
    except Exception as e:
        logger.error(f"Identify weak areas node failed: {e}")
        state["weak_topics"] = []

    return state


def generate_recommendations_node(state: ProgressState) -> ProgressState:
    """
    Node 4: Generate Recommendations - Employs RAG similarity guides to write action roadmaps.
    """
    logger.info("Executing generate_recommendations_node")
    weak_list = state.get("weak_topics", [])
    user_id = state.get("user_id")

    weak_topics_str = ", ".join([w.get("topic", "") for w in weak_list])

    # Query RAG for study guides on these weak topics
    rag_str = "No knowledge base documents matched."
    if weak_topics_str:
        try:
            chunks = RAGService.search(user_id=user_id, question=f"Syllabus on {weak_topics_str}", top_k=3)
            rag_str = "\n\n".join([f"Source: {c['file_name']}\nContent: {c['text']}" for c in chunks])
        except Exception as err:
            logger.warning(f"RAG search failed in progress recommendations node: {err}")

    prompt = AI_RECOMMENDATION_SYSTEM_PROMPT.format(
        weak_topics=json.dumps(weak_list),
        rag_context=rag_str
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a placement advisor coach that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        raw_content = response.choices[0].message.content or "{}"
        data = json.loads(raw_content)
        state["recommendations"] = data.get("recommendations", [])
    except Exception as e:
        logger.error(f"Generate recommendations node failed: {e}")
        state["recommendations"] = []

    return state


def predict_readiness_node(state: ProgressState) -> ProgressState:
    """
    Node 5: Predict Readiness - Yields final scores and explanatory descriptions.
    """
    logger.info("Executing predict_readiness_node")
    raw = state.get("collected_raw_data", {})
    weak = state.get("weak_topics", [])
    recs = state.get("recommendations", [])

    prompt = READINESS_PREDICT_SYSTEM_PROMPT.format(
        raw_statistics=json.dumps(raw),
        weak_topics=json.dumps(weak),
        recommendations=json.dumps(recs)
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a placement readiness officer that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        raw_content = response.choices[0].message.content or "{}"
        state["readiness_prediction"] = json.loads(raw_content)
    except Exception as e:
        logger.error(f"Predict readiness node failed: {e}")
        state["readiness_prediction"] = {
            "placement_readiness": 50.0,
            "interview_readiness": 50.0,
            "study_consistency": 50.0,
            "readiness_explanation": "Placement prediction parameters fallback."
        }

    return state
