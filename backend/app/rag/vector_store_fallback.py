import os
import sqlite3
import json
import numpy as np
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("app.rag.vector_store_fallback")


class Collection:
    """
    Simulates ChromaDB Collection object using SQLite storage and numpy vector mathematics.
    """

    def __init__(self, db_path: str, name: str, embedding_function: Any = None):
        self.db_path = db_path
        self.name = name
        self.embedding_function = embedding_function

    def add(
        self,
        ids: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        documents: List[str]
    ) -> None:
        """
        Saves document chunks and corresponding embeddings into SQLite.
        """
        logger.info(f"Adding {len(ids)} chunks to mock collection '{self.name}'.")
        with sqlite3.connect(self.db_path) as conn:
            for chunk_id, emb, meta, doc in zip(ids, embeddings, metadatas, documents):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO embeddings (id, collection_name, embedding, metadata, document)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (chunk_id, self.name, json.dumps(emb), json.dumps(meta), doc)
                )
            conn.commit()

    def delete(self, where: Optional[Dict[str, Any]] = None, ids: Optional[List[str]] = None) -> None:
        """
        Deletes chunks based on unique IDs or metadata filters.
        """
        with sqlite3.connect(self.db_path) as conn:
            if ids:
                logger.info(f"Deleting chunks by ID list: {ids}")
                for chunk_id in ids:
                    conn.execute("DELETE FROM embeddings WHERE id = ? AND collection_name = ?", (chunk_id, self.name))
            elif where:
                logger.info(f"Deleting chunks matching metadata filter: {where}")
                cursor = conn.cursor()
                cursor.execute("SELECT id, metadata FROM embeddings WHERE collection_name = ?", (self.name,))
                rows = cursor.fetchall()
                
                to_delete = []
                for chunk_id, meta_str in rows:
                    meta = json.loads(meta_str)
                    match = True
                    for key, val in where.items():
                        if meta.get(key) != val:
                            match = False
                            break
                    if match:
                        to_delete.append(chunk_id)
                
                for chunk_id in to_delete:
                    conn.execute("DELETE FROM embeddings WHERE id = ? AND collection_name = ?", (chunk_id, self.name))
            conn.commit()

    def query(
        self,
        query_embeddings: List[List[float]],
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculates cosine distance against stored chunks and returns the top k closest matches.
        """
        logger.info(f"Querying collection '{self.name}' (top_k={n_results}, filter={where}).")
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, embedding, metadata, document FROM embeddings WHERE collection_name = ?", (self.name,))
            rows = cursor.fetchall()

        # Parse and filter records
        candidates = []
        for chunk_id, emb_str, meta_str, doc in rows:
            meta = json.loads(meta_str)
            
            # Apply metadata filters
            if where:
                match = True
                for key, val in where.items():
                    if meta.get(key) != val:
                        match = False
                        break
                if not match:
                    continue
            
            emb = json.loads(emb_str)
            candidates.append((chunk_id, emb, meta, doc))

        if not candidates:
            return {"ids": [[]], "distances": [[]], "metadatas": [[]], "documents": [[]]}

        # Cosine distance math
        query_vector = np.array(query_embeddings[0])
        query_norm = np.linalg.norm(query_vector)

        matches = []
        for chunk_id, emb, meta, doc in candidates:
            emb_vector = np.array(emb)
            emb_norm = np.linalg.norm(emb_vector)
            
            if query_norm == 0 or emb_norm == 0:
                similarity = 0.0
            else:
                similarity = np.dot(query_vector, emb_vector) / (query_norm * emb_norm)
            
            # Cosine distance = 1 - cosine_similarity
            distance = 1.0 - float(similarity)
            matches.append((distance, chunk_id, meta, doc))

        # Sort matches by lowest distance
        matches.sort(key=lambda x: x[0])
        matches = matches[:n_results]

        return {
            "ids": [[item[1] for item in matches]],
            "distances": [[item[0] for item in matches]],
            "metadatas": [[item[2] for item in matches]],
            "documents": [[item[3] for item in matches]]
        }


class PersistentClient:
    """
    Simulates ChromaDB PersistentClient interface using standard SQLite database.
    """

    def __init__(self, path: str):
        self.path = path
        os.makedirs(path, exist_ok=True)
        self.db_path = os.path.join(path, "chroma_fallback.db")
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS collections (
                    name TEXT PRIMARY KEY
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS embeddings (
                    id TEXT PRIMARY KEY,
                    collection_name TEXT,
                    embedding TEXT,
                    metadata TEXT,
                    document TEXT,
                    FOREIGN KEY(collection_name) REFERENCES collections(name) ON DELETE CASCADE
                )
                """
            )
            conn.commit()

    def get_or_create_collection(self, name: str, embedding_function: Any = None) -> Collection:
        """
        Creates collection schema if missing and returns Collection instance.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("INSERT OR IGNORE INTO collections (name) VALUES (?)", (name,))
            conn.commit()
        return Collection(self.db_path, name, embedding_function)
