import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class UserPreferenceResponse(BaseModel):
    preferred_language: str
    preferred_role: str
    target_company: str
    daily_study_hours: float
    current_skill_level: str
    learning_style: str
    preferred_interview_type: str
    updated_at: datetime

    class Config:
        from_attributes = True


class UserPreferenceUpdate(BaseModel):
    preferred_language: Optional[str] = Field(None, min_length=1)
    preferred_role: Optional[str] = Field(None, min_length=1)
    target_company: Optional[str] = Field(None, min_length=1)
    daily_study_hours: Optional[float] = Field(None, ge=0.5, le=24.0)
    current_skill_level: Optional[str] = Field(None, min_length=1)
    learning_style: Optional[str] = Field(None, min_length=1)
    preferred_interview_type: Optional[str] = Field(None, min_length=1)


class LearningProfileResponse(BaseModel):
    strong_topics: List[str]
    weak_topics: List[str]
    completed_study_plans: int
    completed_interviews: int
    resume_score: float
    placement_readiness: float
    last_learning_activity: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationHeaderResponse(BaseModel):
    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SummarizeRequest(BaseModel):
    conversation_id: uuid.UUID
