import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    file_name: str
    original_name: str
    file_path: str
    file_size: int
    mime_type: str
    upload_status: str
    
    # Index Status Properties
    index_status: str
    index_started_at: Optional[datetime] = None
    index_completed_at: Optional[datetime] = None
    index_error: Optional[str] = None
    total_chunks: Optional[int] = None
    embedding_model: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    message: str
    document: DocumentResponse


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]


class DeleteDocumentResponse(BaseModel):
    message: str
    success: bool = True
