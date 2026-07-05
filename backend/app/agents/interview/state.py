import uuid
from typing import List, Dict, Any, TypedDict, Optional


class InterviewState(TypedDict):
    """
    State dictionary managed between LangGraph nodes for the Interview & Resume Agent.
    """
    user_id: uuid.UUID
    file_path: Optional[str]
    target_role: Optional[str]
    company_name: Optional[str]
    resume_raw_text: str
    parsed_resume: Dict[str, Any]
    ats_analysis: Dict[str, Any]
    gap_analysis: Dict[str, Any]
    company_roadmap: Dict[str, Any]
    questions: List[Dict[str, Any]]
    final_report: Dict[str, Any]
