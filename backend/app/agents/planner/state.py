import uuid
from typing import List, Dict, Any, TypedDict


class PlannerState(TypedDict):
    """
    State dictionary managed between LangGraph nodes for the Study Planner Agent.
    """
    user_id: uuid.UUID
    request_data: Dict[str, Any]
    analysis: Dict[str, Any]
    context_chunks: List[Dict[str, Any]]
    plan_days: List[Dict[str, Any]]
    revision_strategy: Dict[str, Any]
    recommendations: Dict[str, Any]
