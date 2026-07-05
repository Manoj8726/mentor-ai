# MentorAI Backend

This is the FastAPI backend service for **MentorAI**, an AI-powered placement and learning platform.

## Setup Instructions

### Prerequisites
- Python 3.12+
- PostgreSQL (for database, placeholder connection included)

### Step 1: Create a Virtual Environment
```bash
python -m venv .venv
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Create a `.env` file from the template:
```bash
cp .env.example .env
```
Adjust database URLs, secret keys, or log levels inside the `.env` file as needed.

### Step 4: Run the Server
Start the development server using `uvicorn`:
```bash
uvicorn app.main:app --reload
```
The server will start at `http://127.0.0.1:8000`.

## API Endpoints

- **Health Check**: `GET /health`
- **Version Check**: `GET /version`
- **Interactive Documentation (Swagger UI)**: `http://127.0.0.1:8000/docs`
- **Alternative Documentation (ReDoc)**: `http://127.0.0.1:8000/redoc`

## Project Structure
- `app/main.py`: Application entrypoint, lifespan manager, and global middlewares.
- `app/config/`: Configuration setup using `pydantic-settings`.
- `app/core/`: Centralized utilities (such as `logging.py`).
- `app/database/`: Engine and session creators.
- `app/api/`: Endpoint routers for future modules (auth, knowledge, progress, supervisor, tutor, planner, etc.)
- `app/models/`, `app/schemas/`, `app/repositories/`, `app/services/`: Modular data models, DTOs, data access objects, and core service layers.
- `app/rag/`, `app/agents/`, `app/memory/`: AI, RAG pipeline, and chatbot memory architecture placeholders.
