import uuid
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class WeakTopicResponse(BaseModel):
    id: uuid.UUID
    topic: str
    confidence: float
    source: str

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    priority: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_active_date: Optional[date] = None

    class Config:
        from_attributes = True


class ChartDataPoint(BaseModel):
    label: str
    value: float


class DashboardAnalyticsResponse(BaseModel):
    overall_score: float = Field(..., ge=0, le=100)
    study_completion_percentage: float = Field(..., ge=0, le=100)
    interview_score: float = Field(..., ge=0, le=100)
    resume_score: float = Field(..., ge=0, le=100)
    knowledge_base_usage: int
    
    streak: StreakResponse
    weak_topics: List[WeakTopicResponse]
    recommendations: List[RecommendationResponse]
    
    # Readiness Scores
    placement_readiness: float = Field(..., ge=0, le=100)
    interview_readiness: float = Field(..., ge=0, le=100)
    study_consistency: float = Field(..., ge=0, le=100)
    readiness_explanation: str
    
    # Historical Chart Metrics
    weekly_activity_chart: List[Dict[str, Any]] = Field(
        ...,
        description="List of points for charts, e.g. [{'day': 'Mon', 'hours': 3, 'completed': 2}]"
    )
    interview_score_trend_chart: List[Dict[str, Any]] = Field(
        ...,
        description="List of interview scores over time, e.g. [{'date': '07/01', 'score': 85}]"
    )
