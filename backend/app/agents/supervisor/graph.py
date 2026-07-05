from langgraph.graph import StateGraph, START, END
from app.agents.supervisor.state import SupervisorState
from app.agents.supervisor.nodes import (
    intent_detection_node,
    task_planner_node,
    agent_selector_node,
    parallel_agent_execution_node,
    response_aggregation_node,
    response_formatter_node
)

# Initialize LangGraph state graph with SupervisorState
workflow = StateGraph(SupervisorState)

# Register graph nodes
workflow.add_node("intent_detection_node", intent_detection_node)
workflow.add_node("task_planner_node", task_planner_node)
workflow.add_node("agent_selector_node", agent_selector_node)
workflow.add_node("parallel_agent_execution_node", parallel_agent_execution_node)
workflow.add_node("response_aggregation_node", response_aggregation_node)
workflow.add_node("response_formatter_node", response_formatter_node)

# Setup sequential edge transitions
workflow.add_edge(START, "intent_detection_node")
workflow.add_edge("intent_detection_node", "task_planner_node")
workflow.add_edge("task_planner_node", "agent_selector_node")
workflow.add_edge("agent_selector_node", "parallel_agent_execution_node")
workflow.add_edge("parallel_agent_execution_node", "response_aggregation_node")
workflow.add_edge("response_aggregation_node", "response_formatter_node")
workflow.add_edge("response_formatter_node", END)

# Compile graph
supervisor_graph = workflow.compile()
