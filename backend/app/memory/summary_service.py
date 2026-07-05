import logging
import uuid
from sqlalchemy.orm import Session
from openai import OpenAI

from app.config.config import settings
from app.models.conversation import Conversation, ConversationMessage

logger = logging.getLogger("app.memory.summary_service")


class SummaryService:
    """
    Service Layer compiling short-term dialogue memory summaries.
    """

    @staticmethod
    def summarize_conversation(db: Session, conversation_id: uuid.UUID) -> str:
        """
        Loads dialogue history and calls OpenAI to generate a concise summary.
        """
        logger.info(f"Summarizing conversation thread: {conversation_id}")

        # Fetch messages ordered by time
        messages = db.query(ConversationMessage).filter(
            ConversationMessage.conversation_id == conversation_id
        ).order_by(ConversationMessage.created_at.asc()).all()

        if not messages:
            return "Empty conversation thread."

        # Compile message text
        chat_transcript = ""
        for m in messages:
            role_label = "Student" if m.role == "user" else "Assistant"
            chat_transcript += f"{role_label}: {m.content}\n"

        # If too short, return a quick baseline summary
        if len(messages) <= 2:
            snippet = messages[0].content[:60]
            return f"Discussed initial topic: '{snippet}...'"

        prompt = (
            "You are an academic progress officer. Write a concise 2-3 sentence paragraph summarizing "
            "this conversation between a Student and their Assistant. Highlight what concepts were "
            "learned, what goals were established, and any pending questions.\n\n"
            f"Chat Transcript:\n{chat_transcript}"
        )

        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": "You are a professional dialogue summarizer."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.3
            )
            summary = response.choices[0].message.content or "No summary generated."
            logger.info(f"Summary completed for {conversation_id}")
            return summary.strip()
        except Exception as e:
            logger.error(f"Failed to compile conversation summary: {e}")
            return "Could not generate dialogue summary."
