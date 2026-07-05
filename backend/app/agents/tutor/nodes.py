import json
import logging
from openai import OpenAI
from app.config.config import settings
from app.agents.tutor.state import TutorState
from app.rag.rag_service import RAGService
from app.agents.tutor.prompt import (
    TUTOR_EXPLANATION_SYSTEM_PROMPT,
    TUTOR_QUIZ_SYSTEM_PROMPT,
    TUTOR_FOLLOWUP_SYSTEM_PROMPT
)

logger = logging.getLogger("app.agents.tutor.nodes")


def retrieve_context_node(state: TutorState) -> TutorState:
    """
    RAG Search Node: Retrieves candidate document chunks matching the query string.
    """
    logger.info("Executing retrieve_context_node")
    user_id = state.get("user_id")
    question = state.get("question")

    try:
        # Search the knowledge base for top 5 matches
        context_chunks = RAGService.search(user_id=user_id, question=question, top_k=5)
        state["context_chunks"] = context_chunks
        logger.info(f"Retrieved {len(context_chunks)} chunks for context.")
    except Exception as e:
        logger.error(f"Retrieve context node failed: {e}")
        state["context_chunks"] = []

    return state


def generate_explanation_node(state: TutorState) -> TutorState:
    """
    Explanation Generation Node: Requests the primary structured explanation and analogy.
    """
    logger.info("Executing generate_explanation_node")
    question = state.get("question")
    context_chunks = state.get("context_chunks", [])

    # Format the retrieved context chunks as string block
    if context_chunks:
        context_blocks = []
        for index, chunk in enumerate(context_chunks):
            context_blocks.append(
                f"Chunk {index+1} from Document: '{chunk['file_name']}' (Page {chunk['page']})\n"
                f"Content: {chunk['text']}"
            )
        context_str = "\n\n---\n\n".join(context_blocks)
    else:
        context_str = "No relevant context document found. Provide general explanation."

    system_prompt = TUTOR_EXPLANATION_SYSTEM_PROMPT.format(
        context=context_str,
        question=question
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful university AI tutor that outputs JSON content."},
                {"role": "user", "content": system_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS
        )
        raw_content = response.choices[0].message.content or "{}"
        explanation_data = json.loads(raw_content)
        state["explanation"] = explanation_data
        logger.info("Successfully generated concept explanation.")
    except Exception as e:
        logger.error(f"Explanation generation node failed: {e}")
        state["explanation"] = {
            "explanation": f"The tutor was unable to generate an explanation due to a server error. Please try again. ({str(e)})",
            "simple_explanation": "An error occurred.",
            "analogy": "Error",
            "interview_points": [],
            "common_mistakes": []
        }

    return state


def generate_quiz_node(state: TutorState) -> TutorState:
    """
    Quiz Generation Node: Creates MCQs and open-ended practice questions.
    """
    logger.info("Executing generate_quiz_node")
    question = state.get("question")
    explanation_dict = state.get("explanation", {})
    explanation_text = explanation_dict.get("explanation", "")

    system_prompt = TUTOR_QUIZ_SYSTEM_PROMPT.format(
        question=question,
        explanation=explanation_text
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful university AI tutor that outputs JSON content."},
                {"role": "user", "content": system_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS
        )
        raw_content = response.choices[0].message.content or "{}"
        quiz_data = json.loads(raw_content)
        state["quiz"] = quiz_data
        logger.info("Successfully generated quiz.")
    except Exception as e:
        logger.error(f"Quiz generation node failed: {e}")
        state["quiz"] = {
            "mcqs": [],
            "practice_questions": []
        }

    return state


def generate_followup_node(state: TutorState) -> TutorState:
    """
    Follow-up Suggestion Node: Suggests 3 logical next learning steps.
    """
    logger.info("Executing generate_followup_node")
    question = state.get("question")
    explanation_dict = state.get("explanation", {})
    explanation_text = explanation_dict.get("explanation", "")

    system_prompt = TUTOR_FOLLOWUP_SYSTEM_PROMPT.format(
        question=question,
        explanation=explanation_text
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful university AI tutor that outputs JSON content."},
                {"role": "user", "content": system_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS
        )
        raw_content = response.choices[0].message.content or "{}"
        followup_data = json.loads(raw_content)
        state["followup"] = followup_data.get("followup", [])
        logger.info("Successfully generated follow-up suggestions.")
    except Exception as e:
        logger.error(f"Followup generation node failed: {e}")
        state["followup"] = []

    return state
