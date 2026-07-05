import logging
from typing import List, Dict, Any
import fitz  # PyMuPDF

logger = logging.getLogger("app.rag.pdf_loader")


class PDFLoader:
    """
    Service responsible for loading PDF files page-by-page and extracting text content.
    """

    @staticmethod
    def load(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from the PDF at file_path.
        Returns a list of structured dictionaries:
        [
            {"text": "Extracted text page 1...", "page": 1},
            {"text": "Extracted text page 2...", "page": 2}
        ]
        Empty or whitespace-only pages are ignored.
        """
        logger.info(f"Loading document pages via PyMuPDF: {file_path}")
        pages = []
        
        try:
            doc = fitz.open(file_path)
        except Exception as e:
            logger.error(f"Failed to open PDF file {file_path}: {e}")
            raise RuntimeError(f"Could not open PDF file: {str(e)}")

        try:
            for page_index, page in enumerate(doc):
                text = page.get_text()
                # Skip empty pages
                if text and text.strip():
                    pages.append({
                        "text": text,
                        "page": page_index + 1
                    })
            logger.info(f"Loaded {len(pages)} non-empty pages out of {len(doc)} pages total.")
        finally:
            doc.close()

        if not pages:
            raise ValueError("The uploaded PDF does not contain any readable text pages.")

        return pages
