import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.config import settings
from app.core.logging import setup_logging, RequestLoggingMiddleware

# Setup logger for main module
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager that handles startup and shutdown logic.
    """
    # Startup actions
    setup_logging(settings.LOG_LEVEL)
    logger.info(f"Starting {settings.APP_NAME} (v{settings.APP_VERSION}) in {'DEBUG' if settings.DEBUG else 'PRODUCTION'} mode.")
    
    # Initialize directories if they do not exist
    for folder in [settings.UPLOAD_FOLDER, settings.CHROMA_DB_PATH]:
        if folder and not folder.startswith("http"):
            try:
                import os
                os.makedirs(folder, exist_ok=True)
                logger.info(f"Initialized directory: {folder}")
            except Exception as e:
                logger.warning(f"Could not create directory {folder}: {e}")

    yield

    # Shutdown actions
    logger.info(f"Stopping {settings.APP_NAME}...")


# Create FastAPI application instance
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)

# CORS Configuration
# Allow all origins in debug/dev, lock down as needed for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mentor-ai-1-khsa.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Auth Router Registration
from app.api.auth.endpoints import router as auth_router
app.include_router(auth_router, prefix="/auth", tags=["authentication"])

# Knowledge Router Registration
from app.api.knowledge.endpoints import router as knowledge_router
app.include_router(knowledge_router, prefix="/knowledge", tags=["knowledge"])

# RAG Router Registration
from app.api.rag.endpoints import router as rag_router
app.include_router(rag_router, prefix="/rag", tags=["rag"])

# Tutor Router Registration
from app.api.tutor.endpoints import router as tutor_router
app.include_router(tutor_router, prefix="/tutor", tags=["tutor"])

# Planner Router Registration
from app.api.planner.endpoints import router as planner_router
app.include_router(planner_router, prefix="/planner", tags=["planner"])

# Interview Router Registration
from app.api.interview.endpoints import router as interview_router
app.include_router(interview_router, prefix="/interview", tags=["interview"])

# Progress Router Registration
from app.api.progress.endpoints import router as progress_router
app.include_router(progress_router, prefix="/progress", tags=["progress"])

# Supervisor Router Registration
from app.api.supervisor.endpoints import router as supervisor_router
app.include_router(supervisor_router, prefix="/supervisor", tags=["supervisor"])

# Memory Router Registration
from app.api.memory.endpoints import router as memory_router
app.include_router(memory_router, prefix="/memory", tags=["memory"])


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all exception handler to format server errors securely.
    """
    logger.exception(f"Unhandled error for {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred.",
            "type": exc.__class__.__name__
        }
    )


# Basic Endpoints
@app.get("/health", tags=["system"])
async def health_check():
    """
    Liveness and readiness check.
    """
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION
    }


@app.get("/version", tags=["system"])
async def get_version():
    """
    Retrieve application version info.
    """
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG
    }
