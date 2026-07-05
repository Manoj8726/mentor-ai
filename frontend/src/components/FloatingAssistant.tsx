import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  X,
  Send,
  Loader2,
  Brain,
  CheckCircle,
  Clock
} from "lucide-react";
import { api } from "@/services";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
  sources?: SourceItem[];
}

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Status trackers
  const [activitySteps, setActivitySteps] = useState<Array<{ name: string; status: "pending" | "running" | "completed" }>>([
    { name: "Orchestrator Thought", status: "pending" },
    { name: "Intent Selectors", status: "pending" },
    { name: "Tutor Dispatch", status: "pending" },
    { name: "Planner Dispatch", status: "pending" }
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const simulateProgress = async () => {
    setActivitySteps([
      { name: "Orchestrator Thought", status: "pending" },
      { name: "Intent Selectors", status: "pending" },
      { name: "Tutor Dispatch", status: "running" },
      { name: "Planner Dispatch", status: "pending" }
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setActivitySteps(prev => {
      const next = [...prev];
      next[0].status = "completed";
      next[1].status = "running";
      return next;
    });

    await new Promise(resolve => setTimeout(resolve, 600));
    setActivitySteps(prev => {
      const next = [...prev];
      next[1].status = "completed";
      next[2].status = "running";
      next[3].status = "running";
      return next;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    const tempUserMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: userText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    simulateProgress();

    try {
      const response = await api.post("/supervisor/chat", {
        question: userText,
        conversation_id: conversationId || undefined
      });

      const result = response.data;
      if (!conversationId) {
        setConversationId(result.conversation_id);
      }

      setActivitySteps(prev => prev.map(s => ({ ...s, status: "completed" as const })));

      const assistantMsg: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: result.final_answer,
        created_at: new Date().toISOString(),
        sources: result.sources
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: "Sorry, I had trouble orchestrating that request.",
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getLatestCitations = () => {
    const assistant = messages.filter(m => m.role === "assistant");
    return assistant.length > 0 ? assistant[assistant.length - 1].sources : [];
  };

  const citations = getLatestCitations();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* 1. COLLAPSIBLE CHAT DRAWER */}
      {isOpen && (
        <Card className="w-80 md:w-96 h-[500px] bg-background-card/95 border border-slate-800/80 shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="h-12 border-b border-slate-800/80 bg-slate-950/20 px-4 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Global Coordinator</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:text-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Port */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
                <Brain className="h-8 w-8 text-indigo-500/20 animate-pulse" />
                <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Floating Assistant</h5>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Query the Supervisor Agent dynamically from any page to coordinate learning plans or check interview requirements.
                </p>
              </div>
            ) : (
              messages.map(m => (
                <div
                  key={m.id}
                  className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                >
                  <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-primary/10 border-brand-primary/20 text-slate-200"
                      : "bg-background/40 border-slate-800/60 text-slate-300"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))
            )}

            {/* Loading / Status tracker step indicators */}
            {isLoading && (
              <div className="space-y-3">
                {/* Visual loading indicators spinner */}
                <div className="flex items-center gap-2 p-2 bg-slate-900/40 border border-slate-850 rounded-xl">
                  <Loader2 className="h-4 w-4 text-brand-primary animate-spin" />
                  <span className="text-[10px] text-text-muted font-mono select-none">Supervisor coordinating...</span>
                </div>
                
                {/* Concurrent progress tracker logs list */}
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-950/20 rounded-xl select-none">
                  {activitySteps.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 border border-slate-900/60 rounded text-[9px]">
                      <span className="text-text-secondary truncate pr-1">{step.name}</span>
                      {step.status === "completed" ? (
                        <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                      ) : step.status === "running" ? (
                        <Loader2 className="h-2.5 w-2.5 text-indigo-400 animate-spin shrink-0" />
                      ) : (
                        <Clock className="h-2.5 w-2.5 text-text-muted shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Citations references mini bar */}
          {citations && citations.length > 0 && !isLoading && (
            <div className="px-4 py-2 border-t border-slate-850 bg-slate-950/20 flex gap-2 overflow-x-auto select-none shrink-0">
              <span className="text-[8px] text-text-muted uppercase font-bold shrink-0 mt-0.5">Refs:</span>
              {citations.map((c, idx) => (
                <span key={idx} className="text-[8px] bg-slate-900 border border-slate-800 text-text-secondary px-1.5 py-0.5 rounded truncate max-w-[80px]">
                  {c.file_name}
                </span>
              ))}
            </div>
          )}

          {/* Input field Footer */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-slate-950/20 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Ask coordinator anything..."
                className="flex-1 bg-background-accent border border-slate-800/80 focus:border-indigo-500/60 rounded-xl px-3 py-2 text-[11px] text-slate-100 placeholder-text-muted outline-none transition-colors"
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                variant="primary"
                className="p-2.5 rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 2. FLOATING BUBBLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-gradient-to-tr from-brand-primary to-brand-purple hover:scale-105 active:scale-95 transition-all text-white flex items-center justify-center shadow-glow border border-slate-700/30"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

    </div>
  );
};
export default FloatingAssistant;
