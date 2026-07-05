import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field


class StudyPlanRequest(BaseModel):
    goal: str = Field(..., min_length=5, description="Student's main study goal (e.g. 'Java interview prep')")
    subjects: str = Field(..., min_length=2, description="Subjects or concepts to focus on (comma-separated)")
    hours_per_day: int = Field(..., ge=1, le=12, description="Available study hours per day")
    exam_date: date = Field(..., description="Target completion or exam date")
    skill_level: str = Field("Beginner", description="Current skill level (Beginner, Intermediate, Advanced)")
    preferred_study_days: List[str] = Field(
        default=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        description="List of weekdays when study sessions can be scheduled"
    )


class StudyDayResponse(BaseModel):
    id: uuid.UUID
    study_plan_id: uuid.UUID
    day_number: int
    date: date
    topic: str
    estimated_hours: int
    status: str

    class Config:
        from_attributes = True


class StudyPlanResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    goal: str
    start_date: date
    end_date: date
    hours_per_day: int
    status: str
    created_at: datetime
    updated_at: datetime
    progress_percentage: float = Field(0.0, description="Percentage of days completed in this plan")
    days: List[StudyDayResponse] = []

    class Config:
        from_attributes = True
