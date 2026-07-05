import React from "react";
import { NavLink } from "react-router-dom";
import * as Icons from "lucide-react";
import { NAVIGATION_ITEMS, APP_NAME } from "@/constants";
import { cn } from "@/utils";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, className }) => {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  return (
    <>
      {/* Mobile Overlay Background Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/95 backdrop-blur-md transition-transform duration-300 md:translate-x-0 md:static md:z-0 flex flex-col justify-between",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header Logo */}
          <div className="flex h-16 items-center px-6 gap-2.5 border-b border-slate-200 dark:border-slate-800/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-primary to-brand-purple text-white shadow-glow">
              <Icons.GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-slate-850 to-slate-950 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto select-none">
            {NAVIGATION_ITEMS.map((item) => {
              // Dynamically retrieve the Lucide icon component
              const IconComponent = (Icons[item.icon as keyof typeof Icons] || Icons.HelpCircle) as React.ComponentType<{ className?: string }>;

              const getIconColor = (name: string) => {
                switch (name) {
                  case "AI Tutor": return "text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-300";
                  case "Study Planner": return "text-purple-500 dark:text-purple-400 group-hover:text-purple-300";
                  case "Placement Prep": return "text-cyan-550 dark:text-cyan-400 group-hover:text-cyan-300";
                  case "Progress Analytics": return "text-emerald-550 dark:text-emerald-400 group-hover:text-emerald-300";
                  case "Knowledge Base": return "text-amber-550 dark:text-amber-400 group-hover:text-amber-300";
                  default: return "text-slate-500 dark:text-text-secondary group-hover:text-slate-800 dark:group-hover:text-slate-200";
                }
              };

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                      isActive
                        ? "bg-slate-100 dark:bg-background-accent text-brand-primary border-l-2 border-brand-primary"
                        : "text-slate-600 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-100"
                    )
                  }
                >
                  <IconComponent className={cn("h-5 w-5 shrink-0 transition-colors", getIconColor(item.name))} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info Indicator */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 flex items-center justify-center text-brand-primary font-bold text-sm shrink-0 select-none">
              {user?.full_name ? getInitials(user.full_name) : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.full_name || "User"}</p>
              <p className="text-xs text-slate-400 dark:text-text-muted truncate capitalize">{user?.role || "Student"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
