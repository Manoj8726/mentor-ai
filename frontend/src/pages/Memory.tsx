import React, { useState, useEffect } from "react";
import {
  Brain,
  Trash2,
  CheckCircle,
  FileText,
  Loader2,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Flame,
  Clock,
  TrendingUp
} from "lucide-react";
import { api } from "@/services";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

interface LearningProfile {
  strong_topics: string[];
  weak_topics: string[];
  completed_study_plans: number;
  completed_interviews: number;
  resume_score: number;
  placement_readiness: number;
  last_learning_activity: string;
}

interface ConversationHeader {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const Memory: React.FC = () => {
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [conversations, setConversations] = useState<ConversationHeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchMemoryData();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchMemoryData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, convsRes] = await Promise.all([
        api.get("/memory/learning"),
        api.get("/memory/conversations")
      ]);
      setProfile(profileRes.data);
      setConversations(convsRes.data || []);
    } catch (err) {
      showNotification("error", "Failed to retrieve personalization memory.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm("Delete this conversation thread permanently from memory?")) return;

    setIsDeletingId(convId);
    try {
      await api.delete(`/memory/conversation/${convId}`);
      showNotification("success", "Conversation removed from memory.");
      
      // Reload fresh metrics and archives
      const [profileRes, convsRes] = await Promise.all([
        api.get("/memory/learning"),
        api.get("/memory/conversations")
      ]);
      setProfile(profileRes.data);
      setConversations(convsRes.data || []);
    } catch (err) {
      showNotification("error", "Failed to delete conversation.");
    } finally {
      setIsDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
        <p className="text-xs text-text-secondary select-none">Loading memory database matrices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalization Memory"
        description="Inspect details of what the AI agents remember about your progress, strengths, and conversations."
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
          <Award className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{notification.message}</span>
        </div>
      )}

      {profile && (
        <>
          {/* 1. AGGREGATES SCORES METRICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Completed Study plans */}
            <Card className="p-4 bg-background-card/40 border-slate-800/80 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-brand-primary/10 text-brand-primary">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="select-none">
                <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Completed Plans</span>
                <span className="text-xl font-bold text-slate-100">{profile.completed_study_plans} Plans</span>
              </div>
            </Card>

            {/* Completed Interviews */}
            <Card className="p-4 bg-background-card/40 border-slate-800/80 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Flame className="h-6 w-6" />
              </div>
              <div className="select-none">
                <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Mock Practice</span>
                <span className="text-xl font-bold text-slate-100">{profile.completed_interviews} Sessions</span>
              </div>
            </Card>

            {/* Resume Score */}
            <Card className="p-4 bg-background-card/40 border-slate-800/80 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                <FileText className="h-6 w-6" />
              </div>
              <div className="select-none">
                <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">ATS Alignment</span>
                <span className="text-xl font-bold text-slate-100">{profile.resume_score > 0 ? `${profile.resume_score.toFixed(0)}%` : "No Resume"}</span>
              </div>
            </Card>

            {/* Placement Forecast score */}
            <Card className="p-4 bg-background-card/40 border-slate-800/80 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="select-none">
                <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Readiness Predictor</span>
                <span className="text-xl font-bold text-slate-100">{profile.placement_readiness.toFixed(0)}%</span>
              </div>
            </Card>

          </div>

          {/* 2. MIDDLE ROW GRID: STRENGTHS/WEAKNESSES vs DIALOGUE LOGS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Topic matrix gaps (Strengths & Weaknesses) */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 bg-background-card/40 border-slate-800/80 h-full flex flex-col justify-between">
                <div>
                  <div className="border-b border-slate-800/60 pb-3 mb-4 select-none">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Brain className="h-4.5 w-4.5 text-indigo-400 animate-pulse" /> Diagnostics Memory Matrices
                    </h3>
                  </div>

                  {/* Strong Topics */}
                  <div className="space-y-3 mb-6 select-none">
                    <h4 className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 shrink-0" /> Verified Concept Strengths
                    </h4>
                    {profile.strong_topics.length === 0 ? (
                      <p className="text-xs text-text-muted italic py-2">Complete study plans to build up strengths.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 py-1">
                        {profile.strong_topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Weak Topics */}
                  <div className="space-y-3 select-none">
                    <h4 className="text-[10px] font-bold tracking-wider uppercase text-orange-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> Known Diagnostics Gaps
                    </h4>
                    {profile.weak_topics.length === 0 ? (
                      <p className="text-xs text-text-muted italic py-2">No active concept weaknesses detected.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 py-1">
                        {profile.weak_topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg text-xs font-medium"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Last Learning activity */}
                <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl flex gap-3 select-none mt-6">
                  <Clock className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Officer's activity logs</h5>
                    <p className="text-xs text-text-secondary leading-relaxed mt-1">
                      Last learning activity recorded: <span className="font-mono text-slate-100">{new Date(profile.last_learning_activity).toLocaleString()}</span>. This memory layer updates automatically on completes.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Conversation list archives */}
            <div className="lg:col-span-1">
              <Card className="p-5 bg-background-card/45 border-slate-800/80 flex flex-col h-full min-h-[350px]">
                <div className="border-b border-slate-800/60 pb-3 mb-4 select-none">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <BookOpen className="h-4.5 w-4.5 text-indigo-400" /> Active Conversation Threads
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px] select-none">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-text-muted italic text-center py-10">No active threads in memory.</p>
                  ) : (
                    conversations.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-center justify-between group transition-colors text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-semibold text-slate-200 truncate">{c.title}</p>
                          <span className="text-[9px] text-text-muted block mt-0.5">
                            {new Date(c.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteConversation(c.id)}
                          disabled={isDeletingId === c.id}
                          className="text-text-secondary hover:text-red-400 transition-colors shrink-0"
                        >
                          {isDeletingId === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Memory;
