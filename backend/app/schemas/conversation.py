import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ConversationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class TutorChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The query message/question from the student.")
    conversation_id: Optional[uuid.UUID] = Field(None, description="Active conversation UUID. If null, a new chat is started.")


class MCQItem(BaseModel):
    question: str = Field(..., description="The multiple choice question string.")
    options: List[str] = Field(..., description="Array of four choice options.")
    correct_answer: str = Field(..., description="The correct answer string corresponding to one option.")
    explanation: str = Field(..., description="Brief explanation why the answer is correct.")


class SourceCitation(BaseModel):
    document_id: str
    file_name: str
    page: int
    score: float
    text: str


class TutorChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    question: str
    
    # Structured outcomes from LangGraph Tutor Agent
    explanation: str = Field(..., description="Comprehensive explanation of the concept.")
    simple_explanation: str = Field(..., description="Simplistic, high-level, laymans description.")
    analogy: str = Field(..., description="Real-world comparison or analogy.")
    interview_points: List[str] = Field(..., description="Common interview questions or focus areas.")
    common_mistakes: List[str] = Field(..., description="Typical traps or pitfalls students encounter.")
    practice_questions: List[str] = Field(..., description="Three conceptual/coding questions for active review.")
    mcqs: List[MCQItem] = Field(..., description="Three multiple-choice questions.")
    followup_topics: List[str] = Field(..., description="Three suggestions for next topic targets.")
    sources: List[SourceCitation] = Field(..., description="Matched document citations supporting the context.")
