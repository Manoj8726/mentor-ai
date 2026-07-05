import json
import logging
import asyncio
from typing import Dict, Any, List
from openai import OpenAI

from app.config.config import settings
from app.database.session import SessionLocal
from app.agents.supervisor.state import SupervisorState
from app.agents.supervisor.intent_classifier import IntentClassifier
from app.agents.supervisor.task_planner import TaskPlanner
from app.agents.supervisor.response_merger import ResponseMerger

# Sub-agents service layers
from app.rag.rag_service import RAGService
from app.models.interview import Resume
from app.models.progress import StudyStreak, LearningAnalytics

logger = logging.getLogger("app.agents.supervisor.nodes")


def intent_detection_node(state: SupervisorState) -> SupervisorState:
    """
    Node 1: Intent Detection - Classifies student's goal intents.
    """
    logger.info("Executing intent_detection_node")
    question = state.get("question", "")
    intents = IntentClassifier.classify(question)
    state["detected_intents"] = intents
    return state


def task_planner_node(state: SupervisorState) -> SupervisorState:
    """
    Node 2: Task Planner - Compiles execution plans containing subtask items.
    """
    logger.info("Executing task_planner_node")
    question = state.get("question", "")
    intents = state.get("detected_intents", [])
    tasks = TaskPlanner.plan(question, intents)
    state["task_plan"] = tasks
    return state


def agent_selector_node(state: SupervisorState) -> SupervisorState:
    """
    Node 3: Agent Selector - Identifies target agent names.
    """
    logger.info("Executing agent_selector_node")
    tasks = state.get("task_plan", [])
    
    agent_mapping = {
        "tutor": "Tutor Agent",
        "planner": "Study Planner Agent",
        "interview": "Interview Agent",
        "progress": "Progress Agent"
    }

    selected_agents = []
    for t in tasks:
        target = t.get("target_agent", "tutor")
        mapped_name = agent_mapping.get(target)
        if mapped_name and mapped_name not in selected_agents:
            selected_agents.append(mapped_name)

    state["agents_to_run"] = selected_agents if selected_agents else ["Tutor Agent"]
    return state


def parallel_agent_execution_node(state: SupervisorState) -> SupervisorState:
    """
    Node 4: Agent Execution - Executes specialized sub-agents concurrently.
    Extracts relevant sources and recommendations.
    """
    logger.info("Executing parallel_agent_execution_node")
    agents = state.get("agents_to_run", [])
    question = state.get("question", "")
    user_id = state.get("user_id")

    # Retrieve memory context values
    mem_ctx = state.get("memory_context", {})
    prefs = mem_ctx.get("preferences", {})
    prof = mem_ctx.get("learning_profile", {})

    outputs = {}
    sources_collected = []

    # Local DB connection block
    db = SessionLocal()
    try:
        for agent in agents:
            logger.info(f"Invoking sub-agent: {agent}")
            
            if agent == "Tutor Agent":
                # Tutor logic: similarity search RAG + LLM explanation
                try:
                    chunks = RAGService.search(user_id=user_id, question=question, top_k=3)
                    for c in chunks:
                        sources_collected.append({
                            "document_id": str(c["document_id"]),
                            "file_name": c["file_name"],
                            "page": c["page"],
                            "score": c["score"]
                        })
                    
                    rag_context = "\n\n".join([f"Source: {c['file_name']}\nContent: {c['text']}" for c in chunks])
                    
                    preferred_role = prefs.get("preferred_role", "Developer")
                    learning_style = prefs.get("learning_style", "Visual")
                    weak_topics = ", ".join(prof.get("weak_topics", []))
                    
                    prompt = (
                        f"Answer the student's question based on RAG context.\n\n"
                        f"Student Profile Context:\n"
                        f"- Preferred Career Role: {preferred_role}\n"
                        f"- Learning Style: {learning_style}\n"
                        f"- Known Weak Topics: {weak_topics}\n\n"
                        f"Question: {question}\n\n"
                        f"Context:\n{rag_context}"
                    )
                    
                    client = OpenAI(api_key=settings.OPENAI_API_KEY)
                    response = client.chat.completions.create(
                        model=settings.OPENAI_CHAT_MODEL,
                        messages=[
                            {"role": "system", "content": "You are a professional academic tutor."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=settings.OPENAI_TEMPERATURE
                    )
                    outputs[agent] = response.choices[0].message.content or "No response from tutor agent."
                except Exception as err:
                    logger.error(f"Tutor Agent execution failed: {err}")
                    outputs[agent] = "Tutor Agent encountered an issue."

            elif agent == "Study Planner Agent":
                # Planner logic: Generates a 3-day checklist study timeline
                try:
                    daily_hours = prefs.get("daily_study_hours", 2.0)
                    skill_level = prefs.get("current_skill_level", "Beginner")
                    
                    prompt = (
                        f"The student wants a brief study plan for: '{question}'.\n\n"
                        f"Student Profile Context:\n"
                        f"- Target Daily Study Limit: {daily_hours} hours/day\n"
                        f"- Skill Level: {skill_level}\n\n"
                        f"Generate a 3-day study schedule with topic milestones in Markdown."
                    )
                    client = OpenAI(api_key=settings.OPENAI_API_KEY)
                    response = client.chat.completions.create(
                        model=settings.OPENAI_CHAT_MODEL,
                        messages=[
                            {"role": "system", "content": "You are a curriculum designer planner."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=settings.OPENAI_TEMPERATURE
                    )
                    outputs[agent] = response.choices[0].message.content or "No response from planner agent."
                except Exception as err:
                    logger.error(f"Planner Agent execution failed: {err}")
                    outputs[agent] = "Planner Agent encountered an issue."

            elif agent == "Interview Agent":
                # Interview logic: Check resume profile and suggest ATS keyword upgrades
                try:
                    resume = db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).first()
                    skills_str = "No resume uploaded."
                    if resume:
                        import json
                        try:
                            parsed = json.loads(resume.parsed_json)
                            skills_str = f"Skills present: {', '.join(parsed.get('skills', []))}"
                        except Exception:
                            pass
                    
                    target_company = prefs.get("target_company", "Any Company")
                    interview_type = prefs.get("preferred_interview_type", "Technical Coding")
                    resume_score = prof.get("resume_score", 0.0)
                    
                    prompt = (
                        f"The student wants placement prep advice for: '{question}'.\n\n"
                        f"Student Profile Context:\n"
                        f"- Target Company Goal: {target_company}\n"
                        f"- Interview Focus Type: {interview_type}\n"
                        f"- Resume ATS score: {resume_score}/100\n"
                        f"- Resume status: {skills_str}\n\n"
                        f"Give 3 concrete interview tips and ATS keyword suggestions in Markdown."
                    )
                    client = OpenAI(api_key=settings.OPENAI_API_KEY)
                    response = client.chat.completions.create(
                        model=settings.OPENAI_CHAT_MODEL,
                        messages=[
                            {"role": "system", "content": "You are a technical recruiter panelist."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=settings.OPENAI_TEMPERATURE
                    )
                    outputs[agent] = response.choices[0].message.content or "No response from interview agent."
                except Exception as err:
                    logger.error(f"Interview Agent execution failed: {err}")
                    outputs[agent] = "Interview Agent encountered an issue."

            elif agent == "Progress Agent":
                # Progress logic: Load active study streak and diagnostics summaries
                try:
                    completed_plans = prof.get("completed_study_plans", 0)
                    completed_interviews = prof.get("completed_interviews", 0)
                    placement_readiness = prof.get("placement_readiness", 55.0)
                    
                    outputs[agent] = (
                        f"**Completed Study Plans**: {completed_plans}\n"
                        f"**Mock Interview Trials**: {completed_interviews}\n"
                        f"**Placement Readiness Forecast**: {placement_readiness:.1f}%\n"
                        f"Remarks: Review weak areas to improve readiness."
                    )
                except Exception as err:
                    logger.error(f"Progress Agent execution failed: {err}")
                    outputs[agent] = "Progress Agent encountered an issue."

        state["agent_outputs"] = outputs
        
        # Merge source items cleanly ensuring unique keys
        unique_sources = {}
        for s in sources_collected:
            unique_sources[s["document_id"]] = s
        state["merged_sources"] = list(unique_sources.values())
        
    finally:
        db.close()

    return state


def response_aggregation_node(state: SupervisorState) -> SupervisorState:
    """
    Node 5: Response Aggregation - Collects all output sections.
    """
    logger.info("Executing response_aggregation_node")
    # Pass-through node to prepare data for merger prompt
    return state


def response_formatter_node(state: SupervisorState) -> SupervisorState:
    """
    Node 6: Response Formatter - Formats final Markdown reports.
    """
    logger.info("Executing response_formatter_node")
    question = state.get("question", "")
    task_plan = state.get("task_plan", [])
    outputs = state.get("agent_outputs", {})

    merged = ResponseMerger.merge(question, task_plan, outputs)
    state["final_response"] = merged.get("final_answer", "Consolidated answer report.")
    state["merged_recommendations"] = merged.get("recommendations", [])
    
    return state
