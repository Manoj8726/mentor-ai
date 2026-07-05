import logging
import os
import uuid
import fitz  # PyMuPDF
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.document import DocumentRepository
from app.services.storage import FileStorageService
from app.models.document import Document

logger = logging.getLogger("app.document_service")

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 Megabytes in bytes


class DocumentService:
    """
    Service containing business logic for document checks, validation, and storage.
    """

    @staticmethod
    def validate_pdf_content(file_bytes: bytes) -> bool:
        """
        Uses PyMuPDF to test if a raw bytes stream represents a valid, uncorrupted PDF.
        """
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            is_valid = doc.is_pdf and not doc.is_closed
            doc.close()
            return is_valid
        except Exception as e:
            logger.warning(f"PyMuPDF failed to parse file stream: {e}")
            return False

    @classmethod
    def upload_document(cls, db: Session, user_id: uuid.UUID, file: UploadFile) -> Document:
        """
        Validates the PDF MIME type, constraints file sizes, rejects duplicate names,
        saves the file to local storage, and logs metadata.
        """
        original_name = file.filename or "unknown.pdf"

        # Check basic mime type and filename extensions
        if not (file.content_type == "application/pdf" or original_name.lower().endswith(".pdf")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF documents are allowed."
            )

        # Read file stream to check size and content validity
        try:
            file_bytes = file.file.read()
            file_size = len(file_bytes)
        except Exception as e:
            logger.error(f"Failed to read file stream: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not read uploaded file stream."
            )

        # Validate maximum file size limit
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of 25MB (Size: {file_size / (1024 * 1024):.2f}MB)."
            )

        # Verify PDF stream validity
        if not cls.validate_pdf_content(file_bytes):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF document. The file is corrupted or not a valid PDF."
            )

        # Check if user already uploaded a document with this identical name
        existing_doc = DocumentRepository.get_by_name(db, original_name, user_id)
        if existing_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A document with this name already exists in your Knowledge Base."
            )

        # Reset stream pointer back to beginning so storage service can write it
        file.file.seek(0)

        # Save physical file to disk
        try:
            saved_path = FileStorageService.save_file(user_id, file)
        except Exception as e:
            logger.error(f"Error calling storage service: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Storage service write failure."
            )

        # Write metadata record to DB
        try:
            db_doc = DocumentRepository.create(
                db=db,
                user_id=user_id,
                file_name=os.path.basename(saved_path),
                original_name=original_name,
                file_path=saved_path,
                file_size=file_size,
                mime_type="application/pdf"
            )
            return db_doc
        except Exception as e:
            logger.error(f"Failed to create DB metadata: {e}")
            # Rollback file write on DB failure to avoid orphans
            FileStorageService.delete_file(saved_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save document metadata."
            )

    @staticmethod
    def delete_document(db: Session, user_id: uuid.UUID, doc_id: uuid.UUID) -> None:
        """
        Retrieves the metadata, validates ownership, deletes the physical file,
        and removes the DB metadata.
        """
        db_doc = DocumentRepository.get_by_id(db, doc_id, user_id)
        if not db_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found or access denied."
            )

        # Delete physical file from disk
        FileStorageService.delete_file(db_doc.file_path)

        # Delete matching chunks from Vector Database
        try:
            from app.rag.vector_store import VectorStoreManager
            VectorStoreManager.delete_document_chunks(db_doc.id)
        except Exception as vec_err:
            logger.warning(f"Failed to clear document {db_doc.id} chunks from vector store: {vec_err}")

        # Delete DB metadata
        try:
            DocumentRepository.delete(db, db_doc)
        except Exception as e:
            logger.error(f"Failed to delete DB metadata: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to remove document metadata."
            )
