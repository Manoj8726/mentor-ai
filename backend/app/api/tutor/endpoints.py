import json
import logging
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.auth.deps import get_current_active_user
from app.models.user import User
from app.models.conversation import Conversation, ConversationMessage
from app.schemas.conversation import (
    TutorChatRequest,
    TutorChatResponse,
    ConversationResponse,
    MessageResponse
)
from app.agents.tutor.service import TutorService

logger = logging.getLogger("app.api.tutor.endpoints")
router = APIRouter()


@router.post("/chat", response_model=TutorChatResponse, status_code=status.HTTP_200_OK)
def tutor_chat(
    request: TutorChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Submits a student concept query, runs the LangGraph RAG Tutor pipeline,
    records chat histories, and returns a detailed structured learning response.
    """
    logger.info(f"Student {current_user.email} queried Tutor Agent.")
    
    try:
        response = TutorService.process_chat(
            db=db,
            user_id=current_user.id,
            question=request.question,
            conversation_id=request.conversation_id
        )
        return response
    except Exception as e:
        logger.error(f"Error executing Tutor Agent pipeline: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e) or "An error occurred while running the Tutor Agent."
        )


@router.get("/conversations", response_model=List[ConversationResponse], status_code=status.HTTP_200_OK)
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves all conversation thread headers for the currently authenticated user, sorted by newest first.
    """
    logger.info(f"Loading conversation history for user {current_user.email}")
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()
    return conversations


@router.get("/conversation/{conv_id}", status_code=status.HTTP_200_OK)
def get_conversation_details(
    conv_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves the complete message log for a given conversation thread.
    Deserializes assistant JSON content blobs on-the-fly for clean layout rendering.
    """
    logger.info(f"Loading details for conversation {conv_id}")
    conversation = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )

    messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conv_id
    ).order_by(ConversationMessage.created_at.asc()).all()

    # Format output by parsing assistant JSON strings
    formatted_messages = []
    for msg in messages:
        content = msg.content
        if msg.role == "assistant":
            try:
                content = json.loads(msg.content)
            except Exception as parse_error:
                logger.warning(f"Failed to parse assistant JSON for message {msg.id}: {parse_error}")
                # Fallback to string representation if parsing fails
                pass
                
        formatted_messages.append({
            "id": msg.id,
            "role": msg.role,
            "content": content,
            "created_at": msg.created_at
        })

    return {
        "conversation": {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at
        },
        "messages": formatted_messages
    }


@router.delete("/conversation/{conv_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conv_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Deletes the conversation thread header and cascades deletion to all message logs.
    """
    logger.info(f"Deleting conversation thread: {conv_id}")
    conversation = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )

    try:
        db.delete(conversation)
        db.commit()
        return {"message": "Conversation successfully deleted.", "success": True}
    except Exception as e:
        logger.error(f"Failed to delete conversation: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database deletion failure."
        )
