import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  History,
  Building,
  Award,
  BookOpen,
  Briefcase,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { api } from "@/services";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";


interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: string;
}

interface EvaluatedQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  student_answer: string;
  score: number;
  feedback: string;
}

interface ATSAnalysis {
  ats_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  formatting_suggestions: string[];
  keyword_suggestions: string[];
  project_suggestions: string[];
}

interface CompanyPrep {
  company: string;
  role: string;
  important_topics: string[];
  likely_interview_areas: string[];
  learning_roadmap: string[];
  recommended_study_materials: Array<{
    document_id: string;
    file_name: string;
    page: number;
    score: number;
  }>;
  preparation_checklist: string[];
}

interface InterviewSession {
  id: string;
  company: string;
  role: string;
  overall_score: number;
  created_at: string;
}

interface FeedbackReport {
  session_id: string;
  overall_score: number;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  questions: EvaluatedQuestion[];
}

const SUPPORTED_ROLES = [
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "Java Developer",
  "Python Developer",
  "Data Analyst",
  "Software Engineer"
];

export const Placement: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"ats" | "prep" | "mock" | "history">("ats");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Resume states
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [targetRole, setTargetRole] = useState(SUPPORTED_ROLES[0]);
  const [isATSLoading, setIsATSLoading] = useState(false);
  const [atsReport, setAtsReport] = useState<ATSAnalysis | null>(null);

  // Company prep states
  const [companyName, setCompanyName] = useState("");
  const [prepRole, setPrepRole] = useState(SUPPORTED_ROLES[0]);
  const [isPrepLoading, setIsPrepLoading] = useState(false);
  const [prepReport, setPrepReport] = useState<CompanyPrep | null>(null);

  // Mock interview states
  const [mockRole, setMockRole] = useState(SUPPORTED_ROLES[0]);
  const [mockCompany, setMockCompany] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mockQuestions, setMockQuestions] = useState<Question[]>([]);
  const [isMockLoading, setIsMockLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);
  const [interviewReport, setInterviewReport] = useState<FeedbackReport | null>(null);

  // History states
  const [historyList, setHistoryList] = useState<InterviewSession[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await api.get("/interview/history");
      setHistoryList(response.data || []);
    } catch (err) {
      showNotification("error", "Failed to retrieve history logs.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadReportDetails = async (sessId: string) => {
    setIsHistoryLoading(true);
    try {
      const response = await api.get(`/interview/report/${sessId}`);
      setInterviewReport(response.data);
      setActiveTab("mock"); // Switch to Mock/Feedback view to show details
    } catch (err) {
      showNotification("error", "Failed to load report scorecard.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx" && ext !== "doc") {
      showNotification("error", "Unsupported format. PDF or DOCX only.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/interview/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResumeId(response.data.id);
      setFileName(file.name);
      setAtsReport(null); // Clear previous reports
      showNotification("success", "Resume uploaded and parsed successfully!");
    } catch (err) {
      showNotification("error", "Resume parsing failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleATSAnalysis = async () => {
    if (!resumeId) {
      showNotification("error", "Please upload a resume first.");
      return;
    }

    setIsATSLoading(true);
    try {
      const response = await api.post("/interview/analyze", {
        resume_id: resumeId,
        target_role: targetRole
      });
      setAtsReport(response.data);
      showNotification("success", "ATS Gap Analysis compiled!");
    } catch (err) {
      showNotification("error", "ATS compilation failed.");
    } finally {
      setIsATSLoading(false);
    }
  };

  const handleCompanyPrep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showNotification("error", "Please enter a target company name.");
      return;
    }

    setIsPrepLoading(true);
    try {
      const response = await api.post("/interview/company-preparation", {
        company_name: companyName,
        role: prepRole
      });
      setPrepReport(response.data);
      showNotification("success", "Company preparation roadmap generated!");
    } catch (err) {
      showNotification("error", "Failed to generate roadmap.");
    } finally {
      setIsPrepLoading(false);
    }
  };

  const handleStartMock = async () => {
    setIsMockLoading(true);
    setSessionId(null);
    setMockQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setInterviewReport(null);

    try {
      const response = await api.post("/interview/mock", {
        role: mockRole,
        company: mockCompany.trim() || "Generic"
      });
      setSessionId(response.data.session_id);
      setMockQuestions(response.data.questions || []);
      showNotification("success", "Mock interview questions generated!");
    } catch (err) {
      showNotification("error", "Failed to start mock session.");
    } finally {
      setIsMockLoading(false);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!sessionId || mockQuestions.length === 0) return;

    // Check if all questions have answers
    const unanswered = mockQuestions.some((q) => !answers[q.id]?.trim());
    if (unanswered) {
      if (!confirm("Some questions are unanswered. Submit anyway?")) return;
    }

    setIsSubmittingAnswers(true);
    const submissions = mockQuestions.map((q) => ({
      question_id: q.id,
      student_answer: answers[q.id] || "No answer submitted."
    }));

    try {
      const response = await api.post("/interview/mock/submit", {
        session_id: sessionId,
        answers: submissions
      });
      setInterviewReport(response.data);
      showNotification("success", "Mock evaluation completed!");
    } catch (err) {
      showNotification("error", "Evaluation scoring failed.");
    } finally {
      setIsSubmittingAnswers(false);
    }
  };

  const resetMockSession = () => {
    setSessionId(null);
    setMockQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setInterviewReport(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Placement Preparation"
        description="Verify resumes against job descriptions, practice company roadmap interviews, and review scores."
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

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-background-card/20 rounded-xl overflow-hidden p-1 flex-wrap gap-1">
        {[
          { id: "ats", label: "Resume & ATS", icon: FileText },
          { id: "prep", label: "Company Preparation", icon: Building },
          { id: "mock", label: "Mock Interview", icon: Sparkles },
          { id: "history", label: "Session History", icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all select-none ${
                isSelected
                  ? "bg-brand-primary text-white"
                  : "text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800/40"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Pane outlet */}
      <div className="space-y-6">
        
        {/* ======================================================== */}
        {/* 1. RESUME & ATS VIEW */}
        {/* ======================================================== */}
        {activeTab === "ats" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload form card */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="p-5 bg-white dark:bg-background-card/45 border-slate-200 dark:border-slate-800/80 space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-1 select-none">
                    Upload Resume
                  </h3>
                  <p className="text-[10px] text-text-muted select-none">
                    Upload your profile PDF or DOCX file
                  </p>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-250 dark:border-slate-800 hover:border-brand-primary/50 transition-all rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 dark:bg-background/25 select-none"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleResumeUpload}
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                  />
                  <UploadCloud className={`h-10 w-10 text-brand-primary mb-3 ${isUploading ? "animate-bounce" : ""}`} />
                  {isUploading ? (
                    <span className="text-xs font-semibold text-brand-primary">Parsing text structure...</span>
                  ) : fileName ? (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[170px]">{fileName}</span>
                      <span className="text-[10px] text-brand-secondary">Click to upload another</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Choose PDF or DOCX</span>
                      <span className="text-[10px] text-text-muted">Maximum file size 25MB</span>
                    </div>
                  )}
                </div>

                {resumeId && (
                  <div className="space-y-4 border-t border-slate-200 dark:border-slate-800/60 pt-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-705 dark:text-slate-300">Target Role</label>
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-55 dark:bg-background py-2 px-3 text-xs text-slate-707 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                      >
                        {SUPPORTED_ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    <Button
                      onClick={handleATSAnalysis}
                      disabled={isATSLoading}
                      variant="primary"
                      className="w-full text-xs py-2.5 h-10 flex items-center justify-center gap-1.5"
                    >
                      {isATSLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Compiling ATS...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Analyze ATS Gap
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Results scorecard card */}
            <div className="lg:col-span-2 space-y-4">
              {!atsReport ? (
                <div className="flex flex-col items-center justify-center text-center p-20 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-background-card/10 select-none">
                  <FileText className="h-12 w-12 text-text-muted mb-4" />
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">No active ATS evaluation</h3>
                  <p className="text-xs text-text-muted mt-1 max-w-sm leading-relaxed">
                    Upload your candidate resume in the form, choose your target role, and trigger the ATS Analysis to review gaps.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Gauge indicator column */}
                  <div className="md:col-span-1 space-y-4">
                    <Card className="p-5 bg-white dark:bg-background-card/45 border-slate-200 dark:border-slate-800/80 space-y-5">
                      <div className="text-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 select-none">ATS Alignment</h4>
                      </div>

                      {/* circular progress gauge */}
                      <div className="flex justify-center select-none py-1">
                        <div className="relative flex items-center justify-center text-slate-200/20 dark:text-slate-100/10">
                          <svg className="w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="38" strokeWidth="5" stroke="currentColor" fill="transparent" />
                            <circle cx="48" cy="48" r="38" strokeWidth="5" stroke="#10b981" fill="transparent"
                              strokeDasharray={238.6}
                              strokeDashoffset={238.6 - (238.6 * (atsReport.ats_score / 100))}
                              className="transition-all duration-500 ease-out"
                            />
                          </svg>
                          <span className="absolute text-xl font-bold text-slate-800 dark:text-slate-100">
                            {atsReport.ats_score}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3.5 border-t border-slate-200 dark:border-slate-800/60 pt-4">
                        <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider select-none">Formatting suggestions</h5>
                        {!atsReport?.formatting_suggestions || atsReport.formatting_suggestions.length === 0 ? (
                          <p className="text-xs text-text-muted italic">No formatting issues detected.</p>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1.5">
                            {atsReport.formatting_suggestions.map((f, idx) => (
                              <li key={idx} className="text-[11px] text-text-secondary leading-relaxed">{f}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Highlights and suggestions lists columns */}
                  <div className="md:col-span-2 space-y-4">
                    <Card className="p-5 bg-white dark:bg-background-card/30 border-slate-200 dark:border-slate-800/60 space-y-4">
                      
                      {/* Gaps / Missing skills comparative block */}
                      <div className="space-y-2 select-none">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-orange-500" /> Missing Competencies
                        </h4>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {!atsReport?.missing_skills || atsReport.missing_skills.length === 0 ? (
                            <span className="text-xs text-brand-secondary bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10 font-medium">All keywords matched!</span>
                          ) : (
                            atsReport.missing_skills.map((skill, idx) => (
                              <span key={idx} className="text-xs text-orange-600 dark:text-orange-400 bg-orange-500/5 px-2.5 py-1 rounded-full border border-orange-500/10 font-medium">
                                {skill}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Strengths & Weaknesses checklists */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800/40">
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 select-none">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Profile Strengths
                          </h5>
                          <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300 text-xs">
                            {atsReport?.strengths?.map((s, idx) => <li key={idx}>{s}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider flex items-center gap-1 select-none">
                            <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" /> Improvement Areas
                          </h5>
                          <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300 text-xs">
                            {atsReport?.weaknesses?.map((w, idx) => <li key={idx}>{w}</li>)}
                          </ul>
                        </div>
                      </div>

                      {/* Keyword & project recommendations */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800/40">
                        <div className="space-y-1.5">
                          <h5 className="text-[10px] font-bold text-indigo-600 dark:text-brand-primary uppercase tracking-wider select-none">Buzzwords to insert</h5>
                          <p className="text-xs text-slate-600 dark:text-text-secondary leading-relaxed">{atsReport?.keyword_suggestions?.join(", ") || "None recommended."}</p>
                        </div>
                        <div className="space-y-1.5 pt-1">
                          <h5 className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider select-none">Recommended builder projects</h5>
                          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                            {atsReport?.project_suggestions?.map((proj: any, idx) => {
                              if (proj && typeof proj === "object") {
                                      return (
                                        <li key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl leading-relaxed space-y-1">
                                          <div className="font-semibold text-slate-800 dark:text-slate-205 text-xs">{proj.title}</div>
                                          <div className="text-[11px] text-text-muted">{proj.description}</div>
                                        </li>
                                      );
                              }
                              return (
                                <li key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 leading-relaxed font-medium">
                                  {proj}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>

                    </Card>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. COMPANY PREPARATION ROADMAP */}
        {/* ======================================================== */}
        {activeTab === "prep" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Input Form columns */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="p-5 bg-white dark:bg-background-card/45 border-slate-200 dark:border-slate-800/80 space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-1 select-none">
                    Target Roadmap Planner
                  </h3>
                  <p className="text-[10px] text-text-muted select-none">
                    Enter the company name to generate roads
                  </p>
                </div>

                <form onSubmit={handleCompanyPrep} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. TCS, Accenture, Google, Capgemini"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-background py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-slate-400 dark:placeholder:text-text-muted"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Role</label>
                    <select
                      value={prepRole}
                      onChange={(e) => setPrepRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-55 dark:bg-background py-2 px-3 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                    >
                      {SUPPORTED_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isPrepLoading}
                    variant="primary"
                    className="w-full text-xs py-2.5 h-10 flex items-center justify-center gap-1.5"
                  >
                    {isPrepLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Compiling Roadmap...
                      </>
                    ) : (
                      <>
                        <Building className="h-4 w-4" /> Generate Company Prep
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Preparation Roadmap columns */}
            <div className="lg:col-span-2 space-y-4">
              {!prepReport ? (
                <div className="flex flex-col items-center justify-center text-center p-20 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-background-card/10 select-none">
                  <Building className="h-12 w-12 text-text-muted mb-4" />
                  <h3 className="text-base font-semibold text-slate-805 dark:text-slate-300">No active company roadmap</h3>
                  <p className="text-xs text-text-muted mt-1 max-w-sm leading-relaxed">
                    Specify the target company and position title inside the form to compile learning sequences and matching RAG document references.
                  </p>
                </div>
              ) : (
                <Card className="p-5 bg-white dark:bg-background-card/30 border-slate-200 dark:border-slate-800/60 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-3 select-none">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-brand-primary" /> Prep Roadmap: {prepReport.company} ({prepReport.role})
                    </h3>
                  </div>

                  {/* Learning Roadmap timeline */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 px-1 uppercase tracking-wider select-none">Roadmap Phases</h4>
                    <div className="space-y-3 relative pl-4 border-l border-slate-200 dark:border-slate-800">
                      {prepReport.learning_roadmap.map((phase, idx) => (
                        <div key={idx} className="relative space-y-1">
                          <div className="absolute -left-6.5 top-1 h-4 w-4 bg-brand-primary border-4 border-white dark:border-slate-900 rounded-full" />
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed pl-2">{phase}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Likely Areas and Checklist grids */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800/40">
                    <div className="space-y-2 select-none">
                      <h5 className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> Focus Domains
                      </h5>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-705 dark:text-slate-300">
                        {prepReport.important_topics.map((t, idx) => <li key={idx}>{t}</li>)}
                      </ul>
                    </div>

                    <div className="space-y-2 select-none">
                      <h5 className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-brand-secondary" /> Final Checklist
                      </h5>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-705 dark:text-slate-300">
                        {prepReport.preparation_checklist.map((c, idx) => <li key={idx}>{c}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* RAG references attachments */}
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800/40">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 px-1 uppercase tracking-wider flex items-center gap-1.5 select-none">
                      <BookOpen className="h-4 w-4 text-brand-primary" /> Recommended Knowledge Base References
                    </h4>
                    {prepReport.recommended_study_materials.length === 0 ? (
                      <p className="text-xs text-text-muted italic pl-1">No matching course guides found. Practice standard question sets.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {prepReport.recommended_study_materials.map((mat, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{mat.file_name}</span>
                            <span className="text-[9px] text-slate-550 dark:text-text-muted bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">Page {mat.page}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </Card>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* 3. MOCK INTERVIEW INTERFACE */}
        {/* ======================================================== */}
        {activeTab === "mock" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Settings panel */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="p-5 bg-white dark:bg-background-card/45 border-slate-200 dark:border-slate-800/80 space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-1 select-none">
                    Start Mock Interview
                  </h3>
                  <p className="text-[10px] text-text-muted select-none">
                    Practice placement answers under LLM grading
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Role</label>
                    <select
                      value={mockRole}
                      disabled={!!sessionId}
                      onChange={(e) => setMockRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-background py-2 px-3 text-xs text-slate-805 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                    >
                      {SUPPORTED_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Company (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Wipro, Accenture"
                      value={mockCompany}
                      disabled={!!sessionId}
                      onChange={(e) => setMockCompany(e.target.value)}
                      className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-background py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-slate-400 dark:placeholder:text-text-muted"
                    />
                  </div>

                  {!sessionId ? (
                    <Button
                      onClick={handleStartMock}
                      disabled={isMockLoading}
                      variant="primary"
                      className="w-full text-xs py-2.5 h-10 flex items-center justify-center gap-1.5"
                    >
                      {isMockLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Compiling Questions...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Start Interview
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={resetMockSession}
                      variant="secondary"
                      className="w-full text-xs py-2.5 h-10"
                    >
                      Restart Session
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Questions prompts window / final reports viewer */}
            <div className="lg:col-span-2 space-y-4">
              {isMockLoading ? (
                <div className="flex flex-col items-center justify-center p-20 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-background-card/10">
                  <Loader2 className="h-10 w-10 text-brand-primary animate-spin mb-3" />
                  <p className="text-xs text-text-secondary">Generating placement questions from resume details...</p>
                </div>
              ) : interviewReport ? (
                // EVALUATION REPORT SUBSECTION
                <Card className="p-5 bg-white dark:bg-background-card/30 border-slate-200 dark:border-slate-800/60 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-3 select-none">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-brand-primary" /> Interview Scorecard: {interviewReport.overall_score.toFixed(1)}/100
                    </h3>
                  </div>

                  {/* Summary checklists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2 select-none">
                      <h5 className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider">Strengths</h5>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{interviewReport.strengths}</p>
                    </div>
                    <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl space-y-2 select-none">
                      <h5 className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Gap Areas</h5>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{interviewReport.weaknesses}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2 select-none">
                    <h5 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Coach Recommendations</h5>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{interviewReport.recommendations}</p>
                  </div>

                  {/* Individual Question feedback scroll */}
                  <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800/40">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 px-1 uppercase tracking-wider select-none">Evaluated Questions Log</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {interviewReport.questions.map((q) => (
                        <div key={q.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-semibold text-indigo-600 dark:text-slate-300 font-mono text-[10px] uppercase text-brand-primary">{q.category} ({q.difficulty})</span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-brand-secondary">Grade: {q.score}/10</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 font-semibold">Q: {q.question}</p>
                          <blockquote className="border-l-2 border-slate-250 dark:border-slate-800 pl-3 py-1 italic text-text-secondary leading-relaxed">
                            Your answer: {q.student_answer}
                          </blockquote>
                          <p className="text-text-muted leading-relaxed"><span className="font-semibold text-slate-600 dark:text-slate-300">Feedback:</span> {q.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ) : sessionId && mockQuestions.length > 0 ? (
                // ACTIVE INTERVIEW IN PROGRESS
                <Card className="p-5 bg-white dark:bg-background-card/30 border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[380px]">
                  
                  {/* Step bar */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-3 mb-4 select-none">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                      Step {currentQuestionIndex + 1} of {mockQuestions.length}
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-text-muted px-2.5 py-0.5 rounded font-mono font-bold uppercase">
                      {mockQuestions[currentQuestionIndex].category}
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <div className="flex-1 space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                      {mockQuestions[currentQuestionIndex].question}
                    </div>

                    {/* Textarea answer input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Your Answer</label>
                      <textarea
                        rows={6}
                        placeholder="Write your explanation or code logic here..."
                        value={answers[mockQuestions[currentQuestionIndex].id] || ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [mockQuestions[currentQuestionIndex].id]: e.target.value
                          }))
                        }
                        className="w-full rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-background py-3 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-slate-400 dark:placeholder:text-text-muted"
                      />
                    </div>
                  </div>

                  {/* Steppers footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800/40 select-none">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    >
                      Previous
                    </Button>

                    {currentQuestionIndex < mockQuestions.length - 1 ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex items-center gap-1.5"
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingAnswers}
                        onClick={handleSubmitAnswers}
                        className="bg-brand-secondary border-transparent text-white hover:bg-brand-secondary/95 shadow-sm"
                      >
                        {isSubmittingAnswers ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Evaluating Answers...
                          </>
                        ) : (
                          <>
                            Submit Answers
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-20 border border-dashed border-slate-250 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-background-card/10 select-none">
                  <HelpCircle className="h-12 w-12 text-text-muted mb-4" />
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">Practice mock sessions</h3>
                  <p className="text-xs text-text-muted mt-1 max-w-sm leading-relaxed">
                    Select a target role and click Start Interview to practice coding, technical architectures, behavioral conflict models, and culture fit scenarios.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* 4. PAST SESSIONS HISTORY VIEW */}
        {/* ======================================================== */}
        {activeTab === "history" && (
          <Card className="p-5 bg-white dark:bg-background-card/30 border-slate-200 dark:border-slate-800/60 overflow-x-auto min-h-[300px]">
            {isHistoryLoading ? (
              <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
              </div>
            ) : historyList.length > 0 ? (
              <table className="w-full text-left border-collapse text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-650 dark:text-text-secondary font-semibold select-none">
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 px-4">Company</th>
                    <th className="pb-3 px-4 text-center">Score</th>
                    <th className="pb-3 px-4">Created Date</th>
                    <th className="pb-3 pl-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {historyList.map((hist) => (
                    <tr key={hist.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 pr-4 font-semibold text-slate-800 dark:text-slate-200">{hist.role}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-text-secondary">{hist.company}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-semibold px-2.5 py-0.5 rounded text-xs border ${
                          hist.overall_score >= 80
                            ? "bg-brand-secondary/10 border-brand-secondary/20 text-brand-secondary"
                            : hist.overall_score >= 60
                            ? "bg-yellow-500/10 border-yellow-500/20 text-amber-600 dark:text-yellow-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          {hist.overall_score.toFixed(1)}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-text-muted">{new Date(hist.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 pl-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadReportDetails(hist.id)}
                          className="h-8 text-xs border border-slate-200 dark:border-slate-800 px-3"
                        >
                          View Report
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12 select-none text-text-muted">
                <History className="h-10 w-10 text-text-muted/40 mb-3" />
                <p className="text-xs">No previous interview attempts. Go to Mock Interview to start.</p>
              </div>
            )}
          </Card>
        )}

      </div>
    </div>
  );
};

export default Placement;
