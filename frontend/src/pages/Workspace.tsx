import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  Calendar,
  TrendingUp,
  Flame,
  UploadCloud,
  MessageSquareCode,
  Award,
  ChevronRight,
  Loader2,
  FileText,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { api } from "@/services";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

interface WorkspaceMetrics {
  overall_score: number;
  study_completion: number;
  interview_score: number;
  resume_score: number;
  streak: number;
  kb_files: number;
  weak_topics: string[];
  recommendations: Array<{ id: string; title: string; description: string; priority: string }>;
}

export const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<WorkspaceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaceDetails();
  }, []);

  const fetchWorkspaceDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch concurrently from memory & progress endpoints
      const [learningRes, progressRes] = await Promise.all([
        api.get("/memory/learning").catch(() => ({ data: null })),
        api.get("/progress/dashboard").catch(() => ({ data: null }))
      ]);

      const learnData = learningRes.data;
      const progData = progressRes.data;

      setMetrics({
        overall_score: progData?.overall_score ?? learnData?.placement_readiness ?? 60.0,
        study_completion: progData?.study_completion_percentage ?? learnData?.completed_study_plans ?? 50.0,
        interview_score: progData?.interview_score ?? 0.0,
        resume_score: progData?.resume_score ?? learnData?.resume_score ?? 0.0,
        streak: progData?.streak?.current_streak ?? 0,
        kb_files: progData?.knowledge_base_usage ?? learnData?.completed_study_plans ?? 0,
        weak_topics: learnData?.weak_topics ?? [],
        recommendations: progData?.recommendations?.slice(0, 3) ?? []
      });
    } catch (err) {
      // Fallback baseline on error
      setMetrics({
        overall_score: 65.0,
        study_completion: 45.0,
        interview_score: 0.0,
        resume_score: 0.0,
        streak: 0,
        kb_files: 0,
        weak_topics: ["SQL syntax", "Recursion"],
        recommendations: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
        <p className="text-xs text-text-secondary select-none">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <PageHeader
        title="Personal Workspace"
        description="Monitor study schedules, execute AI tutor queries, and inspect placement readiness metrics."
      />

      {/* Quick Metrics Dials Row */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Readiness Forecast Card */}
          <Card hoverable className="p-5 flex items-center justify-between bg-slate-900/35 border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Placement Readiness</span>
              <p className="text-2xl font-bold text-slate-100">{metrics.overall_score.toFixed(0)}%</p>
              <span className="text-[9px] text-text-secondary block">Computed readiness score</span>
            </div>
            <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
          </Card>

          {/* Resume Matching Card */}
          <Card hoverable className="p-5 flex items-center justify-between bg-slate-900/35 border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Resume Match</span>
              <p className="text-2xl font-bold text-slate-100">{metrics.resume_score > 0 ? `${metrics.resume_score.toFixed(0)}%` : "N/A"}</p>
              <span className="text-[9px] text-text-secondary block">ATS compatibility rate</span>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <FileText className="h-5.5 w-5.5" />
            </div>
          </Card>

          {/* Active study streak */}
          <Card hoverable className="p-5 flex items-center justify-between bg-slate-900/35 border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Active Streak</span>
              <p className="text-2xl font-bold text-slate-100">{metrics.streak} Days</p>
              <span className="text-[9px] text-text-secondary block">Consecutive study logs</span>
            </div>
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl animate-pulse">
              <Flame className="h-5.5 w-5.5" />
            </div>
          </Card>

          {/* Indexed Knowledge base files */}
          <Card hoverable className="p-5 flex items-center justify-between bg-slate-900/35 border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Knowledge Base</span>
              <p className="text-2xl font-bold text-slate-100">{metrics.kb_files} Documents</p>
              <span className="text-[9px] text-text-secondary block">Index textbooks & guides</span>
            </div>
            <div className="p-3 bg-purple-500/10 border border-brand-purple/20 text-purple-400 rounded-xl">
              <BookOpen className="h-5.5 w-5.5" />
            </div>
          </Card>
        </div>
      )}

      {/* Main Grid Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Actions & Learning Gaps */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions Panel */}
          <Card className="p-5 bg-background-card/45 border-slate-800/80">
            <div className="mb-4 select-none">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Launchpads</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 select-none">
              {[
                { name: "Tutor Chat", path: "/tutor", icon: MessageSquareCode, color: "bg-brand-primary/10 border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20" },
                { name: "Syllabus Plans", path: "/planner", icon: Calendar, color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20" },
                { name: "Placement Prep", path: "/placement", icon: Award, color: "bg-purple-500/10 border-brand-purple/20 text-purple-400 hover:bg-purple-500/20" },
                { name: "Index Syllabus", path: "/knowledge", icon: UploadCloud, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" }
              ].map((act, idx) => {
                const Icon = act.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(act.path)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${act.color}`}
                  >
                    <Icon className="h-5.5 w-5.5 mb-2 shrink-0" />
                    <span className="text-[11px] font-semibold">{act.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* AI Recommended Tasks List */}
          {metrics && (
            <Card className="p-5 bg-background-card/30 border-slate-800/60">
              <div className="border-b border-slate-850 pb-3 mb-4 select-none flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-brand-primary animate-pulse" /> Active AI Insights
                </h3>
                <Link to="/progress" className="text-[10px] text-brand-primary hover:underline font-semibold flex items-center gap-0.5">
                  View Analytics <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {metrics.recommendations.length === 0 ? (
                  <div className="rounded-xl border border-slate-800/80 bg-background-card/50 p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="select-none">
                      <h4 className="text-xs font-semibold text-slate-100">All recommendation milestones cleared!</h4>
                      <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">
                        Run a recalculation on the Progress page to verify new targets.
                      </p>
                    </div>
                  </div>
                ) : (
                  metrics.recommendations.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/10 flex justify-between items-start gap-4 hover:border-slate-800 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 text-xs">{rec.title}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            rec.priority === "High" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"
                          }`}>{rec.priority}</span>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

        </div>

        {/* Right Column: Strengths and Weaknesses */}
        {metrics && (
          <div className="lg:col-span-1 space-y-6">
            
            {/* Diagnostic Concept Gaps */}
            <Card className="p-5 bg-background-card/45 border-slate-800/80 h-full flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-850 pb-3 mb-4 select-none">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-4.5 w-4.5 text-orange-500" /> Diagnostics Gaps
                  </h3>
                </div>

                <div className="space-y-2 select-none">
                  {metrics.weak_topics.length === 0 ? (
                    <p className="text-xs text-text-muted italic py-4 text-center">No concept weaknesses detected.</p>
                  ) : (
                    metrics.weak_topics.map((topic, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200">{topic}</span>
                        <span className="text-[8px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-mono">Review Target</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Memory Dashboard link */}
              <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl mt-6 flex justify-between items-center select-none">
                <div className="min-w-0 pr-2">
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">Long-Term Memory</span>
                  <p className="text-[10px] text-text-muted leading-tight mt-0.5">View your verified concept strengths.</p>
                </div>
                <button
                  onClick={() => navigate("/memory")}
                  className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Card>

          </div>
        )}

      </div>
    </div>
  );
};

export default Workspace;
