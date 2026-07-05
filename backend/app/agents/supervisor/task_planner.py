import json
import logging
from typing import List, Dict, Any
from openai import OpenAI
from app.config.config import settings
from app.agents.supervisor.prompt import TASK_PLANNER_SYSTEM_PROMPT

logger = logging.getLogger("app.agents.supervisor.task_planner")


class TaskPlanner:
    """
    Orchestration helper compiling sub-goals matching selected agents.
    """

    @staticmethod
    def plan(question: str, intents: List[str]) -> List[Dict[str, Any]]:
        logger.info(f"Generating task plan for question: '{question}' with intents: {intents}")
        prompt = TASK_PLANNER_SYSTEM_PROMPT.format(
            question=question,
            intents=", ".join(intents)
        )

        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": "You are a task organizer that outputs JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            raw_content = response.choices[0].message.content or "{}"
            data = json.loads(raw_content)
            tasks = data.get("tasks", [])
            
            # Sanity checks on target_agent keys
            for t in tasks:
                if t.get("target_agent") not in ("tutor", "planner", "interview", "progress"):
                    t["target_agent"] = "tutor"
            return tasks
        except Exception as e:
            logger.error(f"Failed to generate task plan: {e}")
            # Fallback single subtask
            return [{
                "title": "Examine conceptual query",
                "description": "Examine user's question and summarize key study concepts.",
                "target_agent": "tutor"
            }]
