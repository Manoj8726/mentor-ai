import os
import uuid
import shutil
import logging
from fastapi import UploadFile
from app.config.config import settings

logger = logging.getLogger("app.storage")


class FileStorageService:
    """
    Service responsible for reading/writing documents directly to the local filesystem.
    """

    @staticmethod
    def save_file(user_id: uuid.UUID, file: UploadFile) -> str:
        """
        Saves a uploaded file stream to uploads/<user_uuid>/<safe_filename>.
        Creates folders automatically if missing.
        """
        # Define destination directory
        user_dir = os.path.abspath(os.path.join(settings.UPLOAD_FOLDER, str(user_id)))
        
        try:
            os.makedirs(user_dir, exist_ok=True)
        except Exception as e:
            logger.error(f"Failed to initialize directory {user_dir}: {e}")
            raise RuntimeError("Internal file system initialization error")

        # Sanitize name to prevent traversal attacks
        safe_filename = os.path.basename(file.filename or "uploaded_file.pdf")
        destination_path = os.path.join(user_dir, safe_filename)

        try:
            # Copy uploaded file stream directly to local file buffer
            file.file.seek(0)  # Ensure read starts at beginning
            with open(destination_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            logger.info(f"Successfully saved document on disk: {destination_path}")
            return destination_path
        except Exception as e:
            logger.error(f"Disk write error for {destination_path}: {e}")
            raise RuntimeError("Failed to write document to storage")

    @staticmethod
    def delete_file(file_path: str) -> None:
        """
        Deletes the file at the specified absolute/relative path.
        """
        if not file_path:
            return

        absolute_path = os.path.abspath(file_path)
        if os.path.exists(absolute_path):
            try:
                os.remove(absolute_path)
                logger.info(f"Successfully deleted document on disk: {absolute_path}")
            except Exception as e:
                logger.error(f"Disk delete error for {absolute_path}: {e}")
        else:
            logger.warning(f"File deletion skipped: path does not exist ({absolute_path})")
