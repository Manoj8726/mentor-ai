import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/ui/Sidebar";
import { Navbar } from "@/components/ui/Navbar";
import { FloatingAssistant } from "@/components/FloatingAssistant";

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background bg-grid-pattern relative">
      {/* Decorative top-right radial gradient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      {/* Decorative bottom-left radial gradient glow */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Sidebar - Desktop static, Mobile absolute overlay */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        className="shrink-0 z-40"
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden z-10 relative">
        {/* Navbar */}
        <Navbar onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />

        {/* Dynamic Page Router Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Floating AI Assistant coordinator drawer */}
      <FloatingAssistant />
    </div>
  );
};
