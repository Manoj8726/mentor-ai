import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.document import Document
from app.rag.pdf_loader import PDFLoader
from app.rag.text_cleaner import TextCleaner
from app.rag.chunker import DocumentChunker
from app.rag.embedding_service import EmbeddingService
from app.rag.vector_store import VectorStoreManager

logger = logging.getLogger("app.rag.indexing_service")


class IndexingService:
    """
    Orchestration service driving the document loading, cleaning, chunking,
    embedding, and vector indexing background process.
    """

    @staticmethod
    def index_document_task(document_id: uuid.UUID) -> None:
        """
        Background task worker executing the full RAG pipeline.
        Manages its own database session and transaction commits.
        """
        logger.info(f"Background indexing pipeline triggered for document: {document_id}")
        db = SessionLocal()
        
        try:
            # 1. Fetch active document record
            doc = db.query(Document).filter(Document.id == document_id).first()
            if not doc:
                logger.error(f"Indexing aborted: Document {document_id} was not found in database.")
                return

            # Update status to INDEXING
            doc.index_status = "indexing"
            doc.index_started_at = datetime.utcnow()
            doc.index_error = None
            db.commit()

            # 2. Extract page texts using PyMuPDF
            logger.info("Step 1/5: Loading and parsing PDF pages.")
            pages = PDFLoader.load(doc.file_path)

            # 3. Clean extracted page text whitespaces and boundaries
            logger.info("Step 2/5: Normalizing and cleaning page text content.")
            cleaned_pages = []
            for page in pages:
                cleaned = TextCleaner.clean(page["text"])
                if cleaned:
                    cleaned_pages.append({
                        "text": cleaned,
                        "page": page["page"]
                    })

            if not cleaned_pages:
                raise ValueError("PDF contains no readable text characters after cleaning.")

            # 4. Partition text pages into semantic overlapping chunks
            logger.info("Step 3/5: Splitting pages into semantic text chunks.")
            chunks = DocumentChunker.chunk(doc.id, cleaned_pages)
            if not chunks:
                raise ValueError("Chunker generated 0 chunks from cleaned document text.")

            # 5. Extract raw chunk text strings to submit for OpenAI Embeddings
            chunk_texts = [chunk["text"] for chunk in chunks]

            # 6. Fetch vector embeddings from OpenAI
            logger.info("Step 4/5: Requesting OpenAI embedding vectors.")
            embeddings = EmbeddingService.get_embeddings(chunk_texts)

            # 7. Map values for insertion: IDs, embeddings, metadatas, document contents
            logger.info("Step 5/5: Preparing chunk metadata and saving to Vector Database.")
            chunk_ids = [chunk["id"] for chunk in chunks]
            metadatas = []
            documents = []

            for chunk, embedding in zip(chunks, embeddings):
                meta = chunk["metadata"]
                
                # Enrich metadata with multi-tenant user identifiers and filename reference
                meta["user_id"] = str(doc.user_id)
                meta["file_name"] = doc.original_name
                
                metadatas.append(meta)
                documents.append(chunk["text"])

            # Clean any previously existing vector keys to support clean manual reindex requests
            VectorStoreManager.delete_document_chunks(doc.id)

            # Write chunks to local ChromaDB SQLite storage
            VectorStoreManager.add_chunks(
                ids=chunk_ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=documents
            )

            # 8. Update database details with complete status
            doc.index_status = "indexed"
            doc.index_completed_at = datetime.utcnow()
            doc.total_chunks = len(chunks)
            doc.embedding_model = "text-embedding-3-small"
            db.commit()
            
            logger.info(f"Background indexing completed successfully for document {document_id}.")

        except Exception as e:
            logger.error(f"RAG indexing pipeline execution failed for document {document_id}: {e}", exc_info=True)
            try:
                db.rollback()
                # Reload document to log execution failure
                doc = db.query(Document).filter(Document.id == document_id).first()
                if doc:
                    doc.index_status = "failed"
                    doc.index_completed_at = datetime.utcnow()
                    doc.index_error = str(e)[:980]  # clamp error size to fit inside 1000 column
                    db.commit()
            except Exception as rollback_error:
                logger.error(f"Failed to record indexing failure status inside database: {rollback_error}")
        finally:
            db.close()
