import uuid
import logging
from typing import List, Dict, Any
from app.rag.embedding_service import EmbeddingService
from app.rag.vector_store import VectorStoreManager

logger = logging.getLogger("app.rag.retriever")


class RAGRetriever:
    """
    Service responsible for converting user queries into vector embeddings
    and querying the VectorStoreManager for similar context chunks.
    """

    @staticmethod
    def retrieve(user_id: uuid.UUID, question: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves matching document chunks from the vector store for a question.
        Returns a list of structured dictionaries:
        [
            {
                "chunk_id": "doc-uuid_chunk_1",
                "text": "Chunk text content...",
                "score": 0.8921,  # Similarity score (1.0 - cosine_distance)
                "document_id": "doc-uuid",
                "file_name": "dbms_syllabus.pdf",
                "page": 2,
                "chunk_number": 1
            }
        ]
        """
        logger.info(f"Retrieving chunks for user {user_id}. Query: '{question}'")

        # 1. Generate search query vector embedding
        try:
            query_embedding = EmbeddingService.get_query_embedding(question)
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {e}")
            raise RuntimeError(f"Could not calculate search query vector: {str(e)}")

        # 2. Query similarity index
        raw_results = VectorStoreManager.query_similarity(
            query_embedding=query_embedding,
            user_id=user_id,
            top_k=top_k
        )

        # 3. Format result arrays
        ids = raw_results.get("ids", [[]])[0]
        distances = raw_results.get("distances", [[]])[0]
        metadatas = raw_results.get("metadatas", [[]])[0]
        documents = raw_results.get("documents", [[]])[0]

        retrieved_chunks = []
        for chunk_id, dist, meta, doc_text in zip(ids, distances, metadatas, documents):
            # Cosine similarity = 1.0 - cosine_distance
            similarity_score = 1.0 - dist
            
            retrieved_chunks.append({
                "chunk_id": chunk_id,
                "text": doc_text,
                "score": max(0.0, min(1.0, round(similarity_score, 4))),  # Bound score [0.0, 1.0]
                "document_id": meta.get("document_id"),
                "file_name": meta.get("file_name"),
                "page": meta.get("page"),
                "chunk_number": meta.get("chunk")
            })

        logger.info(f"Retrieved {len(retrieved_chunks)} relevant matches.")
        return retrieved_chunks
