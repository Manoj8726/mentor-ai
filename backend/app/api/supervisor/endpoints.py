import logging
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.auth.deps import get_current_active_user
from app.models.user import User
from app.models.conversation import Conversation, ConversationMessage
from app.schemas.supervisor import (
    SupervisorChatRequest,
    SupervisorChatResponse,
    SupervisorConversationHeader,
    SupervisorConversationDetail,
    SupervisorMessageResponse
)
from app.agents.supervisor.service import SupervisorService

logger = logging.getLogger("app.api.supervisor.endpoints")
router = APIRouter()


@router.post("/chat", response_model=SupervisorChatResponse, status_code=status.HTTP_200_OK)
def supervisor_chat_endpoint(
    payload: SupervisorChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Coordinates Intent Detection, Task Planning, Concurrency Selection,
    and Output Merging for Student Orchestration Queries.
    """
    logger.info(f"Received supervisor chat request from user: {current_user.id}")
    try:
        result = SupervisorService.execute_supervisor(
            db=db,
            user_id=current_user.id,
            question=payload.question,
            conversation_id=payload.conversation_id
        )
        return result
    except Exception as e:
        logger.error(f"Supervisor Agent execution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Supervisor flow failed: {str(e)}"
        )


@router.get("/conversations", response_model=List[SupervisorConversationHeader], status_code=status.HTTP_200_OK)
def list_supervisor_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists the user's supervisor orchestration conversations.
    """
    convs = db.query(Conversation).filter(
        Conversation.user_id == current_user.id,
        Conversation.title.like("Supervisor: %")
    ).order_by(Conversation.updated_at.desc()).all()
    return convs


@router.get("/conversation/{conv_id}", response_model=SupervisorConversationDetail, status_code=status.HTTP_200_OK)
def get_supervisor_conversation(
    conv_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Loads conversation thread details including message logs.
    """
    conv = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )

    messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conv_id
    ).order_by(ConversationMessage.created_at.asc()).all()

    return {
        "id": conv.id,
        "title": conv.title,
        "messages": messages
    }


@router.delete("/conversation/{conv_id}", status_code=status.HTTP_200_OK)
def delete_supervisor_conversation(
    conv_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Clears conversation logs.
    """
    conv = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )

    db.delete(conv)
    db.commit()
    return {"status": "success", "message": "Conversation thread deleted successfully."}
