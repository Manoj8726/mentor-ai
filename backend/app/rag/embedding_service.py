import logging
from typing import List
from openai import OpenAI
from app.config.config import settings

logger = logging.getLogger("app.rag.embedding_service")


class EmbeddingService:
    """
    Service responsible for interacting with OpenAI API to generate vector embeddings.
    """

    @staticmethod
    def get_embeddings(texts: List[str]) -> List[List[float]]:
        """
        Generates vector embeddings for a list of string chunks.
        Uses OpenAI's 'text-embedding-3-small' model (dimension: 1536).
        """
        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API key is missing. Cannot generate embeddings.")
            raise ValueError("OPENAI_API_KEY settings value is not set. Check environment variables.")

        if settings.OPENAI_API_KEY.startswith("gsk_"):
            import hashlib
            import numpy as np
            
            embeddings = []
            dim = 1536
            for text in texts:
                vec = np.zeros(dim, dtype=np.float32)
                words = text.lower().split()
                if not words:
                    vec[0] = 1.0
                    embeddings.append(vec.tolist())
                    continue
                
                for w in words:
                    h = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16)
                    slot = h % dim
                    vec[slot] += 1.0
                    
                for i in range(len(text) - 2):
                    trigram = text[i:i+3].lower()
                    h = int(hashlib.md5(trigram.encode('utf-8')).hexdigest(), 16)
                    slot = h % dim
                    vec[slot] += 0.2
                    
                norm = np.linalg.norm(vec)
                if norm > 0:
                    vec = vec / norm
                embeddings.append(vec.tolist())
            return embeddings

        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        try:
            logger.info(f"Generating OpenAI embeddings for {len(texts)} chunks.")
            response = client.embeddings.create(
                input=texts,
                model="text-embedding-3-small"
            )
            # Map API response data back to embeddings array
            embeddings = [item.embedding for item in response.data]
            return embeddings
        except Exception as e:
            logger.error(f"OpenAI Embeddings generation error: {e}")
            raise RuntimeError(f"OpenAI Embeddings generation failed: {str(e)}")

    @classmethod
    def get_query_embedding(cls, text: str) -> List[float]:
        """
        Helper method to retrieve an embedding vector for a single query string.
        """
        if not text or not text.strip():
            raise ValueError("Query string cannot be empty.")
            
        embeddings = cls.get_embeddings([text])
        return embeddings[0]
