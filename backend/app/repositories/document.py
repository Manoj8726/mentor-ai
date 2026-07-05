import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.document import Document


class DocumentRepository:
    """
    Data Access Object (DAO) for handling queries related to Knowledge Base documents.
    """

    @staticmethod
    def get_by_id(db: Session, doc_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Document]:
        """
        Retrieves a document by ID and verifies owner access.
        """
        return db.query(Document).filter(
            Document.id == doc_id,
            Document.user_id == user_id
        ).first()

    @staticmethod
    def get_by_name(db: Session, original_name: str, user_id: uuid.UUID) -> Optional[Document]:
        """
        Retrieves a document by its original filename for duplicate detection.
        """
        return db.query(Document).filter(
            Document.original_name == original_name,
            Document.user_id == user_id
        ).first()

    @staticmethod
    def get_user_documents(db: Session, user_id: uuid.UUID) -> List[Document]:
        """
        Returns all active documents for a given user, sorted newest first.
        """
        return db.query(Document).filter(
            Document.user_id == user_id
        ).order_by(Document.created_at.desc()).all()

    @staticmethod
    def create(
        db: Session,
        user_id: uuid.UUID,
        file_name: str,
        original_name: str,
        file_path: str,
        file_size: int,
        mime_type: str
    ) -> Document:
        """
        Saves new document metadata record to database.
        """
        db_doc = Document(
            user_id=user_id,
            file_name=file_name,
            original_name=original_name,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            upload_status="completed"
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        return db_doc

    @staticmethod
    def delete(db: Session, db_doc: Document) -> None:
        """
        Removes the document metadata record.
        """
        db.delete(db_doc)
        db.commit()
