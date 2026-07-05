import uuid
from datetime import datetime
from typing import List, Dict, Any
from pydantic import BaseModel, Field


class ResumeUploadResponse(BaseModel):
    id: uuid.UUID
    file_name: str
    parsed_json: Dict[str, Any]
    created_at: datetime


class ATSAnalysisRequest(BaseModel):
    resume_id: uuid.UUID
    target_role: str = Field(..., description="Target role (e.g. Backend Developer)")


# NEW MODEL
class ProjectSuggestion(BaseModel):
    title: str
    description: str


class ATSAnalysisResponse(BaseModel):
    ats_score: float = Field(..., ge=0, le=100)

    strengths: List[str]
    weaknesses: List[str]
    missing_skills: List[str]

    formatting_suggestions: List[str]
    keyword_suggestions: List[str]

    project_suggestions: List[ProjectSuggestion]


class CompanyPrepRequest(BaseModel):
    company_name: str = Field(..., min_length=2, description="Target company name")
    role: str = Field(..., description="Target role (e.g. Backend Developer)")


class CompanyPrepResponse(BaseModel):
    company: str
    role: str
    important_topics: List[str]
    likely_interview_areas: List[str]
    learning_roadmap: List[str]
    recommended_study_materials: List[Dict[str, Any]]
    preparation_checklist: List[str]


class MockInterviewRequest(BaseModel):
    role: str = Field(..., description="Target placement role")
    company: str = Field("Generic", description="Target company name")


class QuestionItem(BaseModel):
    id: uuid.UUID
    question: str
    category: str
    difficulty: str


class MockInterviewResponse(BaseModel):
    session_id: uuid.UUID
    company: str
    role: str
    questions: List[QuestionItem]


class AnswerSubmission(BaseModel):
    question_id: uuid.UUID
    student_answer: str = Field(..., min_length=1)


class MockSubmitRequest(BaseModel):
    session_id: uuid.UUID
    answers: List[AnswerSubmission]


class EvaluatedQuestionItem(BaseModel):
    id: uuid.UUID
    question: str
    category: str
    difficulty: str
    student_answer: str
    score: float = Field(..., ge=0, le=10)
    feedback: str


class MockSubmitResponse(BaseModel):
    session_id: uuid.UUID
    overall_score: float = Field(..., ge=0, le=100)
    strengths: str
    weaknesses: str
    recommendations: str
    questions: List[EvaluatedQuestionItem]


class SessionResponse(BaseModel):
    id: uuid.UUID
    company: str
    role: str
    overall_score: float
    created_at: datetime

    class Config:
        from_attributes = True