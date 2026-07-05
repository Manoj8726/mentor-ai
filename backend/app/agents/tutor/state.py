import uuid
from typing import List, Dict, Any, TypedDict


class TutorState(TypedDict):
    """
    State dictionary managed between LangGraph nodes for the Tutor Agent.
    """
    user_id: uuid.UUID
    question: str
    context_chunks: List[Dict[str, Any]]
    explanation: Dict[str, Any]
    quiz: Dict[str, Any]
    followup: List[str]
