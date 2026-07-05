import React, { useState } from "react";
import {
  Sliders,
  Bell,
  Lock,
  Sun,
  Moon,
  Info,
  Save,
  CheckCircle2
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

type TabName = "general" | "notifications" | "security" | "theme" | "about";

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabName>("general");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const tabs = [
    { id: "general" as const, name: "General Settings", icon: Sliders },
    { id: "theme" as const, name: "Theme Selection", icon: Sun },
    { id: "notifications" as const, name: "Notifications", icon: Bell },
    { id: "security" as const, name: "Security & Passwords", icon: Lock },
    { id: "about" as const, name: "About Platform", icon: Info }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Configuration Control Panel"
        description="Configure account information, interface visual themes, alerts toggles, and security settings."
      />

      {/* Floating Success Indicator */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/25 text-emerald-400 flex items-center gap-2 text-xs font-semibold z-50 shadow-xl select-none animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>Platform preferences saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 select-none">
        
        {/* Left Column Navigation Tabs */}
        <div className="md:col-span-1 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  isActive
                    ? "bg-slate-900 border-slate-800 text-brand-primary"
                    : "text-text-secondary border-transparent hover:bg-slate-900/40 hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Column Content Port */}
        <div className="md:col-span-3">
          
          {/* 1. GENERAL ACCOUNT SETTINGS */}
          {activeTab === "general" && (
            <Card className="p-6 bg-background-card/45 border-slate-800/80">
              <div className="border-b border-slate-850 pb-3 mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Account details</h4>
                <p className="text-[10px] text-text-muted mt-0.5">Primary contact profile settings.</p>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Candidate Name</label>
                    <input
                      type="text"
                      defaultValue={user?.full_name || "John Doe"}
                      className="w-full bg-background-accent border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-text-muted outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Contact Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email || "john.doe@university.edu"}
                      className="w-full bg-background-accent border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-text-muted outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="primary" size="sm" className="flex items-center gap-1.5">
                    <Save className="h-4 w-4" /> Save Details
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* 2. THEME OPTION MATRIX */}
          {activeTab === "theme" && (
            <Card className="p-6 bg-background-card/45 border-slate-800/80">
              <div className="border-b border-slate-850 pb-3 mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Visual Theme Mode</h4>
                <p className="text-[10px] text-text-muted mt-0.5">Customize the color tone of the dashboard panels.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Light Mode Radio Option Card */}
                <div
                  onClick={() => setTheme("light")}
                  className={`p-5 rounded-2xl border flex flex-col justify-between h-36 cursor-pointer transition-all ${
                    theme === "light"
                      ? "bg-slate-900/10 border-indigo-500 text-indigo-400 shadow-glow"
                      : "bg-slate-900/35 border-slate-850 text-text-muted hover:border-slate-800"
                  }`}
                >
                  <Sun className="h-6 w-6 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-100 block">Light Theme</h5>
                    <span className="text-[10px] text-text-secondary block mt-0.5">Clean high-contrast colors</span>
                  </div>
                </div>

                {/* Dark Mode Radio Option Card */}
                <div
                  onClick={() => setTheme("dark")}
                  className={`p-5 rounded-2xl border flex flex-col justify-between h-36 cursor-pointer transition-all ${
                    theme === "dark"
                      ? "bg-slate-900/10 border-indigo-500 text-indigo-400 shadow-glow"
                      : "bg-slate-900/35 border-slate-850 text-text-muted hover:border-slate-800"
                  }`}
                >
                  <Moon className="h-6 w-6 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-100 block">Dark Theme (Recommended)</h5>
                    <span className="text-[10px] text-text-secondary block mt-0.5">Vibrant glowing accents</span>
                  </div>
                </div>

              </div>
            </Card>
          )}

          {/* 3. ALERTS & NOTIFICATION CONFIGURATION */}
          {activeTab === "notifications" && (
            <Card className="p-6 bg-background-card/45 border-slate-800/80">
              <div className="border-b border-slate-850 pb-3 mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Notification preferences</h4>
                <p className="text-[10px] text-text-muted mt-0.5">Alert rules configuration.</p>
              </div>

              <div className="space-y-4">
                {/* Email Alert Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <h5 className="text-xs font-semibold text-slate-200">Email reminders</h5>
                    <p className="text-[10px] text-text-secondary leading-normal">
                      Receive weekly summaries on candidate weak areas and diagnostics.
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${
                      emailAlerts ? "bg-brand-primary" : "bg-slate-800"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      emailAlerts ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Push Alert Toggle */}
                <div className="flex items-center justify-between border-t border-slate-850 pt-4">
                  <div className="space-y-0.5 pr-2">
                    <h5 className="text-xs font-semibold text-slate-200">Browser alerts</h5>
                    <p className="text-[10px] text-text-secondary leading-normal">
                      Display desktop notices when study day plans are due or mock interviews are ready.
                    </p>
                  </div>
                  <button
                    onClick={() => setPushAlerts(!pushAlerts)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${
                      pushAlerts ? "bg-brand-primary" : "bg-slate-800"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      pushAlerts ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* 4. PASSWORDS SECURITY FORMS */}
          {activeTab === "security" && (
            <Card className="p-6 bg-background-card/45 border-slate-800/80">
              <div className="border-b border-slate-850 pb-3 mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Security Parameters</h4>
                <p className="text-[10px] text-text-muted mt-0.5">Update credentials or key tokens.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-background-accent border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-text-muted outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-background-accent border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-text-muted outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="primary" size="sm" className="flex items-center gap-1.5">
                    <Lock className="h-4 w-4" /> Save Passwords
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* 5. ABOUT PLATFORM COMPONENT */}
          {activeTab === "about" && (
            <Card className="p-6 bg-background-card/45 border-slate-800/80 space-y-4">
              <div className="border-b border-slate-850 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Platform Specifications</h4>
                <p className="text-[10px] text-text-muted mt-0.5">Technical configuration and build values.</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-900/60">
                  <span className="text-text-secondary">App Version</span>
                  <span className="font-mono text-slate-200 font-bold">v0.1.0-beta</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900/60">
                  <span className="text-text-secondary">AI Engines</span>
                  <span className="font-mono text-slate-200 font-bold">LangGraph Multi-Agent Orchestrator</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-secondary">License Type</span>
                  <span className="font-mono text-indigo-400 font-bold">SaaS Professional License</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-xl flex gap-3 text-[11px] leading-relaxed">
                <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Academic Sandbox</h5>
                  <p className="text-text-secondary mt-1">
                    This platform uses safe sandbox databases. No direct financial variables are charged during student prep access trials.
                  </p>
                </div>
              </div>
            </Card>
          )}

        </div>

      </div>
    </div>
  );
};

export default Settings;
