from langgraph.graph import StateGraph, START, END
from app.agents.progress.state import ProgressState
from app.agents.progress.nodes import (
    collect_learning_data_node,
    analyze_learning_behaviour_node,
    identify_weak_areas_node,
    generate_recommendations_node,
    predict_readiness_node
)

# Initialize LangGraph state graph with ProgressState
workflow = StateGraph(ProgressState)

# Register graph nodes
workflow.add_node("collect_learning_data_node", collect_learning_data_node)
workflow.add_node("analyze_learning_behaviour_node", analyze_learning_behaviour_node)
workflow.add_node("identify_weak_areas_node", identify_weak_areas_node)
workflow.add_node("generate_recommendations_node", generate_recommendations_node)
workflow.add_node("predict_readiness_node", predict_readiness_node)

# Setup sequential edge transitions
workflow.add_edge(START, "collect_learning_data_node")
workflow.add_edge("collect_learning_data_node", "analyze_learning_behaviour_node")
workflow.add_edge("analyze_learning_behaviour_node", "identify_weak_areas_node")
workflow.add_edge("identify_weak_areas_node", "generate_recommendations_node")
workflow.add_edge("generate_recommendations_node", "predict_readiness_node")
workflow.add_edge("predict_readiness_node", END)

# Compile graph
progress_graph = workflow.compile()
