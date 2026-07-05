import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SupervisorChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Student's query/prompt for orchestration")
    conversation_id: Optional[uuid.UUID] = Field(None, description="Optional supervisor conversation ID")


class SourceItem(BaseModel):
    document_id: str
    file_name: str
    page: int
    score: float


class SupervisorChatResponse(BaseModel):
    conversation_id: uuid.UUID = Field(..., description="Active conversation session ID")
    intent: List[str] = Field(..., description="Detected user intentions (e.g. tutor, planner)")
    agents_used: List[str] = Field(..., description="Active agents executed (e.g. Tutor Agent)")
    final_answer: str = Field(..., description="Consolidated answer text output in Markdown format")
    sources: List[SourceItem] = Field(default_factory=list, description="Retrieved syllabus sources list")
    recommendations: List[str] = Field(default_factory=list, description="Consolidated learning checklists items")


class SupervisorConversationHeader(BaseModel):
    id: uuid.UUID
    title: str
    created_at: Any
    updated_at: Any

    class Config:
        from_attributes = True


class SupervisorMessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: Any

    class Config:
        from_attributes = True


class SupervisorConversationDetail(BaseModel):
    id: uuid.UUID
    title: str
    messages: List[SupervisorMessageResponse]

