import logging
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.auth.deps import get_current_active_user
from app.models.user import User
from app.models.progress import WeakTopic, Recommendation, StudyStreak
from app.schemas.progress import (
    DashboardAnalyticsResponse,
    RecommendationResponse,
    WeakTopicResponse,
    StreakResponse
)
from app.agents.progress.service import ProgressService

logger = logging.getLogger("app.api.progress.endpoints")
router = APIRouter()


@router.get("/dashboard", response_model=DashboardAnalyticsResponse, status_code=status.HTTP_200_OK)
def get_progress_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves candidate's aggregated scores, streak trackers, weak topics list,
    recommendations checklist, and historical chart metrics.
    """
    try:
        data = ProgressService.get_dashboard_data(db, current_user.id)
        return data
    except Exception as e:
        logger.error(f"Failed to load progress dashboard: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard loading failed: {str(e)}"
        )


@router.post("/recalculate", response_model=DashboardAnalyticsResponse, status_code=status.HTTP_200_OK)
def trigger_progress_recalculation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Triggers the Progress Agent LangGraph workflow pipeline to compile fresh scores and roadmaps.
    """
    try:
        data = ProgressService.recalculate_analytics(db, current_user.id)
        return data
    except Exception as e:
        logger.error(f"Failed to recalculate analytics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recalculation failed: {str(e)}"
        )


@router.get("/recommendations", response_model=List[RecommendationResponse], status_code=status.HTTP_200_OK)
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists current active placement recommendations.
    """
    recs = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.id,
        Recommendation.status == "pending"
    ).all()
    return recs


@router.get("/weak-topics", response_model=List[WeakTopicResponse], status_code=status.HTTP_200_OK)
def get_weak_topics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists detected candidate weak concepts.
    """
    topics = db.query(WeakTopic).filter(WeakTopic.user_id == current_user.id).all()
    return topics


@router.get("/study-streak", response_model=StreakResponse, status_code=status.HTTP_200_OK)
def get_study_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves the current learning streak logs.
    """
    streak = ProgressService.get_or_create_streak(db, current_user.id)
    return streak


@router.put("/recommendations/{rec_id}", response_model=RecommendationResponse, status_code=status.HTTP_200_OK)
def update_recommendation_status(
    rec_id: uuid.UUID,
    rec_status: str,  # completed or dismissed
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates status of a recommendation. If marked completed, student streak is incremented.
    """
    if rec_status not in ("completed", "dismissed", "pending"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recommendation status. Must be completed, dismissed or pending."
        )

    rec = ProgressService.update_recommendation_status(db, current_user.id, rec_id, rec_status)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found or access denied."
        )
    return rec
