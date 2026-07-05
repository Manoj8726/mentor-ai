import React from "react";
import { Menu, Bell, Search, GraduationCap, LogOut, Sun, Moon, User, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Dropdown } from "@/components/ui/Dropdown";
import { Link } from "react-router-dom";
import { APP_NAME } from "@/constants";

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-background/80 px-6 backdrop-blur-md">
      {/* Left side: Hamburger on mobile, Search on desktop */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-text-secondary hover:bg-slate-150 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white md:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Small branding icon for mobile view */}
        <div className="flex items-center gap-2 md:hidden select-none">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-primary to-brand-purple text-white shadow-glow">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-md font-bold tracking-wider text-slate-800 dark:text-slate-200">
            {APP_NAME}
          </span>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex items-center w-full max-w-sm relative">
          <Search className="absolute left-3.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search learning resources, tasks, tests..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-background-card/50 py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all duration-200"
          />
        </div>
      </div>

      {/* Right side: Notifications, Theme Switcher, Profile */}
      <div className="flex items-center gap-4 select-none">
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/50 transition-colors"
          title="Toggle Theme Mode"
        >
          {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
        </button>

        {/* Notification Bell */}
        <button className="relative rounded-xl p-2.5 text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800/50 transition-colors">
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
          <Bell className="h-4 w-4" />
        </button>

        {/* User Profile Dropdown Menu */}
        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800/80 pl-4">
          <Dropdown
            trigger={
              <div className="flex items-center gap-2 hover:opacity-85 transition-opacity">
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-brand-primary font-bold text-xs shrink-0 select-none">
                  {user?.full_name ? getInitials(user.full_name) : "U"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{user?.full_name || "User"}</span>
                  <span className="text-[10px] text-text-muted capitalize">{user?.role || "Student"}</span>
                </div>
              </div>
            }
          >
            <div className="space-y-1 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-white rounded-lg mx-1.5 transition-colors"
              >
                <User className="h-4 w-4" /> Personal Profile
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-white rounded-lg mx-1.5 transition-colors"
              >
                <Settings className="h-4 w-4" /> Settings Panel
              </Link>
              <div className="border-t border-slate-200 dark:border-slate-850 my-1" />
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 w-[calc(100%-12px)] px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg mx-1.5 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </Dropdown>
        </div>

      </div>
    </header>
  );
};
