from langgraph.graph import StateGraph, START, END
from app.agents.interview.state import InterviewState
from app.agents.interview.nodes import (
    parse_resume_node,
    extract_skills_node,
    ats_analyzer_node,
    gap_analysis_node,
    company_preparation_node,
    interview_question_generator_node,
    final_report_node
)

# Initialize LangGraph state graph with InterviewState
workflow = StateGraph(InterviewState)

# Register graph nodes
workflow.add_node("resume_parser_node", parse_resume_node)
workflow.add_node("skill_extractor_node", extract_skills_node)
workflow.add_node("ats_analyzer_node", ats_analyzer_node)
workflow.add_node("gap_analysis_node", gap_analysis_node)
workflow.add_node("company_preparation_node", company_preparation_node)
workflow.add_node("interview_question_generator_node", interview_question_generator_node)
workflow.add_node("final_report_node", final_report_node)

# Setup sequential edge transitions
workflow.add_edge(START, "resume_parser_node")
workflow.add_edge("resume_parser_node", "skill_extractor_node")
workflow.add_edge("skill_extractor_node", "ats_analyzer_node")
workflow.add_edge("ats_analyzer_node", "gap_analysis_node")
workflow.add_edge("gap_analysis_node", "company_preparation_node")
workflow.add_edge("company_preparation_node", "interview_question_generator_node")
workflow.add_edge("interview_question_generator_node", "final_report_node")
workflow.add_edge("final_report_node", END)

# Compile graph
interview_graph = workflow.compile()
