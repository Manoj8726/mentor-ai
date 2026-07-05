import json
import logging
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.auth.deps import get_current_active_user
from app.models.user import User
from app.models.conversation import Conversation
from app.schemas.memory import (
    UserPreferenceResponse,
    UserPreferenceUpdate,
    LearningProfileResponse,
    ConversationHeaderResponse,
    SummarizeRequest
)
from app.memory.profile_service import ProfileService
from app.memory.learning_service import LearningService
from app.memory.summary_service import SummaryService

logger = logging.getLogger("app.api.memory.endpoints")
router = APIRouter()


@router.get("/profile", response_model=UserPreferenceResponse, status_code=status.HTTP_200_OK)
def get_user_profile_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves the user's personalization preferences card.
    """
    return ProfileService.get_or_create_preference(db, current_user.id)


@router.put("/profile", response_model=UserPreferenceResponse, status_code=status.HTTP_200_OK)
def update_user_profile_preferences(
    payload: UserPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Modifies candidate personalization preference filters.
    """
    return ProfileService.update_preference(db, current_user.id, payload)


@router.get("/learning", response_model=LearningProfileResponse, status_code=status.HTTP_200_OK)
def get_learning_profile_memory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Resolves consolidated learning metrics summaries including strengths and weaknesses lists.
    """
    profile = LearningService.get_or_create_learning_profile(db, current_user.id)
    
    try:
        strong_list = json.loads(profile.strong_topics)
        weak_list = json.loads(profile.weak_topics)
    except Exception:
        strong_list = []
        weak_list = []

    return {
        "strong_topics": strong_list,
        "weak_topics": weak_list,
        "completed_study_plans": profile.completed_study_plans,
        "completed_interviews": profile.completed_interviews,
        "resume_score": profile.resume_score,
        "placement_readiness": profile.placement_readiness,
        "last_learning_activity": profile.last_learning_activity,
        "updated_at": profile.updated_at
    }


@router.get("/conversations", response_model=List[ConversationHeaderResponse], status_code=status.HTTP_200_OK)
def get_all_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves list of all active chat threads (Tutor or Supervisor) for the user.
    """
    convs = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()
    return convs


@router.delete("/conversation/{conv_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conv_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Clears target conversation logs and updates caches.
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
    
    # Recalculate learning aggregates in background cache
    try:
        LearningService.update_learning_profile_cache(db, current_user.id)
    except Exception as err:
        logger.warning(f"Could not refresh learning profile cache after delete: {err}")

    return {"status": "success", "message": "Conversation thread removed successfully."}


@router.post("/summarize", status_code=status.HTTP_200_OK)
def post_conversation_summary(
    payload: SummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Triggers summary compilation for the selected conversation thread.
    """
    # Verify owner
    conv = db.query(Conversation).filter(
        Conversation.id == payload.conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation thread not found or access denied."
        )

    summary = SummaryService.summarize_conversation(db, payload.conversation_id)
    return {"summary": summary}
