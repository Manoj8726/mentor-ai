import re


class TextCleaner:
    """
    Utility service to normalize text formatting from raw PDF text extracts.
    """

    @staticmethod
    def clean(text: str) -> str:
        """
        Cleans extracted text by:
        - Removing invisible control characters (keeping standard newlines)
        - Normalizing horizontal spaces and tabs
        - Collapsing 3+ consecutive newlines down to 2 (preserving paragraph boundaries)
        - Stripping leading and trailing whitespaces
        """
        if not text:
            return ""

        # Remove control characters (\x00-\x08, \x0b-\x0c, \x0e-\x1f, \x7f) and soft hyphens (\xad)
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\xad]", "", text)

        # Normalize spaces, tabs, and Carriage returns down to single space
        cleaned = re.sub(r"[ \t\r\f\v]+", " ", cleaned)

        # Remove duplicate blank lines (collapse three or more newlines down to a standard paragraph break)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

        # Normalize line spacing issues (trim trailing line ends, but preserve formatting)
        lines = [line.strip() for line in cleaned.split("\n")]
        cleaned = "\n".join(lines)

        # Collapse duplicate blank lines again after stripping line whitespaces
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

        return cleaned.strip()
