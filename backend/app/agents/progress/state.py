import uuid
from typing import List, Dict, Any, TypedDict


class ProgressState(TypedDict):
    """
    State dictionary managed between LangGraph nodes for the Progress & Learning Analytics Agent.
    """
    user_id: uuid.UUID
    collected_raw_data: Dict[str, Any]
    behavior_analysis: Dict[str, Any]
    weak_topics: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    readiness_prediction: Dict[str, Any]
