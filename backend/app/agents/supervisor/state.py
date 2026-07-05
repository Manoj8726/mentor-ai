import uuid
from typing import List, Dict, Any, TypedDict, Optional


class SupervisorState(TypedDict):
    """
    State dictionary managed between LangGraph nodes for the Supervisor Orchestrator Agent.
    """
    user_id: uuid.UUID
    question: str
    detected_intents: List[str]
    task_plan: List[Dict[str, Any]]
    agents_to_run: List[str]
    agent_outputs: Dict[str, Any]
    merged_sources: List[Dict[str, Any]]
    merged_recommendations: List[str]
    final_response: str
    memory_context: Dict[str, Any]
