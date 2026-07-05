import json
import logging
from typing import List, Dict, Any
from openai import OpenAI
from app.config.config import settings
from app.agents.supervisor.prompt import RESPONSE_MERGE_SYSTEM_PROMPT

logger = logging.getLogger("app.agents.supervisor.response_merger")


class ResponseMerger:
    """
    Orchestration helper combining Markdown logs from sub-agents.
    """

    @staticmethod
    def merge(question: str, task_plan: List[Dict[str, Any]], agent_outputs: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Merging outputs from sub-agents for question: '{question}'")
        prompt = RESPONSE_MERGE_SYSTEM_PROMPT.format(
            question=question,
            task_plan=json.dumps(task_plan),
            agent_outputs=json.dumps(agent_outputs)
        )

        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": "You are a response compiler that outputs JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            raw_content = response.choices[0].message.content or "{}"
            data = json.loads(raw_content)
            
            return {
                "final_answer": data.get("final_answer", "Consolidated answer content."),
                "recommendations": data.get("recommendations", [])
            }
        except Exception as e:
            logger.error(f"Failed to merge outputs: {e}")
            
            # Simple fallback string builder
            consolidated = "## Summary of Agent Answers\n\n"
            for agent, out in agent_outputs.items():
                consolidated += f"### {agent.capitalize()} Output\n{str(out)}\n\n"
            
            return {
                "final_answer": consolidated,
                "recommendations": []
            }
