from langgraph.graph import StateGraph, START, END
from app.agents.tutor.state import TutorState
from app.agents.tutor.nodes import (
    retrieve_context_node,
    generate_explanation_node,
    generate_quiz_node,
    generate_followup_node
)

# Initialize LangGraph state graph with TutorState
workflow = StateGraph(TutorState)

# Register graph nodes
workflow.add_node("retrieve_context", retrieve_context_node)
workflow.add_node("generate_explanation", generate_explanation_node)
workflow.add_node("generate_quiz", generate_quiz_node)
workflow.add_node("generate_followup", generate_followup_node)

# Configure transitions (Sequential Execution Flow)
workflow.add_edge(START, "retrieve_context")
workflow.add_edge("retrieve_context", "generate_explanation")
workflow.add_edge("generate_explanation", "generate_quiz")
workflow.add_edge("generate_quiz", "generate_followup")
workflow.add_edge("generate_followup", END)

# Compile the execution graph
tutor_graph = workflow.compile()
