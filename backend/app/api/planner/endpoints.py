import logging
import uuid
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.auth.deps import get_current_active_user
from app.models.user import User
from app.schemas.planner import StudyPlanRequest, StudyPlanResponse, StudyDayResponse
from app.agents.planner.service import PlannerService

logger = logging.getLogger("app.api.planner.endpoints")
router = APIRouter()


@router.post("/create", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
def create_study_plan(
    request: StudyPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Submits goal, subjects, exam dates, skill levels, and weekdays.
    Invokes the shared RAG Planner state machine and persists the optimized plan.
    """
    logger.info(f"User {current_user.email} requested a new study plan creation.")
    
    # Simple input validation
    if request.exam_date <= datetime.now().date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The target exam date must be in the future."
        )

    try:
        plan = PlannerService.create_plan(db, current_user.id, request)
        response_dict = StudyPlanResponse.from_orm(plan)
        response_dict.progress_percentage = PlannerService.calculate_progress(plan)
        return response_dict
    except Exception as e:
        logger.error(f"Failed to generate study plan: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate study plan: {str(e)}"
        )


@router.get("/plans", response_model=List[StudyPlanResponse], status_code=status.HTTP_200_OK)
def list_study_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists all study plans created by the currently authenticated user.
    """
    plans = PlannerService.get_user_plans(db, current_user.id)
    
    response_list = []
    for plan in plans:
        resp = StudyPlanResponse.from_orm(plan)
        resp.progress_percentage = PlannerService.calculate_progress(plan)
        response_list.append(resp)
        
    return response_list


@router.get("/{plan_id}", response_model=StudyPlanResponse, status_code=status.HTTP_200_OK)
def get_study_plan(
    plan_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves full details and days of a specific study plan.
    """
    plan = PlannerService.get_plan_by_id(db, current_user.id, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found or access denied."
        )
        
    resp = StudyPlanResponse.from_orm(plan)
    resp.progress_percentage = PlannerService.calculate_progress(plan)
    return resp


@router.delete("/{plan_id}", status_code=status.HTTP_200_OK)
def delete_study_plan(
    plan_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Deletes the plan and cascades to wipe all daily progress items.
    """
    plan = PlannerService.get_plan_by_id(db, current_user.id, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found or access denied."
        )
        
    PlannerService.delete_plan(db, current_user.id, plan_id)
    return {"message": "Study plan deleted successfully.", "success": True}


@router.put("/day/{day_id}/complete", response_model=StudyDayResponse, status_code=status.HTTP_200_OK)
def complete_study_day(
    day_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Toggles a day's study checklist status between pending and completed.
    """
    day = PlannerService.toggle_day_completion(db, current_user.id, day_id)
    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study day not found or access denied."
        )
    return day
