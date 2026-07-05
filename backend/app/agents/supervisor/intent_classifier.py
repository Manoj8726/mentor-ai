import json
import logging
from typing import List
from openai import OpenAI
from app.config.config import settings
from app.agents.supervisor.prompt import INTENT_CLASSIFY_SYSTEM_PROMPT

logger = logging.getLogger("app.agents.supervisor.intent_classifier")


class IntentClassifier:
    """
    Helper classifier executing prompt schemas to identify routing targets.
    """

    @staticmethod
    def classify(question: str) -> List[str]:
        logger.info(f"Classifying user intent: '{question}'")
        prompt = INTENT_CLASSIFY_SYSTEM_PROMPT.format(question=question)
        
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": "You are an AI router that output JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            raw_content = response.choices[0].message.content or "{}"
            data = json.loads(raw_content)
            intents = data.get("intents", ["tutor"])
            
            # Sanity filter against allowed scopes
            valid_intents = [i for i in intents if i in ("tutor", "planner", "interview", "progress")]
            return valid_intents if valid_intents else ["tutor"]
        except Exception as e:
            logger.error(f"Failed to classify intent: {e}")
            return ["tutor"]
