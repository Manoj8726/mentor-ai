import logging
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any

from app.api.auth.deps import get_current_active_user
from app.models.user import User
from app.rag.rag_service import RAGService

logger = logging.getLogger("app.api.rag.endpoints")
router = APIRouter()


class RAGSearchRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question or keywords to search for.")
    top_k: int = Field(default=5, ge=1, le=25, description="Number of matches to return.")


class RAGSearchResponseItem(BaseModel):
    chunk_id: str
    text: str
    score: float
    document_id: str
    file_name: str
    page: int
    chunk_number: int


class RAGSearchResponse(BaseModel):
    query: str
    results: List[RAGSearchResponseItem]


@router.post("/search", response_model=RAGSearchResponse, status_code=status.HTTP_200_OK)
def search_knowledge_base(
    request: RAGSearchRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Performs vector-based similarity search over the user's uploaded PDFs.
    Returns matched content chunks with relevance scores and page numbers.
    Does not run any LLM text generation.
    """
    logger.info(f"User {current_user.email} queried RAG similarity search.")
    
    results = RAGService.search(
        user_id=current_user.id,
        question=request.question,
        top_k=request.top_k
    )
    
    return {
        "query": request.question,
        "results": results
    }
