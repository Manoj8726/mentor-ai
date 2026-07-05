import uuid
import json
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.conversation import Conversation, ConversationMessage
from app.agents.tutor.graph import tutor_graph
from app.agents.tutor.state import TutorState

logger = logging.getLogger("app.agents.tutor.service")


class TutorService:
    """
    Coordinator orchestrating LangGraph execution and PostgreSQL/MySQL conversation history persistence.
    """

    @staticmethod
    def process_chat(
        db: Session,
        user_id: uuid.UUID,
        question: str,
        conversation_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """
        Manages the chat flow:
        - Resolves or creates a Conversation entity.
        - Persists the user's question message.
        - Runs the RAG + LangGraph node flow to get structured tutorial values.
        - Saves the assistant response as serialized JSON.
        - Returns a structured dictionary matching TutorChatResponse schema.
        """
        # 1. Resolve or create active conversation thread
        if conversation_id:
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            ).first()
            
            if not conversation:
                logger.warning(f"Thread {conversation_id} not found for user {user_id}. Initializing new conversation.")
                conversation = Conversation(
                    user_id=user_id,
                    title=question[:45] + ("..." if len(question) > 45 else "")
                )
                db.add(conversation)
                db.commit()
                db.refresh(conversation)
        else:
            conversation = Conversation(
                user_id=user_id,
                title=question[:45] + ("..." if len(question) > 45 else "")
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # 2. Record student message in database
        user_message = ConversationMessage(
            conversation_id=conversation.id,
            role="user",
            content=question
        )
        db.add(user_message)
        db.commit()

        # 3. Initialize LangGraph starting state
        initial_state = TutorState(
            user_id=user_id,
            question=question,
            context_chunks=[],
            explanation={},
            quiz={},
            followup=[]
        )

        logger.info(f"Invoking Tutor Agent LangGraph workflow for conversation: {conversation.id}")
        
        # Execute workflow nodes
        final_state = tutor_graph.invoke(initial_state)

        # Extract node results
        explanation_data = final_state.get("explanation", {})
        quiz_data = final_state.get("quiz", {})
        followup_list = final_state.get("followup", [])
        context_chunks = final_state.get("context_chunks", [])

        # Formulate structured assistant payload
        assistant_content = {
            "explanation": explanation_data.get("explanation", "Could not compile explanation."),
            "simple_explanation": explanation_data.get("simple_explanation", ""),
            "analogy": explanation_data.get("analogy", ""),
            "interview_points": explanation_data.get("interview_points", []),
            "common_mistakes": explanation_data.get("common_mistakes", []),
            "practice_questions": quiz_data.get("practice_questions", []),
            "mcqs": quiz_data.get("mcqs", []),
            "followup_topics": followup_list,
            "sources": [
                {
                    "document_id": str(chunk["document_id"]),
                    "file_name": chunk["file_name"],
                    "page": chunk["page"],
                    "score": chunk["score"],
                    "text": chunk["text"]
                }
                for chunk in context_chunks
            ]
        }

        # 4. Record serialized assistant message in database
        assistant_message = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=json.dumps(assistant_content)
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)

        # 5. Return mapped response fields
        return {
            "conversation_id": conversation.id,
            "message_id": assistant_message.id,
            "question": question,
            "explanation": assistant_content["explanation"],
            "simple_explanation": assistant_content["simple_explanation"],
            "analogy": assistant_content["analogy"],
            "interview_points": assistant_content["interview_points"],
            "common_mistakes": assistant_content["common_mistakes"],
            "practice_questions": assistant_content["practice_questions"],
            "mcqs": assistant_content["mcqs"],
            "followup_topics": assistant_content["followup_topics"],
            "sources": assistant_content["sources"]
        }
