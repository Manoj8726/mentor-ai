import logging
import uuid
from typing import List, Dict, Any, Optional
from app.config.config import settings
from app.rag.vector_store_fallback import PersistentClient

logger = logging.getLogger("app.rag.vector_store")


class VectorStoreManager:
    """
    Manager coordinating vector insertions, query retrieves, and deletions
    against local SQLite or ChromaDB vector store clients.
    """

    _client: Optional[PersistentClient] = None
    _collection: Optional[Any] = None

    @classmethod
    def get_client(cls) -> PersistentClient:
        """
        Singleton persistent client resolver.
        """
        if cls._client is None:
            cls._client = PersistentClient(path=settings.CHROMA_DB_PATH)
        return cls._client

    @classmethod
    def get_collection(cls) -> Any:
        """
        Singleton collection resolver for storing documents.
        """
        if cls._collection is None:
            client = cls.get_client()
            cls._collection = client.get_or_create_collection(name="mentor_ai_knowledge_base")
        return cls._collection

    @classmethod
    def add_chunks(
        cls,
        ids: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        documents: List[str]
    ) -> None:
        """
        Inserts list of chunk texts, metadatas, and vector embeddings.
        """
        collection = cls.get_collection()
        try:
            collection.add(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=documents
            )
            logger.info(f"Successfully added {len(ids)} vectors to vector store.")
        except Exception as e:
            logger.error(f"Failed to add vectors to store: {e}")
            raise RuntimeError(f"Vector store insert failed: {str(e)}")

    @classmethod
    def delete_document_chunks(cls, document_id: uuid.UUID) -> None:
        """
        Deletes all vector embeddings associated with a given document UUID.
        """
        collection = cls.get_collection()
        try:
            # Delete filter matches document_id string
            collection.delete(where={"document_id": str(document_id)})
            logger.info(f"Successfully deleted all chunks for document {document_id} from vector store.")
        except Exception as e:
            logger.error(f"Failed to delete document vectors: {e}")
            raise RuntimeError(f"Vector store delete failed: {str(e)}")

    @classmethod
    def query_similarity(
        cls,
        query_embedding: List[float],
        user_id: uuid.UUID,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Performs semantic similarity query on user's documents.
        Enforces tenant isolation using user_id metadata filtering.
        """
        collection = cls.get_collection()
        try:
            return collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where={"user_id": str(user_id)}
            )
        except Exception as e:
            logger.error(f"Vector similarity search failed: {e}")
            raise RuntimeError(f"Vector query failed: {str(e)}")
