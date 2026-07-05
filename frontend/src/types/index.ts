// Common application data types

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  major?: string;
  year?: string;
}

export interface StudyProgress {
  subject: string;
  percentage: number;
  color: string;
  lastStudied: string;
}

export interface UpcomingExam {
  id: string;
  subject: string;
  date: string;
  time: string;
  type: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  type: "pdf" | "link" | "text";
  size?: string;
  uploadedAt: string;
}

export interface RecentActivity {
  id: string;
  title: string;
  timestamp: string;
  type: "success" | "info" | "warning";
}
