// Central application constants

export const APP_NAME = "MentorAI";

export const NAVIGATION_ITEMS = [
  { name: "Dashboard", path: "/", icon: "LayoutDashboard" },
  { name: "AI Assistant", path: "/assistant", icon: "Bot" },
  { name: "AI Tutor", path: "/tutor", icon: "GraduationCap" },
  { name: "Study Planner", path: "/planner", icon: "Calendar" },
  { name: "Knowledge Base", path: "/knowledge", icon: "FolderOpen" },
  { name: "Knowledge Search", path: "/search", icon: "Search" },
  { name: "Placement Prep", path: "/placement", icon: "Briefcase" },
  { name: "Progress Analytics", path: "/progress", icon: "BarChart3" },
  { name: "Profile", path: "/profile", icon: "User" },
  { name: "Settings", path: "/settings", icon: "Settings" },
] as const;
