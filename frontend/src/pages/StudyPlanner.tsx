import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Clock,
  Check,
  Trash2,
  Loader2,
  AlertCircle,
  Lightbulb,
  Award,
  ListTodo
} from "lucide-react";
import { api } from "@/services";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

interface StudyDay {
  id: string;
  study_plan_id: string;
  day_number: number;
  date: string;
  topic: string;
  estimated_hours: number;
  status: "pending" | "completed";
}

interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  goal: string;
  start_date: string;
  end_date: string;
  hours_per_day: number;
  status: string;
  created_at: string;
  updated_at: string;
  progress_percentage: number;
  days: StudyDay[];
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const StudyPlanner: React.FC = () => {
  // Plan states
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [goal, setGoal] = useState("");
  const [subjects, setSubjects] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [examDate, setExamDate] = useState("");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [preferredDays, setPreferredDays] = useState<string[]>(WEEKDAYS);

  useEffect(() => {
    fetchPlans();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchPlans = async () => {
    setIsListLoading(true);
    try {
      const response = await api.get("/planner/plans");
      const list = response.data || [];
      setPlans(list);
      // Automatically select the first plan if none is active
      if (list.length > 0 && !selectedPlan) {
        loadPlanDetails(list[0].id);
      }
    } catch (err) {
      showNotification("error", "Failed to retrieve study plans.");
    } finally {
      setIsListLoading(false);
    }
  };

  const loadPlanDetails = async (planId: string) => {
    setIsDetailsLoading(true);
    try {
      const response = await api.get(`/planner/${planId}`);
      setSelectedPlan(response.data);
    } catch (err) {
      showNotification("error", "Could not load study plan details.");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleToggleDay = async (dayId: string) => {
    if (!selectedPlan) return;
    try {
      const response = await api.put(`/planner/day/${dayId}/complete`);
      const updatedDay = response.data as StudyDay;

      // Update locally
      const updatedDays = selectedPlan.days.map((d) =>
        d.id === dayId ? updatedDay : d
      );
      
      // Recalculate progress percentage
      const completed = updatedDays.filter(d => d.status === "completed").length;
      const progress = Math.round((completed / updatedDays.length) * 100);

      const nextPlan = {
        ...selectedPlan,
        days: updatedDays,
        progress_percentage: progress
      };
      
      setSelectedPlan(nextPlan);
      
      // Update in main plans list as well
      setPlans(prev =>
        prev.map((p) => (p.id === selectedPlan.id ? nextPlan : p))
      );
    } catch (err) {
      showNotification("error", "Failed to toggle completion check.");
    }
  };

  const handleDeletePlan = async (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Wipe this study plan and all daily progress checklists? This is permanent.")) return;

    try {
      await api.delete(`/planner/${planId}`);
      showNotification("success", "Study plan deleted.");
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
      }
      fetchPlans();
    } catch (err) {
      showNotification("error", "Deletion failed.");
    }
  };

  const handleWeekdayCheckbox = (day: string) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || !subjects.trim() || !examDate || preferredDays.length === 0) {
      showNotification("error", "Please fill in all form inputs.");
      return;
    }

    if (new Date(examDate) <= new Date()) {
      showNotification("error", "The exam date must be in the future.");
      return;
    }

    setIsSubmitLoading(true);
    try {
      const response = await api.post("/planner/create", {
        goal,
        subjects,
        hours_per_day: hoursPerDay,
        exam_date: examDate,
        skill_level: skillLevel,
        preferred_study_days: preferredDays
      });

      showNotification("success", "Personalized study plan created!");
      // Reset form
      setGoal("");
      setSubjects("");
      setHoursPerDay(2);
      setExamDate("");
      setSkillLevel("Beginner");
      setPreferredDays(WEEKDAYS);

      const newPlan = response.data;
      setSelectedPlan(newPlan);
      fetchPlans();
    } catch (err: any) {
      showNotification("error", err.response?.data?.detail || "Plan generation failed.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Study Planner"
        description="Auto-generate daily learning milestones, revision schedules, and mocks mapped to your course syllabus."
      />

      {/* Floating Alert Notifications */}
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

      {/* Split layout grids */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 min-h-0">
        
        {/* Left Column: Previous Study Plans List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 bg-white dark:bg-background-card/45 border-slate-200 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs tracking-wider uppercase select-none">
                Your Plans
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlan(null)}
                className="px-2 py-1 text-[11px] h-7 border border-slate-200 dark:border-slate-800"
              >
                Create New
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {isListLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-5 w-5 text-brand-primary animate-spin" />
                </div>
              ) : plans.length > 0 ? (
                plans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => loadPlanDetails(p.id)}
                    className={`group relative flex flex-col p-3.5 rounded-xl cursor-pointer transition-all duration-200 border text-left ${
                      selectedPlan?.id === p.id
                        ? "bg-slate-100 dark:bg-background-accent/80 border-brand-primary/25 text-brand-primary"
                        : "text-slate-600 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800/20 hover:text-slate-900 dark:hover:text-slate-100 border-transparent bg-slate-50 dark:bg-background/25"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[130px]">
                        {p.title.split("(")[0].trim()}
                      </span>
                      <button
                        onClick={(e) => handleDeletePlan(p.id, e)}
                        className="p-1 rounded text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="text-[10px] text-text-muted mt-1 select-none">
                      Hours: {p.hours_per_day}/day • End: {p.end_date}
                    </span>

                    {/* Simple Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full h-1 mt-2.5 overflow-hidden">
                      <div
                        className="bg-brand-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${p.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-text-muted py-8 select-none">
                  No active study plans.
                </p>
              )}
            </div>
          </Card>

          {/* Tips Card */}
          <Card className="p-4 bg-white dark:bg-background-card/20 border-slate-200 dark:border-slate-800/80 flex gap-3 select-none">
            <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300">Spaced Repetition</h4>
              <p className="text-[10px] text-slate-600 dark:text-text-secondary leading-relaxed mt-1">
                The planner integrates automatic revision cycles. Overlapping study blocks ensure you review past concepts before moving forward.
              </p>
            </div>
          </Card>
        </div>

        {/* Center/Right Dynamic Panels */}
        <div className="lg:col-span-3">
          {!selectedPlan ? (
            // FORM VIEW: Create new plan
            <Card className="bg-white dark:bg-background-card/40 border-slate-200 dark:border-slate-800/80 p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-primary mb-1 select-none">
                  Generate Study Plan
                </h3>
                <p className="text-xs text-text-muted select-none">
                  Fill in your target goals, daily hours, and subject filters to run RAG calendar indexing.
                </p>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Goal Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Overall Goal</label>
                    <input
                      type="text"
                      placeholder="e.g. Java Placement Prep, OS Midterm"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-background py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-slate-400 dark:placeholder:text-text-muted"
                    />
                  </div>

                  {/* Subjects Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subjects / Focus Areas</label>
                    <input
                      type="text"
                      placeholder="e.g. OOP, Multithreading, Collection APIs"
                      value={subjects}
                      onChange={(e) => setSubjects(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-background py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-slate-400 dark:placeholder:text-text-muted"
                    />
                  </div>

                  {/* Hours Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Daily Study Hours</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(parseInt(e.target.value) || 1)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-background py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-slate-400 dark:placeholder:text-text-muted"
                    />
                  </div>

                  {/* Exam Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Exam / Completion Date</label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-background py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-slate-400 dark:placeholder:text-text-muted"
                    />
                  </div>

                  {/* Skill level */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Skill Level</label>
                    <select
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-background py-2.5 px-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Weekdays preference */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Preferred Study Weekdays</label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => {
                      const isSelected = preferredDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => handleWeekdayCheckbox(day)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all select-none ${
                            isSelected
                              ? "bg-brand-primary/15 border-brand-primary text-brand-primary"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-background/40 text-slate-600 dark:text-text-secondary hover:border-slate-400 dark:hover:border-slate-700"
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitLoading}
                    className="px-6 flex items-center gap-2"
                  >
                    {isSubmitLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Querying Syllabus RAG...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Auto-Generate Schedule
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            // DETAILS VIEW: Display active study plan details
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Plan Metadata Summary Columns */}
              <div className="xl:col-span-1 space-y-6">
                <Card className="p-5 bg-white dark:bg-background-card/45 border-slate-200 dark:border-slate-800/80 space-y-5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-1 select-none">
                      Progress Tracker
                    </h3>
                    <p className="text-[10px] text-text-muted select-none">
                      Cycle status for active schedules
                    </p>
                  </div>

                  {/* Circular Progress Ring */}
                  <div className="flex flex-col items-center justify-center py-2 select-none">
                    <div className="relative flex items-center justify-center text-slate-200/20 dark:text-slate-100/10">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="44" strokeWidth="6" stroke="currentColor" fill="transparent" />
                        <circle cx="56" cy="56" r="44" strokeWidth="6" stroke="#6366f1" fill="transparent"
                          strokeDasharray={276.3}
                          strokeDashoffset={276.3 - (276.3 * (selectedPlan.progress_percentage / 100))}
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                          {selectedPlan.progress_percentage}%
                        </span>
                        <p className="text-[9px] text-text-muted">Completed</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-200 dark:border-slate-800/60 pt-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-text-secondary">Study Target:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-300">{selectedPlan.days.length} Days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-text-secondary">Hours commitment:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-300">{selectedPlan.hours_per_day} hrs/day</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-text-secondary">Timeline interval:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-300">{selectedPlan.start_date} to {selectedPlan.end_date}</span>
                    </div>
                  </div>
                </Card>

                {/* Motivations & PDF attachments summaries parsed from goal field */}
                <Card className="p-5 bg-white dark:bg-background-card/25 border-slate-200 dark:border-slate-800/80 space-y-4 select-none">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-brand-secondary" /> Tutor Recommendations
                  </h4>
                  <div className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed space-y-3 whitespace-pre-line border-l border-slate-200 dark:border-slate-800 pl-3">
                    {selectedPlan.goal}
                  </div>
                </Card>
              </div>

              {/* Study Days Timeline List */}
              <div className="xl:col-span-2 space-y-4">
                <Card className="p-5 bg-white dark:bg-background-card/30 border-slate-200 dark:border-slate-800/60 flex flex-col h-full min-h-[450px]">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-3 mb-4 select-none">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                      <ListTodo className="h-4 w-4 text-brand-primary" /> Daily Milestones
                    </h3>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-text-muted px-2 py-0.5 rounded-full font-bold">
                      {selectedPlan.days.filter(d => d.status === "completed").length}/{selectedPlan.days.length} Completed
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
                    {isDetailsLoading ? (
                      <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-6 w-6 text-brand-primary animate-spin" />
                      </div>
                    ) : selectedPlan.days.length > 0 ? (
                      selectedPlan.days.map((day) => {
                        const isCompleted = day.status === "completed";
                        return (
                          <div
                            key={day.id}
                            onClick={() => handleToggleDay(day.id)}
                            className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/10 ${
                              isCompleted
                                ? "bg-emerald-500/5 border-emerald-500/20 text-slate-500 dark:text-text-muted"
                                : "bg-slate-50 dark:bg-background-card/20 border-slate-250 dark:border-slate-800/80 text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {/* Completion Checkbox button */}
                            <button
                              className={`mt-0.5 rounded border p-0.5 transition-colors shrink-0 ${
                                isCompleted
                                  ? "bg-brand-secondary border-brand-secondary text-white"
                                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-transparent"
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex justify-between items-center w-full">
                                <span className={`text-xs font-semibold ${isCompleted ? "line-through text-slate-405 dark:text-text-muted" : "text-slate-800 dark:text-slate-200"}`}>
                                  Day {day.day_number} - {formatDate(day.date)}
                                </span>
                                <span className="text-[10px] text-text-muted font-semibold flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {day.estimated_hours} hrs
                                </span>
                              </div>
                              <p className={`text-xs leading-relaxed ${isCompleted ? "line-through text-slate-405 dark:text-text-muted italic" : "text-slate-650 dark:text-slate-300"}`}>
                                {day.topic}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-text-muted italic text-center py-8">
                        No days generated in plan.
                      </p>
                    )}
                  </div>
                </Card>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudyPlanner;
