import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Flame,
  Award,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  BrainCircuit,
  GraduationCap,
  Compass,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from "recharts";
import { api } from "@/services";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

interface WeakTopic {
  id: string;
  topic: string;
  confidence: number;
  source: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

interface DashboardData {
  overall_score: number;
  study_completion_percentage: number;
  interview_score: number;
  resume_score: number;
  knowledge_base_usage: number;
  streak: Streak;
  weak_topics: WeakTopic[];
  recommendations: Recommendation[];
  placement_readiness: number;
  interview_readiness: number;
  study_consistency: number;
  readiness_explanation: string;
  weekly_activity_chart: Array<{ day: string; study_milestones: number; study_hours: number }>;
  interview_score_trend_chart: Array<{ date: string; score: number }>;
}

export const Progress: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/progress/dashboard");
      setData(response.data);
    } catch (err) {
      showNotification("error", "Failed to retrieve learning analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const response = await api.post("/progress/recalculate");
      setData(response.data);
      showNotification("success", "Analytics engine recalculated successfully!");
    } catch (err) {
      showNotification("error", "Recalculation failed.");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleUpdateRecommendation = async (recId: string, status: "completed" | "dismissed") => {
    try {
      await api.put(`/progress/recommendations/${recId}?rec_status=${status}`);
      
      // Update locally
      if (data) {
        const updatedRecs = data.recommendations.filter((r) => r.id !== recId);
        
        // If marked completed, increment current streak locally for visual reward
        let nextStreak = { ...data.streak };
        if (status === "completed") {
          nextStreak.current_streak += 1;
          if (nextStreak.current_streak > nextStreak.longest_streak) {
            nextStreak.longest_streak = nextStreak.current_streak;
          }
        }

        setData({
          ...data,
          recommendations: updatedRecs,
          streak: nextStreak
        });
      }
      showNotification("success", `Recommendation marked ${status}!`);
    } catch (err) {
      showNotification("error", "Failed to update recommendation status.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
        <p className="text-xs text-text-secondary select-none">Retrieving learning timeline analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Learning Progress"
        description="Inspect study durations, mock test indicators, and AI readiness scores."
      >
        <Button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          variant="primary"
          size="sm"
          className="flex items-center gap-1.5"
        >
          {isRecalculating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Recalculating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Recalculate Analytics
            </>
          )}
        </Button>
      </PageHeader>

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

      {data && (
        <>
          {/* 1. OVERVIEW METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Overall Score */}
            <Card className="p-4 bg-background-card/40 border-slate-800/80 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-brand-primary/10 text-brand-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Overall Score</span>
                <span className="text-xl font-bold text-slate-100">{data.overall_score.toFixed(1)}%</span>
              </div>
            </Card>

            {/* Study Completion */}
            <Card className="p-4 bg-background-card/40 border-slate-800/80 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Study Completion</span>
                <span className="text-xl font-bold text-slate-100">{data.study_completion_percentage.toFixed(1)}%</span>
              </div>
            </Card>

            {/* Interview Score */}
            <Card className="p-4 bg-background-card/40 border-slate-800/80 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Avg Interview</span>
                <span className="text-xl font-bold text-slate-100">{data.interview_score > 0 ? `${data.interview_score.toFixed(1)}%` : "N/A"}</span>
              </div>
            </Card>

            {/* Resume Score */}
            <Card className="p-4 bg-background-card/40 border-slate-800/80 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Resume Match</span>
                <span className="text-xl font-bold text-slate-100">{data.resume_score > 0 ? `${data.resume_score.toFixed(1)}%` : "N/A"}</span>
              </div>
            </Card>

            {/* Streak Counter */}
            <Card className="p-4 bg-background-card/40 border-slate-800/80 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500 animate-pulse">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider block">Active Streak</span>
                <span className="text-xl font-bold text-slate-100">{data.streak.current_streak} Days</span>
              </div>
            </Card>

          </div>

          {/* 2. RECHARTS ANALYTICS GRAPHS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Study Milestones Completed per Day */}
            <Card className="p-5 bg-background-card/45 border-slate-800/80">
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Weekly Activity Log</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Study days completed and target learning durations</p>
              </div>
              <div className="h-72 w-full">
                {data.weekly_activity_chart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-text-muted italic">No activity logs recorded.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.weekly_activity_chart}>
                      <defs>
                        <linearGradient id="colorMilestones" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0b0f19",
                          borderColor: "rgba(255, 255, 255, 0.08)",
                          borderRadius: "8px",
                          color: "#f1f5f9"
                        }}
                      />
                      <Area type="monotone" dataKey="study_milestones" stroke="#6366f1" fillOpacity={1} fill="url(#colorMilestones)" name="Tasks Completed" />
                      <Area type="monotone" dataKey="study_hours" stroke="#10b981" fillOpacity={0} name="Study Hours" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Right: Mock Interview Scores Trend over Time */}
            <Card className="p-5 bg-background-card/45 border-slate-800/80">
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Mock Performance Trend</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Scores timeline across placement mock sessions</p>
              </div>
              <div className="h-72 w-full">
                {data.interview_score_trend_chart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-text-muted italic">No mock sessions completed yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.interview_score_trend_chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0b0f19",
                          borderColor: "rgba(255, 255, 255, 0.08)",
                          borderRadius: "8px",
                          color: "#f1f5f9"
                        }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={2.5} name="Session Score" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

          </div>

          {/* 3. MIDDLE ROW: WEAK TOPICS & READINESS FORECAST */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Detected Weak Topics */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="p-5 bg-background-card/30 border-slate-800/60 flex flex-col h-full min-h-[350px]">
                <div className="border-b border-slate-800/60 pb-3 mb-4 select-none">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Diagnostics Gaps
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px]">
                  {data.weak_topics.length === 0 ? (
                    <p className="text-xs text-text-muted italic text-center py-10">No diagnostic weaknesses detected. Keep studying!</p>
                  ) : (
                    data.weak_topics.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center w-full select-none">
                          <span className="font-semibold text-slate-200">{item.topic}</span>
                          <span className="text-[9px] bg-slate-800 text-text-muted px-2 py-0.5 rounded font-bold">{item.source}</span>
                        </div>
                        {/* confidence bar indicator */}
                        <div className="space-y-1 select-none">
                          <div className="flex justify-between text-[9px] text-text-secondary font-mono">
                            <span>Diagnostic Certainty</span>
                            <span>{Math.round(item.confidence * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                            <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${item.confidence * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Readiness Index Gauge Predictions */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-5 bg-background-card/30 border-slate-800/60 h-full flex flex-col justify-between">
                <div>
                  <div className="border-b border-slate-800/60 pb-3 mb-4 select-none">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <BrainCircuit className="h-4 w-4 text-brand-primary" /> AI Placement Forecasts
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2 select-none">
                    {/* Placement Readiness */}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="relative flex items-center justify-center">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="32" strokeWidth="4" stroke="rgba(255, 255, 255, 0.05)" fill="transparent" />
                          <circle cx="40" cy="40" r="32" strokeWidth="4" stroke="#10b981" fill="transparent"
                            strokeDasharray={201}
                            strokeDashoffset={201 - (201 * (data.placement_readiness / 100))}
                            className="transition-all duration-500 ease-out"
                          />
                        </svg>
                        <span className="absolute text-sm font-bold text-slate-100">{Math.round(data.placement_readiness)}%</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-300">Placement Readiness</span>
                    </div>

                    {/* Interview Readiness */}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="relative flex items-center justify-center">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="32" strokeWidth="4" stroke="rgba(255, 255, 255, 0.05)" fill="transparent" />
                          <circle cx="40" cy="40" r="32" strokeWidth="4" stroke="#a855f7" fill="transparent"
                            strokeDasharray={201}
                            strokeDashoffset={201 - (201 * (data.interview_readiness / 100))}
                            className="transition-all duration-500 ease-out"
                          />
                        </svg>
                        <span className="absolute text-sm font-bold text-slate-100">{Math.round(data.interview_readiness)}%</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-300">Interview Confidence</span>
                    </div>

                    {/* Study Consistency */}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="relative flex items-center justify-center">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="32" strokeWidth="4" stroke="rgba(255, 255, 255, 0.05)" fill="transparent" />
                          <circle cx="40" cy="40" r="32" strokeWidth="4" stroke="#6366f1" fill="transparent"
                            strokeDasharray={201}
                            strokeDashoffset={201 - (201 * (data.study_consistency / 100))}
                            className="transition-all duration-500 ease-out"
                          />
                        </svg>
                        <span className="absolute text-sm font-bold text-slate-100">{Math.round(data.study_consistency)}%</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-300">Study Consistency</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl flex gap-3 select-none mt-4">
                  <Compass className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Officer's Remarks</h5>
                    <p className="text-xs text-text-secondary leading-relaxed mt-1">
                      {data.readiness_explanation}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

          </div>

          {/* 4. BOTTOM ROW: RECOMMENDATIONS ACTION ITEMS */}
          <div className="space-y-4">
            <Card className="p-5 bg-background-card/30 border-slate-800/60">
              <div className="border-b border-slate-800/60 pb-3 mb-4 select-none">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-brand-primary" /> Recommended Revision Checklist
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recommendations.length === 0 ? (
                  <p className="text-xs text-text-muted italic col-span-2 text-center py-6">All recommendations completed! Run recalculate to verify new targets.</p>
                ) : (
                  data.recommendations.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-2xl border border-slate-800/80 bg-background/25 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center w-full select-none">
                          <span className="font-semibold text-slate-200 text-xs">{rec.title}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            rec.priority === "High"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : rec.priority === "Medium"
                              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                              : "bg-slate-800 text-text-muted"
                          }`}>{rec.priority}</span>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">{rec.description}</p>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 border-t border-slate-800/40 pt-3 select-none">
                        <button
                          onClick={() => handleUpdateRecommendation(rec.id, "dismissed")}
                          className="px-2.5 py-1 text-[10px] text-text-muted hover:text-red-400 hover:bg-slate-800/40 rounded transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleUpdateRecommendation(rec.id, "completed")}
                          className="px-2.5 py-1 text-[10px] bg-brand-secondary/15 border border-brand-secondary/35 text-brand-secondary hover:bg-brand-secondary/20 rounded transition-colors"
                        >
                          Mark Completed
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Progress;
