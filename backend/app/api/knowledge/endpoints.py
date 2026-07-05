import os
import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.rag.indexing_service import IndexingService

from app.database.session import get_db
from app.api.auth.deps import get_current_active_user
from app.models.user import User
from app.repositories.document import DocumentRepository
from app.services.document import DocumentService
from app.schemas.document import DocumentResponse, DocumentUploadResponse, DocumentListResponse, DeleteDocumentResponse

router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Accepts multipart PDF file uploads, runs PyMuPDF validation, checks sizes, and registers metadata.
    Queues document indexing in the background.
    """
    db_doc = DocumentService.upload_document(db, current_user.id, file)
    background_tasks.add_task(IndexingService.index_document_task, db_doc.id)
    return {
        "message": "File uploaded and processed successfully. Indexing has started in the background.",
        "document": db_doc
    }


@router.get("/documents", response_model=DocumentListResponse)
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves all Knowledge Base documents uploaded by the currently authenticated user.
    """
    docs = DocumentRepository.get_user_documents(db, current_user.id)
    return {"documents": docs}


@router.get("/document/{doc_id}", response_model=DocumentResponse)
def get_document_metadata(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves metadata details for a specific document, validating ownership.
    """
    db_doc = DocumentRepository.get_by_id(db, doc_id, current_user.id)
    if not db_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )
    return db_doc


@router.delete("/document/{doc_id}", response_model=DeleteDocumentResponse)
def delete_document(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Deletes the physical file from the disk and removes metadata from the database.
    """
    DocumentService.delete_document(db, current_user.id, doc_id)
    return {
        "message": "Document successfully deleted.",
        "success": True
    }


@router.get("/download/{doc_id}")
def download_document(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Downloads the physical PDF document. Restricts download access to the owner.
    """
    db_doc = DocumentRepository.get_by_id(db, doc_id, current_user.id)
    if not db_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )
        
    if not os.path.exists(db_doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical document is missing from file storage."
        )
        
    return FileResponse(
        path=db_doc.file_path,
        filename=db_doc.original_name,
        media_type="application/pdf"
    )


@router.post("/reindex/{doc_id}", response_model=DocumentResponse, status_code=status.HTTP_200_OK)
def reindex_document(
    doc_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Manually triggers background re-indexing of a document.
    Clears previous index state and schedules vector processing task.
    """
    db_doc = DocumentRepository.get_by_id(db, doc_id, current_user.id)
    if not db_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )

    # Set status to indexing and reset error logs
    db_doc.index_status = "indexing"
    db_doc.index_error = None
    db_doc.index_started_at = datetime.utcnow()
    db.commit()

    background_tasks.add_task(IndexingService.index_document_task, db_doc.id)
    return db_doc


@router.get("/index-status/{doc_id}", status_code=status.HTTP_200_OK)
def get_indexing_status(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Queries current index status (uploaded, indexing, indexed, failed) and returns detail logs.
    """
    db_doc = DocumentRepository.get_by_id(db, doc_id, current_user.id)
    if not db_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )

    return {
        "document_id": db_doc.id,
        "index_status": db_doc.index_status,
        "index_started_at": db_doc.index_started_at,
        "index_completed_at": db_doc.index_completed_at,
        "index_error": db_doc.index_error,
        "total_chunks": db_doc.total_chunks,
        "embedding_model": db_doc.embedding_model
    }
