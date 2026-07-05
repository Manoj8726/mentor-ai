import uuid
import logging
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger("app.rag.chunker")


class DocumentChunker:
    """
    Service responsible for dividing page text streams into overlapping semantic chunks.
    """

    @staticmethod
    def chunk(document_id: uuid.UUID, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Splits page texts into chunks of size 1000 characters with 200 character overlap.
        Each chunk is formatted as:
        {
            "id": "doc-uuid_chunk_1",
            "text": "Chunk text...",
            "metadata": {
                "document_id": "doc-uuid",
                "page": 1,
                "chunk": 1
            }
        }
        """
        logger.info(f"Chunking document {document_id} using RecursiveCharacterTextSplitter.")
        
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        
        chunks = []
        global_chunk_count = 0

        for page in pages:
            text = page["text"]
            page_number = page["page"]

            # Perform text split
            page_splits = splitter.split_text(text)

            for split_index, split in enumerate(page_splits):
                global_chunk_count += 1
                chunk_id = f"{document_id}_chunk_{global_chunk_count}"
                
                chunks.append({
                    "id": chunk_id,
                    "text": split.strip(),
                    "metadata": {
                        "document_id": str(document_id),
                        "page": page_number,
                        "chunk": global_chunk_count
                    }
                })

        logger.info(f"Generated {len(chunks)} chunks for document {document_id}.")
        return chunks
