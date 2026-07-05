import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  MessageSquare,
  Loader2,
  Send,
  Plus,
  BookOpen,
  Lightbulb,
  ShieldAlert,
  Award,
  FileText,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle
} from "lucide-react";
import { api } from "@/services";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { RenderMarkdown } from "@/components/RenderMarkdown";

interface MCQItem {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface SourceCitation {
  document_id: string;
  file_name: string;
  page: number;
  score: number;
  text: string;
}

interface TutorMessageContent {
  explanation: string;
  simple_explanation: string;
  analogy: string;
  interview_points: string[];
  common_mistakes: string[];
  practice_questions: string[];
  mcqs: MCQItem[];
  followup_topics: string[];
  sources: SourceCitation[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | TutorMessageContent;
  created_at: string;
}

interface ConversationHeader {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const Tutor: React.FC = () => {
  // Chat thread states
  const [conversations, setConversations] = useState<ConversationHeader[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeRightTab, setActiveRightTab] = useState<"sources" | "quizzes" | "next">("sources");
  
  // Forms & Loading
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Accordion Toggles for current active message
  const [expandedAnalogyMsgId, setExpandedAnalogyMsgId] = useState<Record<string, boolean>>({});
  const [expandedLaymanMsgId, setExpandedLaymanMsgId] = useState<Record<string, boolean>>({});
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<number | null>(null);
  
  // MCQ Interactive Answers state (key: messageId-mcqIdx)
  const [selectedMcqOptions, setSelectedMcqOptions] = useState<Record<string, string>>({});

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
      const response = await api.get("/tutor/conversations");
      setConversations(response.data || []);
    } catch (err: any) {
      showNotification("error", "Failed to retrieve conversation logs.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadConversationDetails = async (convId: string) => {
    try {
      const response = await api.get(`/tutor/conversation/${convId}`);
      const logs = response.data.messages || [];
      setMessages(logs);
      
      // Select the first Tab default
      if (logs.length > 0) {
        setActiveRightTab("sources");
      }
    } catch (err: any) {
      showNotification("error", "Could not load messages.");
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputValue("");
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation thread permanently?")) return;

    try {
      await api.delete(`/tutor/conversation/${convId}`);
      showNotification("success", "Conversation thread cleared.");
      if (activeConversationId === convId) {
        startNewChat();
      }
      fetchConversations();
    } catch (err: any) {
      showNotification("error", "Could not delete thread.");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue("");
    setIsLoading(true);

    // Append user message immediately
    const tempUserMsgId = `temp-user-${Date.now()}`;
    const userMsg: Message = {
      id: tempUserMsgId,
      role: "user",
      content: userText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await api.post("/tutor/chat", {
        question: userText,
        conversation_id: activeConversationId || undefined
      });

      const tutorResponseData = response.data;
      
      // Update active conversation ID if we started a new one
      if (!activeConversationId && tutorResponseData.conversation_id) {
        setActiveConversationId(tutorResponseData.conversation_id);
        fetchConversations();
      }

      // Map parsed object output
      const assistantMsg: Message = {
        id: tutorResponseData.message_id,
        role: "assistant",
        content: {
          explanation: tutorResponseData.explanation,
          simple_explanation: tutorResponseData.simple_explanation,
          analogy: tutorResponseData.analogy,
          interview_points: tutorResponseData.interview_points,
          common_mistakes: tutorResponseData.common_mistakes,
          practice_questions: tutorResponseData.practice_questions,
          mcqs: tutorResponseData.mcqs,
          followup_topics: tutorResponseData.followup_topics,
          sources: tutorResponseData.sources
        },
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      showNotification("error", err.response?.data?.detail || "Chat generation failed.");
      // Append a warning error message from assistant
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-err-${Date.now()}`,
          role: "assistant",
          content: {
            explanation: "The server encountered an error while coordinating with the OpenAI API. Please check your token configurations and try again.",
            simple_explanation: "An error occurred.",
            analogy: "N/A",
            interview_points: [],
            common_mistakes: [],
            practice_questions: [],
            mcqs: [],
            followup_topics: [],
            sources: []
          },
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedFollowup = (topic: string) => {
    setInputValue(topic);
    // Submit auto-query
    setTimeout(() => {
      const btn = document.getElementById("tutor-submit-btn");
      btn?.click();
    }, 100);
  };

  // Get data of the last assistant message
  const getLastAssistantMessage = (): TutorMessageContent | null => {
    const assistantMessages = messages.filter(m => m.role === "assistant");
    if (assistantMessages.length === 0) return null;
    const lastMsg = assistantMessages[assistantMessages.length - 1];
    return lastMsg.content as TutorMessageContent;
  };

  const activeAssistantData = getLastAssistantMessage();

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      {/* Top Banner Header */}
      <PageHeader
        title="AI Tutor"
        description="Ask concepts, review complex structures, and run quizzes customized to your indexed Knowledge Base."
      />

      {/* Floating Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm z-50 fixed bottom-6 right-6 max-w-sm shadow-xl ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : "bg-red-500/10 border-red-500/25 text-red-400"
          }`}
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Layout Split Pane */}
      <div className="flex-1 flex gap-5 min-h-0 overflow-hidden">
        
        {/* PANEL 1: Left History Sidebar */}
        <div className="hidden lg:flex w-72 flex-col border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-background-card/45 p-4 shrink-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs tracking-wider uppercase select-none">
              Sessions History
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={startNewChat}
              className="px-2 py-1 h-8 text-[11px] flex items-center gap-1 border border-slate-200 dark:border-slate-800"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {isHistoryLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 text-brand-primary animate-spin" />
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
                    activeConversationId === conv.id
                      ? "bg-slate-100 dark:bg-background-accent/80 text-brand-primary border-brand-primary/20"
                      : "text-slate-600 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800/20 hover:text-slate-900 dark:hover:text-slate-100 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate w-[85%]">
                    <MessageSquare className="h-4 w-4 shrink-0 text-text-muted group-hover:text-brand-primary" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="p-1 rounded text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-text-muted py-8 select-none">
                No previous conversations.
              </p>
            )}
          </div>
        </div>

        {/* PANEL 2: Center Chat Stream */}
        <div className="flex-1 flex flex-col border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-background-card/25 backdrop-blur-sm min-w-0 overflow-hidden">
          
          {/* Active Thread Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 px-6 py-4 bg-slate-50 dark:bg-background-card/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 border border-brand-primary/25 rounded-xl text-brand-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-sm">
                  {conversations.find(c => c.id === activeConversationId)?.title || "New Study Session"}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-text-secondary flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Tutor Node active
                </p>
              </div>
            </div>
            {activeConversationId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewChat}
                className="text-xs flex items-center gap-1.5"
              >
                Clear Screen
              </Button>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
                <Sparkles className="h-12 w-12 text-brand-primary/40 mb-4 animate-pulse" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">Start Learning Session</h3>
                <p className="text-xs text-text-muted mt-1.5 max-w-sm leading-relaxed">
                  Enter a concept from your course material. The Tutor Agent will match vector contexts and compile structured analyses.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isTutor = msg.role === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isTutor ? "justify-start" : "justify-end"}`}
                  >
                    <div className={`flex gap-3 max-w-[92%] ${isTutor ? "flex-row w-full" : "flex-row-reverse"}`}>
                      {/* Avatar */}
                      <div
                        className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs select-none ${
                          isTutor
                            ? "bg-brand-primary/10 border border-brand-primary/20 text-brand-primary"
                            : "bg-indigo-500/10 border border-indigo-500/25 text-brand-secondary"
                        }`}
                      >
                        {isTutor ? "AI" : "JD"}
                      </div>
                      
                      {/* Bubble */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {isTutor ? (
                          // TUTOR DETAILED STRUCTURED LAYOUT CARD
                          <div className="bg-white dark:bg-background-card/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl rounded-tl-none p-5 space-y-4 shadow-sm">
                            
                            {/* 1. Master Explanation */}
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-2 flex items-center gap-1.5 select-none">
                                <BookOpen className="h-3.5 w-3.5" /> Concept Breakdown
                              </h4>
                              {typeof msg.content === "object" ? (
                                <RenderMarkdown text={msg.content.explanation} />
                              ) : (
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              )}
                            </div>

                            {typeof msg.content === "object" && (
                              <>
                                {/* 2. Accordions (Layman Explanation & Analogy) */}
                                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                                  {/* Layman Explain */}
                                  <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl bg-slate-50 dark:bg-background/30 overflow-hidden">
                                    <button
                                      onClick={() =>
                                        setExpandedLaymanMsgId((prev) => ({
                                          ...prev,
                                          [msg.id]: !prev[msg.id],
                                        }))
                                      }
                                      className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-705 dark:text-slate-300 hover:text-slate-905 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/20 transition-colors"
                                    >
                                      <span className="flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                                        Explain to a 10-year old
                                      </span>
                                      {expandedLaymanMsgId[msg.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                    {expandedLaymanMsgId[msg.id] && (
                                      <div className="px-4.5 pb-4 text-xs text-slate-600 dark:text-text-secondary leading-relaxed border-t border-slate-200 dark:border-slate-800/40 pt-3">
                                        {msg.content.simple_explanation}
                                      </div>
                                    )}
                                  </div>

                                  {/* Analogy */}
                                  <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl bg-slate-50 dark:bg-background/30 overflow-hidden">
                                    <button
                                      onClick={() =>
                                        setExpandedAnalogyMsgId((prev) => ({
                                          ...prev,
                                          [msg.id]: !prev[msg.id],
                                        }))
                                      }
                                      className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-705 dark:text-slate-300 hover:text-slate-905 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/20 transition-colors"
                                    >
                                      <span className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-indigo-455 dark:text-indigo-400" />
                                        Real-world Analogy
                                      </span>
                                      {expandedAnalogyMsgId[msg.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                    {expandedAnalogyMsgId[msg.id] && (
                                      <div className="px-4.5 pb-4 text-xs text-slate-600 dark:text-text-secondary leading-relaxed border-t border-slate-200 dark:border-slate-800/40 pt-3 italic">
                                        {msg.content.analogy}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* 3. Highlights & Pitfalls (Interview Prep) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/60">
                                  {/* Interview points */}
                                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                                    <h5 className="text-[11px] font-bold text-brand-secondary flex items-center gap-1.5 uppercase select-none">
                                      <Award className="h-4 w-4 text-brand-secondary" /> Placement Target
                                    </h5>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {msg.content.interview_points.map((pt, pIdx) => (
                                        <li key={pIdx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                          {pt}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Mistakes points */}
                                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                                    <h5 className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1.5 uppercase select-none">
                                      <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" /> Common Pitfalls
                                    </h5>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {msg.content.common_mistakes.map((pt, pIdx) => (
                                        <li key={pIdx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                          {pt}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          // USER BUBBLE
                          <div className="bg-brand-primary text-white border border-transparent rounded-2xl rounded-tr-none px-4 py-3.5 text-sm leading-relaxed shadow-sm">
                            {typeof msg.content === "object" ? msg.content.explanation : msg.content}
                          </div>
                        )}
                        
                        <p className={`text-[9px] text-text-muted select-none ${isTutor ? "text-left" : "text-right"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%] flex-row w-full">
                  <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="bg-slate-50 dark:bg-background-card/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl rounded-tl-none px-5 py-4 w-60">
                    <div className="flex gap-1.5 items-center justify-center py-1">
                      <span className="h-2 w-2 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 bg-brand-primary rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts list */}
          {messages.length === 0 && (
            <div className="px-6 py-3 flex gap-2 overflow-x-auto border-t border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/10">
              {[
                "What is polymorphism in OOP?",
                "Explain the difference between TCP and UDP",
                "Explain Quick Sort time complexity",
              ].map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(tmpl)}
                  className="text-xs shrink-0 bg-slate-100 dark:bg-background-accent/80 border border-slate-200 dark:border-slate-700/60 hover:border-brand-primary/50 text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-slate-100 px-3 py-1.5 rounded-full transition-all select-none"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          )}

          {/* Input Chat Box */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-background-card/40 flex gap-3 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything about university concepts, programming, or database structures..."
              className="flex-1 rounded-xl border border-slate-250 dark:border-slate-800/80 bg-slate-50 dark:bg-background py-3.5 px-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
            />
            <Button
              type="submit"
              id="tutor-submit-btn"
              variant="primary"
              className="py-3.5 px-5 rounded-xl h-11 shrink-0"
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* PANEL 3: Right Tabs (Sources, Quizzes, Followups) */}
        <div className="w-[380px] hidden xl:flex flex-col border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-background-card/45 overflow-hidden shrink-0">
          
          {/* Tabs header buttons */}
          <div className="flex border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-background-card/50">
            {(["sources", "quizzes", "next"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveRightTab(tab)}
                className={`flex-1 py-3 text-xs font-semibold select-none border-b-2 capitalize transition-all ${
                  activeRightTab === tab
                    ? "border-brand-primary text-brand-primary bg-brand-primary/5"
                    : "border-transparent text-text-secondary hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/20"
                }`}
              >
                {tab === "next" ? "Follow-ups" : tab}
              </button>
            ))}
          </div>

          {/* Tab content panel */}
          <div className="flex-1 overflow-y-auto p-4.5 space-y-4">
            {!activeAssistantData ? (
              <div className="flex flex-col items-center justify-center h-48 text-center select-none text-text-muted">
                <BookOpen className="h-8 w-8 text-text-muted/40 mb-2" />
                <p className="text-xs">No active content results.</p>
              </div>
            ) : (
              <>
                {/* 1. SOURCES VIEW */}
                {activeRightTab === "sources" && (
                   <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 px-1 uppercase tracking-wider mb-1 select-none">
                      Retrieved References
                    </h4>
                    {activeAssistantData.sources.length === 0 ? (
                      <p className="text-xs text-text-muted italic text-center py-6">
                        No references matched vector search.
                      </p>
                    ) : (
                      activeAssistantData.sources.map((src, idx) => (
                        <Card
                          key={idx}
                          className="bg-white dark:bg-background-card/25 border-slate-250 dark:border-slate-800/60 overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setExpandedSourceIndex(expandedSourceIndex === idx ? null : idx)
                            }
                            className="w-full text-left p-3.5 flex flex-col gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/25 transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs w-full">
                              <span className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5 max-w-[170px] truncate">
                                <FileText className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                                {src.file_name}
                              </span>
                              <span className="bg-emerald-500/10 border border-emerald-500/20 text-brand-secondary text-[9px] px-2 py-0.5 rounded font-bold">
                                {(src.score * 100).toFixed(1)}% Match
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-text-muted w-full">
                              <span>Page {src.page}</span>
                              <span className="text-brand-primary hover:underline">
                                {expandedSourceIndex === idx ? "Collapse" : "Expand text"}
                              </span>
                            </div>
                          </button>

                          {expandedSourceIndex === idx && (
                            <div className="px-4.5 pb-4 text-xs text-slate-650 dark:text-text-secondary leading-relaxed border-t border-slate-200 dark:border-slate-800/40 pt-3 font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
                              {src.text}
                            </div>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {/* 2. QUIZZES VIEW */}
                {activeRightTab === "quizzes" && (
                  <div className="space-y-4.5">
                    {/* Multiple Choice Questions */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 px-1 uppercase tracking-wider mb-1 flex items-center gap-1.5 select-none">
                        <Award className="h-4 w-4 text-brand-secondary" /> Interactive Quiz
                      </h4>
                      {activeAssistantData.mcqs.length === 0 ? (
                        <p className="text-xs text-text-muted italic text-center py-6">
                          No quiz generated.
                        </p>
                      ) : (
                        activeAssistantData.mcqs.map((mcq, mIdx) => {
                          const stateKey = `${messages[messages.length - 1]?.id || "last"}-${mIdx}`;
                          const selectedOpt = selectedMcqOptions[stateKey];
                          
                          return (
                            <Card key={mIdx} className="bg-white dark:bg-background-card/20 border-slate-250 dark:border-slate-800/80 p-4 space-y-3">
                              <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                                {mIdx + 1}. {mcq.question}
                              </h5>
                              
                              <div className="space-y-1.5">
                                {mcq.options.map((opt, oIdx) => {
                                  const isSelected = selectedOpt === opt;
                                  const isCorrect = opt === mcq.correct_answer;
                                  let buttonStyle = "border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-background/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300";
                                  
                                  if (selectedOpt) {
                                    if (isCorrect) {
                                      buttonStyle = "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium";
                                    } else if (isSelected) {
                                      buttonStyle = "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-medium";
                                    } else {
                                      buttonStyle = "border-slate-200 dark:border-slate-800/50 bg-slate-50/60 dark:bg-background/20 text-slate-400 dark:text-slate-500 opacity-60 pointer-events-none";
                                    }
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => {
                                        if (!selectedOpt) {
                                          setSelectedMcqOptions((prev) => ({
                                            ...prev,
                                            [stateKey]: opt
                                          }));
                                        }
                                      }}
                                      disabled={!!selectedOpt}
                                      className={`w-full text-left px-3 py-2 text-xs rounded-xl border flex items-center justify-between transition-all ${buttonStyle}`}
                                    >
                                      <span>{opt}</span>
                                      {selectedOpt && (
                                        isCorrect ? (
                                          <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0 ml-2" />
                                        ) : isSelected ? (
                                          <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 ml-2" />
                                        ) : null
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {selectedOpt && (
                                <div className="text-[11px] text-text-secondary leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 pt-2 flex items-start gap-2">
                                  <AlertCircle className="h-3.5 w-3.5 text-brand-primary shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold text-slate-300">Explanation:</span> {mcq.explanation}
                                  </div>
                                </div>
                              )}
                            </Card>
                          );
                        })
                      )}
                    </div>

                    {/* Open Ended Practice */}
                    <div className="space-y-3 pt-3 border-t border-slate-800/60">
                      <h4 className="text-xs font-bold text-slate-300 px-1 uppercase tracking-wider mb-1 flex items-center gap-1.5 select-none">
                        <BookOpen className="h-4 w-4 text-brand-primary" /> Active Recall Prompts
                      </h4>
                      {activeAssistantData.practice_questions.length === 0 ? (
                        <p className="text-xs text-text-muted italic text-center py-6">
                          No practice questions generated.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {activeAssistantData.practice_questions.map((q, idx) => (
                            <li key={idx} className="p-3 rounded-xl border border-slate-800/60 bg-background/20 text-xs text-slate-300 leading-relaxed flex gap-2.5">
                              <span className="font-bold text-brand-primary">{idx + 1}.</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. FOLLOW-UPS VIEW */}
                {activeRightTab === "next" && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 px-1 uppercase tracking-wider mb-1 select-none">
                      Suggested Next Topics
                    </h4>
                    {activeAssistantData.followup_topics.length === 0 ? (
                      <p className="text-xs text-text-muted italic text-center py-6">
                        No follow-up suggestions generated.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activeAssistantData.followup_topics.map((topic, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestedFollowup(topic)}
                            className="w-full text-left p-3.5 rounded-xl border border-slate-800/80 bg-background-card/25 hover:border-brand-primary/50 text-xs text-slate-300 hover:text-slate-100 flex items-center justify-between transition-all group font-medium"
                          >
                            <span className="truncate max-w-[280px]">{topic}</span>
                            <Sparkles className="h-3.5 w-3.5 text-text-muted group-hover:text-brand-primary shrink-0 ml-2" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Tutor;
