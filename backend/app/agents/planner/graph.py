from langgraph.graph import StateGraph, START, END
from app.agents.planner.state import PlannerState
from app.agents.planner.nodes import (
    analyze_request_node,
    retrieve_content_node,
    generate_study_plan_node,
    generate_revision_strategy_node,
    generate_recommendations_node
)

# Initialize LangGraph state graph with PlannerState
workflow = StateGraph(PlannerState)

# Register planner nodes
workflow.add_node("analyze_request", analyze_request_node)
workflow.add_node("retrieve_content", retrieve_content_node)
workflow.add_node("generate_study_plan", generate_study_plan_node)
workflow.add_node("generate_revision_strategy", generate_revision_strategy_node)
workflow.add_node("generate_recommendations", generate_recommendations_node)

# Setup sequential edge transitions
workflow.add_edge(START, "analyze_request")
workflow.add_edge("analyze_request", "retrieve_content")
workflow.add_edge("retrieve_content", "generate_study_plan")
workflow.add_edge("generate_study_plan", "generate_revision_strategy")
workflow.add_edge("generate_revision_strategy", "generate_recommendations")
workflow.add_edge("generate_recommendations", END)

# Compile graph
planner_graph = workflow.compile()
