import uuid
import logging
from typing import List, Dict, Any
from app.rag.retriever import RAGRetriever

logger = logging.getLogger("app.rag.rag_service")


class RAGService:
    """
    Facade class serving as the single entry-point for downstream AI Agent
    and REST API similarity search queries.
    """

    @staticmethod
    def search(user_id: uuid.UUID, question: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Executes semantic search matching user_id filter rules.
        """
        logger.info(f"RAG search query initiated by user {user_id}. Top_K={top_k}")
        return RAGRetriever.retrieve(
            user_id=user_id,
            question=question,
            top_k=top_k
        )
