import React, { useState, useEffect } from "react";
import {
  User,
  Briefcase,
  Building2,
  Clock,
  BookOpen,
  GraduationCap,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { api } from "@/services";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

interface PreferenceProfile {
  preferred_language: string;
  preferred_role: string;
  target_company: string;
  daily_study_hours: number;
  current_skill_level: string;
  learning_style: string;
  preferred_interview_type: string;
}

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<PreferenceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/memory/profile");
      setProfile(response.data);
    } catch (err) {
      showNotification("error", "Failed to retrieve profile preferences.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || isSaving) return;

    setIsSaving(true);
    try {
      const response = await api.put("/memory/profile", {
        preferred_role: profile.preferred_role,
        target_company: profile.target_company,
        daily_study_hours: profile.daily_study_hours,
        current_skill_level: profile.current_skill_level,
        learning_style: profile.learning_style,
        preferred_interview_type: profile.preferred_interview_type,
        preferred_language: profile.preferred_language
      });
      setProfile(response.data);
      showNotification("success", "Preferences saved successfully!");
    } catch (err) {
      showNotification("error", "Failed to modify preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
        <p className="text-xs text-text-secondary select-none">Loading personalization details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Personalization Profile"
        description="Customize your career paths, study allocations, and interview scopes to tailor AI responses."
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
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {profile && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card glow className="p-6 bg-background-card/45 border-slate-800/80">
            <div className="border-b border-slate-850 pb-4 mb-6 select-none">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-brand-primary animate-pulse" /> Personalization Parameters
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Preferred Role */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 select-none">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-400" /> Target Job Role
                </label>
                <input
                  type="text"
                  value={profile.preferred_role}
                  onChange={(e) => setProfile({ ...profile, preferred_role: e.target.value })}
                  placeholder="e.g. Backend Engineer, Java Specialist"
                  className="w-full bg-background-accent border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-text-muted outline-none transition-colors"
                  required
                />
              </div>

              {/* Target Company */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 select-none">
                  <Building2 className="h-3.5 w-3.5 text-indigo-400" /> Target Company
                </label>
                <input
                  type="text"
                  value={profile.target_company}
                  onChange={(e) => setProfile({ ...profile, target_company: e.target.value })}
                  placeholder="e.g. Google, Microsoft, Infosys"
                  className="w-full bg-background-accent border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-text-muted outline-none transition-colors"
                  required
                />
              </div>

              {/* Daily Study Hours */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 select-none">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" /> Daily Study Allocation (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={profile.daily_study_hours}
                  onChange={(e) => setProfile({ ...profile, daily_study_hours: parseFloat(e.target.value) || 2.0 })}
                  className="w-full bg-background-accent border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-text-muted outline-none transition-colors"
                  required
                />
              </div>

              {/* Skill level */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 select-none">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-400" /> Current Skill Level
                </label>
                <select
                  value={profile.current_skill_level}
                  onChange={(e) => setProfile({ ...profile, current_skill_level: e.target.value })}
                  className="w-full bg-background-accent border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none transition-colors"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              {/* Learning Style */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 select-none">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-400" /> Learning Style Preference
                </label>
                <select
                  value={profile.learning_style}
                  onChange={(e) => setProfile({ ...profile, learning_style: e.target.value })}
                  className="w-full bg-background-accent border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none transition-colors"
                >
                  <option value="Video Lectures & Code Practice">Video Lectures & Code Practice</option>
                  <option value="Detailed Theory & Textbooks">Detailed Theory & Textbooks</option>
                  <option value="Interactive Quizzes & Flashcards">Interactive Quizzes & Flashcards</option>
                </select>
              </div>

              {/* Interview Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 select-none">
                  <User className="h-3.5 w-3.5 text-indigo-400" /> Preferred Interview Type
                </label>
                <select
                  value={profile.preferred_interview_type}
                  onChange={(e) => setProfile({ ...profile, preferred_interview_type: e.target.value })}
                  className="w-full bg-background-accent border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none transition-colors"
                >
                  <option value="Technical Coding">Technical Coding</option>
                  <option value="System Design & Architecture">System Design & Architecture</option>
                  <option value="Behavioral & HR Prep">Behavioral & HR Prep</option>
                </select>
              </div>

            </div>

            {/* Save Buttons */}
            <div className="flex justify-end pt-6 select-none">
              <Button
                type="submit"
                disabled={isSaving}
                variant="primary"
                size="sm"
                className="flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Profile
                  </>
                )}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
};

export default Profile;
