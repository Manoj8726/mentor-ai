import logging
import sys
import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Configure basic logging setup
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


def setup_logging(log_level: str = "INFO") -> None:
    """Sets up global logging configuration."""
    level = getattr(logging, log_level.upper(), logging.INFO)

    logging.basicConfig(
        level=level,
        format=LOG_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ],
        force=True
    )

    # Suppress verbose third-party logs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)

    logger = logging.getLogger("app")
    logger.info(f"Logging initialized with level: {log_level}")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests and responses with execution time."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        logger = logging.getLogger("app.request")
        start_time = time.time()
        method = request.method
        path = request.url.path

        logger.info(f"Started {method} {path}")

        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            status_code = response.status_code

            log_msg = f"Completed {method} {path} - Status: {status_code} - Duration: {process_time:.2f}ms"
            if 200 <= status_code < 400:
                logger.info(log_msg)
            elif 400 <= status_code < 500:
                logger.warning(log_msg)
            else:
                logger.error(log_msg)

            return response
        except Exception as exc:
            process_time = (time.time() - start_time) * 1000
            logger.error(f"Failed {method} {path} - Error: {str(exc)} - Duration: {process_time:.2f}ms")
            raise exc from None
