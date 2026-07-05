import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  AlertTriangle,
  Cpu,
  Compass,
  ArrowRight
} from "lucide-react";
import { api } from "@/services";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RenderMarkdown } from "@/components/RenderMarkdown";

interface SourceItem {
  document_id: string;
  file_name: string;
  page: number;
  score: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  intent?: string[];
  agents_used?: string[];
  sources?: SourceItem[];
}

interface ConversationHeader {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const AIAssistant: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationHeader[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Input form & loading indicators
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<"activity" | "sources">("activity");
  
  // Real-time Agent Activity trackers during processing
  const [activitySteps, setActivitySteps] = useState<Array<{ name: string; status: "pending" | "running" | "completed" }>>([
    { name: "Supervisor Thinking", status: "pending" },
    { name: "Intent Detection", status: "pending" },
    { name: "Tutor Agent Routing", status: "pending" },
    { name: "Planner Agent Routing", status: "pending" },
    { name: "Interview Agent Routing", status: "pending" },
    { name: "Progress Agent Routing", status: "pending" },
    { name: "Aggregation & Merge", status: "pending" }
  ]);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadConversationDetails(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchConversations = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await api.get("/supervisor/conversations");
      setConversations(response.data || []);
    } catch (err) {
      showNotification("error", "Failed to retrieve conversation history.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadConversationDetails = async (convId: string) => {
    try {
      const response = await api.get(`/supervisor/conversation/${convId}`);
      const logs = response.data.messages || [];
      
      // Map basic messages to structured format
      const formatted = logs.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at
      }));
      setMessages(formatted);
    } catch (err) {
      showNotification("error", "Could not load message logs.");
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputValue("");
    resetSteps();
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Clear this orchestrator conversation permanently?")) return;

    try {
      await api.delete(`/supervisor/conversation/${convId}`);
      showNotification("success", "Conversation thread deleted.");
      fetchConversations();
      if (activeConversationId === convId) {
        startNewChat();
      }
    } catch (err) {
      showNotification("error", "Failed to delete thread.");
    }
  };

  const resetSteps = () => {
    setActivitySteps([
      { name: "Supervisor Thinking", status: "pending" },
      { name: "Intent Detection", status: "pending" },
      { name: "Tutor Agent Routing", status: "pending" },
      { name: "Planner Agent Routing", status: "pending" },
      { name: "Interview Agent Routing", status: "pending" },
      { name: "Progress Agent Routing", status: "pending" },
      { name: "Aggregation & Merge", status: "pending" }
    ]);
  };

  const simulateProgress = async () => {
    resetSteps();
    
    const updateStep = (index: number, status: "running" | "completed") => {
      setActivitySteps(prev => {
        const next = [...prev];
        next[index].status = status;
        return next;
      });
    };

    // Step 1: Supervisor Thinking
    updateStep(0, "running");
    await new Promise(resolve => setTimeout(resolve, 800));
    updateStep(0, "completed");

    // Step 2: Intent detection
    updateStep(1, "running");
    await new Promise(resolve => setTimeout(resolve, 600));
    updateStep(1, "completed");

    // Step 3: Run sub-agents concurrently
    updateStep(2, "running");
    updateStep(3, "running");
    updateStep(4, "running");
    updateStep(5, "running");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    // Append user message immediately
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: userText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Start UI activity indicator simulations
    simulateProgress();

    try {
      const response = await api.post("/supervisor/chat", {
        question: userText,
        conversation_id: activeConversationId || undefined
      });

      const result = response.data;
      
      // Update the selected conversation ID if it was a new thread
      if (!activeConversationId) {
        setActiveConversationId(result.conversation_id);
        fetchConversations();
      }

      // Finalize activity steps based on the actual response intents
      setActivitySteps(prev => {
        const next = prev.map(s => {
          if (s.name.includes("Tutor") && !result.agents_used.includes("Tutor Agent")) {
            return { ...s, status: "pending" as const };
          }
          if (s.name.includes("Planner") && !result.agents_used.includes("Study Planner Agent")) {
            return { ...s, status: "pending" as const };
          }
          if (s.name.includes("Interview") && !result.agents_used.includes("Interview Agent")) {
            return { ...s, status: "pending" as const };
          }
          if (s.name.includes("Progress") && !result.agents_used.includes("Progress Agent")) {
            return { ...s, status: "pending" as const };
          }
          return { ...s, status: "completed" as const };
        });
        return next;
      });

      // Append assistant response
      const assistantMsg: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: result.final_answer,
        created_at: new Date().toISOString(),
        intent: result.intent,
        agents_used: result.agents_used,
        sources: result.sources
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      showNotification("error", "Supervisor orchestration timed out or failed.");
      // Set all steps to pending on crash
      resetSteps();
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveAssistantMessage = () => {
    // Finds the latest assistant message to render sources inside the panel
    const assistantMsgs = messages.filter(m => m.role === "assistant");
    return assistantMsgs.length > 0 ? assistantMsgs[assistantMsgs.length - 1] : null;
  };

  const activeMsg = getActiveAssistantMessage();

  return (
    <div className="flex h-[calc(100vh-140px)] w-full gap-5">
      {/* Floating notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm z-50 fixed bottom-6 right-6 max-w-sm shadow-xl ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : "bg-red-500/10 border-red-500/25 text-red-400"
          }`}
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* LEFT PANEL: Conversation History Threads switcher */}
      <Card className="hidden lg:flex w-64 shrink-0 flex-col bg-white dark:bg-background-card/45 border-slate-200 dark:border-slate-800/80 p-4">
        <Button
          onClick={startNewChat}
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center gap-1.5 border-dashed border-slate-250 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white mb-4 select-none"
        >
          <Plus className="h-4 w-4" /> Start New Plan
        </Button>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 select-none">
          {isHistoryLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-5 w-5 text-brand-primary animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-[10px] text-text-muted italic text-center py-10">No orchestration history.</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`w-full text-left p-3 rounded-xl cursor-pointer flex items-center justify-between group transition-colors ${
                  activeConversationId === conv.id
                    ? "bg-brand-primary/10 border border-brand-primary/20 text-brand-primary dark:text-slate-100"
                    : "border border-slate-200 dark:border-slate-900/30 text-slate-650 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-semibold truncate leading-tight">
                    {conv.title.replace("Supervisor: ", "")}
                  </p>
                  <span className="text-[9px] text-text-muted mt-0.5 block">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* MIDDLE PANEL: Chat Viewport */}
      <Card className="flex-1 flex flex-col bg-white dark:bg-background-card/20 border-slate-200 dark:border-slate-800/60 overflow-hidden">
        {/* Top bar header info */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between px-6 shrink-0 bg-slate-50 dark:bg-slate-950/20 select-none">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Brain className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">AI supervisor</span>
              <span className="text-[9px] text-text-muted block">Cross-agent task selector</span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Button onClick={startNewChat} variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4 select-none">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400 animate-pulse">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">AI Coordinator Agent</h4>
                <p className="text-xs text-text-muted leading-relaxed mt-1">
                  Ask multi-faceted goals. I will dispatch task planners, trigger tutor summaries, study days timelines, and interview prep checklists concurrently.
                </p>
              </div>
              <div className="w-full space-y-2 pt-2">
                {[
                  "Teach me Java Polymorphism, review my resume and create a study plan",
                  "I have an interview in 10 days for Database Queries",
                  "Review how am I doing overall?"
                ].map((eg, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(eg)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl text-[10px] text-slate-600 dark:text-text-secondary text-left flex items-center justify-between group transition-colors"
                  >
                    <span>{eg}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${
                  m.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border select-none ${
                    m.role === "user"
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-brand-primary font-bold text-xs"
                      : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                  }`}
                >
                  {m.role === "user" ? "U" : <Bot className="h-4.5 w-4.5" />}
                </div>

                <div
                  className={`p-4 rounded-2xl border text-xs shadow-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-primary/10 border-brand-primary/20 text-slate-800 dark:text-slate-200"
                      : "bg-white dark:bg-background-card/45 border-slate-250 dark:border-slate-800/80 text-slate-800 dark:text-slate-300"
                  }`}
                >
                  <RenderMarkdown text={m.content} />
                  
                  {/* Message timestamp metadata */}
                  <span className="text-[8px] text-text-muted mt-2 block select-none">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-2xl">
              <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-background-card/25 flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-brand-primary animate-spin" />
                <span className="text-[10px] text-text-muted font-mono select-none">Agent aggregate pipeline running...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input box form container */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/20 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything (e.g. 'I have a Java interview in 10 days, teach me abstract class & check my resume')"
              className="flex-1 bg-slate-100 dark:bg-background-accent border border-slate-250 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700/60 focus:border-indigo-500/60 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              variant="primary"
              className="px-4 py-3 rounded-xl shrink-0"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </div>
        </form>
      </Card>

      {/* RIGHT PANEL: Agent Activity Monitor & Document Citations */}
      <Card className="hidden xl:flex w-72 shrink-0 flex-col bg-white dark:bg-background-card/45 border-slate-200 dark:border-slate-800/80 overflow-hidden">
        {/* Tab selector */}
        <div className="flex h-12 border-b border-slate-200 dark:border-slate-800/60 shrink-0 select-none">
          <button
            onClick={() => setActiveRightTab("activity")}
            className={`flex-1 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeRightTab === "activity"
                ? "bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border-b-2 border-indigo-500"
                : "text-slate-600 dark:text-text-secondary hover:text-slate-950 dark:hover:text-slate-300"
            }`}
          >
            <Cpu className="h-4 w-4" /> Agent Status
          </button>
          <button
            onClick={() => setActiveRightTab("sources")}
            className={`flex-1 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeRightTab === "sources"
                ? "bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border-b-2 border-indigo-500"
                : "text-slate-600 dark:text-text-secondary hover:text-slate-950 dark:hover:text-slate-300"
            }`}
          >
            <FileText className="h-4 w-4" /> Citations
          </button>
        </div>

        {/* Tab contents viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeRightTab === "activity" ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl select-none">
                <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-indigo-400" /> Dispatch Thinking Logs
                </h5>
                <p className="text-[9px] text-text-muted mt-1 leading-relaxed">
                  Real-time status updates showing active routing steps.
                </p>
              </div>

              <div className="space-y-2 select-none">
                {activitySteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                      step.status === "completed"
                        ? "bg-emerald-500/5 border-emerald-550/10 text-emerald-600 dark:text-emerald-400"
                        : step.status === "running"
                        ? "bg-indigo-500/5 border-indigo-550/15 text-indigo-600 dark:text-indigo-400"
                        : "bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-900/80 text-text-muted"
                    }`}
                  >
                    <span className="font-medium">{step.name}</span>
                    <span className="flex items-center gap-1 font-mono text-[9px] uppercase">
                      {step.status === "completed" && (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 shrink-0" /> Done
                        </>
                      )}
                      {step.status === "running" && (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin shrink-0" /> Active
                        </>
                      )}
                      {step.status === "pending" && (
                        <>
                          <Clock className="h-3 w-3 shrink-0" /> Idle
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 select-none">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl">
                <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-indigo-400" /> Retrieved Syllabus Documents
                </h5>
                <p className="text-[9px] text-text-muted mt-1 leading-relaxed">
                  Referenced document chunks from knowledge base index.
                </p>
              </div>

              {!activeMsg || !activeMsg.sources || activeMsg.sources.length === 0 ? (
                <p className="text-[10px] text-text-muted italic text-center py-10">No citations referenced in the latest response.</p>
              ) : (
                activeMsg.sources.map((s, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span className="truncate pr-2">{s.file_name}</span>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-slate-500 dark:text-text-muted font-bold">Page {s.page}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 dark:text-text-secondary">
                      <span>RAG Score</span>
                      <span>{(s.score * 100).toFixed(1)}% Match</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AIAssistant;
