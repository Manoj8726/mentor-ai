import React from "react";
import * as Icons from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

// Mock static database placeholders
const studyProgressData = [
  { subject: "Data Structures & Algorithms", percentage: 78, color: "bg-brand-primary", lastStudied: "2 hours ago" },
  { subject: "Database Management Systems", percentage: 55, color: "bg-brand-purple", lastStudied: "Yesterday" },
  { subject: "Computer Networks", percentage: 90, color: "bg-brand-secondary", lastStudied: "3 days ago" },
  { subject: "Operating Systems", percentage: 35, color: "bg-orange-500", lastStudied: "1 week ago" },
];

const upcomingExamsData = [
  { id: "1", subject: "DSA Mid-term Exam", date: "July 12, 2026", time: "10:00 AM", type: "Theory + Coding" },
  { id: "2", subject: "DBMS Lab Assessment", date: "July 15, 2026", time: "02:00 PM", type: "SQL Query Practicum" },
  { id: "3", subject: "System Design Quiz", date: "July 20, 2026", time: "09:00 AM", type: "Multiple Choice" },
];

const knowledgeBaseData = [
  { id: "1", title: "DSA_Cheatsheet_Core.pdf", type: "pdf", size: "1.2 MB", date: "June 28, 2026" },
  { id: "2", title: "SQL_Optimizations_Guide.docx", type: "link", size: "340 KB", date: "July 01, 2026" },
  { id: "3", title: "React_19_New_Features.pdf", type: "pdf", size: "2.4 MB", date: "Today" },
];

const recentActivityData = [
  { id: "1", title: "Uploaded 'SQL_Optimizations_Guide.docx'", timestamp: "2 hours ago", icon: "FilePlus", type: "success" },
  { id: "2", title: "Completed 'DBMS Module 3' quiz", timestamp: "5 hours ago", icon: "CheckCircle2", type: "success" },
  { id: "3", title: "Generated new study guide for Operating Systems", timestamp: "1 day ago", icon: "BookOpen", type: "info" },
  { id: "4", title: "Profile settings updated", timestamp: "2 days ago", icon: "User", type: "warning" },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Welcome back, John!"
        description="Here is what is happening with your studies and placement preparations today."
      >
        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
          <Icons.Download className="h-4 w-4" /> Download Report
        </Button>
        <Button variant="primary" size="sm">
          <Icons.Plus className="h-4 w-4" /> Create Task
        </Button>
      </PageHeader>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Study Hours", value: "32.5h", desc: "+4.2h this week", icon: "Clock", color: "text-brand-primary" },
          { title: "Resume Score", value: "85/100", desc: "Top 15% of class", icon: "FileText", color: "text-brand-secondary" },
          { title: "Syllabus Finished", value: "64.5%", desc: "+5% from yesterday", icon: "GraduationCap", color: "text-brand-purple" },
          { title: "Mock Tests", value: "12 Passed", desc: "Avg score 88%", icon: "Trophy", color: "text-brand-accent" }
        ].map((stat, i) => {
          const IconComponent = Icons[stat.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
          return (
            <Card key={i} hoverable className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-secondary">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.desc}</p>
              </div>
              <div className={`p-3 rounded-xl bg-background-accent/60 border border-slate-700/30 ${stat.color}`}>
                <IconComponent className="h-6 w-6" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Progress & Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Study Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Study Progress</CardTitle>
              <CardDescription>Visual breakdown of course syllabus completion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {studyProgressData.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">{item.subject}</span>
                    <span className="font-semibold text-brand-primary">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-background-accent h-2.5 rounded-full overflow-hidden border border-slate-800/80">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                  </div>
                  <p className="text-xs text-text-muted">Last studied {item.lastStudied}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Placement Prep Card */}
          <Card glow>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Placement Preparation</CardTitle>
                <CardDescription>AI recommendations and status tracker.</CardDescription>
              </div>
              <Icons.Sparkles className="h-5 w-5 text-brand-accent animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-800/80 bg-background-card/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mt-0.5">
                    <Icons.FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">Resume Optimizer</h4>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      Your resume has been analyzed! Score is 85. Click optimize to raise it.
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="md:shrink-0">Optimize Resume</Button>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-background-card/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple mt-0.5">
                    <Icons.Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">AI Mock Interview</h4>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      Recommended: Try a 15-minute behavioral mock session based on your profile.
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="primary" className="md:shrink-0">Start Session</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Exams, KB & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2.5">
              {[
                { name: "Chat Tutor", icon: "MessageSquareCode", color: "bg-brand-primary/10 text-brand-primary border-brand-primary/20" },
                { name: "Upload PDF", icon: "UploadCloud", color: "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20" },
                { name: "Study Plan", icon: "Calendar", color: "bg-brand-purple/10 text-brand-purple border-brand-purple/20" },
                { name: "Mock Test", icon: "Award", color: "bg-brand-accent/10 text-brand-accent border-brand-accent/20" }
              ].map((act, i) => {
                const IconComp = Icons[act.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                return (
                  <button
                    key={i}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${act.color}`}
                  >
                    <IconComp className="h-5 w-5 mb-2" />
                    <span className="text-xs font-semibold">{act.name}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Upcoming Exams */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Exams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingExamsData.map((exam) => (
                <div key={exam.id} className="flex items-start justify-between p-3 rounded-xl border border-slate-800/80 bg-background-card/20 hover:bg-slate-800/20 transition-colors">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-brand-secondary">{exam.type}</p>
                    <p className="text-sm font-bold text-slate-100">{exam.subject}</p>
                    <p className="text-xs text-text-muted">{exam.time} • {exam.date}</p>
                  </div>
                  <Icons.CalendarRange className="h-4.5 w-4.5 text-text-secondary shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>Recently uploaded study materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {knowledgeBaseData.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-background-card/20 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icons.FileText className="h-4.5 w-4.5 text-brand-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{doc.title}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{doc.size} • {doc.date}</p>
                    </div>
                  </div>
                  <Icons.Eye className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivityData.map((act) => {
                const ActIcon = Icons[act.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                const colors = {
                  success: "text-brand-secondary bg-brand-secondary/10",
                  info: "text-brand-primary bg-brand-primary/10",
                  warning: "text-orange-500 bg-orange-500/10",
                };
                return (
                  <div key={act.id} className="flex gap-3 text-sm">
                    <div className={`p-2 rounded-lg shrink-0 h-8 w-8 flex items-center justify-center ${colors[act.type as keyof typeof colors]}`}>
                      <ActIcon className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-slate-200 font-medium leading-tight">{act.title}</p>
                      <p className="text-xs text-text-muted">{act.timestamp}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
