import uuid
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.conversation import Conversation, ConversationMessage
from app.agents.supervisor.graph import supervisor_graph
from app.agents.supervisor.state import SupervisorState

logger = logging.getLogger("app.agents.supervisor.service")


class SupervisorService:
    """
    Orchestrator Service Coordinating chat workflows and recording history elements.
    """

    @staticmethod
    def execute_supervisor(
        db: Session,
        user_id: uuid.UUID,
        question: str,
        conversation_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        logger.info(f"Running SupervisorService for user: {user_id}")

        # 1. Resolve or create chat conversation thread
        conversation = None
        if conversation_id:
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            ).first()

        if not conversation:
            title_text = question[:40] + "..." if len(question) > 40 else question
            conversation = Conversation(
                user_id=user_id,
                title=f"Supervisor: {title_text}"
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # 2. Append User message to DB
        user_msg = ConversationMessage(
            conversation_id=conversation.id,
            role="user",
            content=question
        )
        db.add(user_msg)
        db.commit()

# 3. Initialize state and execute LangGraph workflow
        from app.memory.manager import MemoryManager
        memory_ctx = MemoryManager.get_memory_context(db, user_id, conversation.id)

        initial_state = SupervisorState(
            user_id=user_id,
            question=question,
            detected_intents=[],
            task_plan=[],
            agents_to_run=[],
            agent_outputs={},
            merged_sources=[],
            merged_recommendations=[],
            final_response="",
            memory_context=memory_ctx
        )

        final_state = supervisor_graph.invoke(initial_state)

        final_answer = final_state.get("final_response", "Orchestrator could not aggregate sub-agent logs.")

        # 4. Append Assistant response to DB
        assistant_msg = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=final_answer
        )
        db.add(assistant_msg)
        db.commit()

        return {
            "conversation_id": conversation.id,
            "intent": final_state.get("detected_intents", []),
            "agents_used": final_state.get("agents_to_run", []),
            "final_answer": final_answer,
            "sources": final_state.get("merged_sources", []),
            "recommendations": final_state.get("merged_recommendations", [])
        }
