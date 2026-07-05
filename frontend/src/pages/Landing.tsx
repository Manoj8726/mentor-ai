import React from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  GraduationCap,
  Calendar,
  Briefcase,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Cpu
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { APP_NAME } from "@/constants";

export const Landing: React.FC = () => {
  const features = [
    {
      title: "AI Academic Tutor",
      description: "Ask technical concept definitions and complete interactive learning quizzes aggregated from your syllabus notes.",
      icon: GraduationCap,
      color: "text-indigo-400 bg-indigo-500/10"
    },
    {
      title: "Study Schedule Planner",
      description: "Construct sequential learning timelines custom-fit to daily hours budgets and target exam time constraints.",
      icon: Calendar,
      color: "text-emerald-400 bg-emerald-500/10"
    },
    {
      title: "Interview & Resume Advisor",
      description: "Scan uploaded resumes to calculate ATS match percentages, identify skill gaps, and practice mock questions.",
      icon: Briefcase,
      color: "text-purple-400 bg-purple-500/10"
    },
    {
      title: "Progress Analytics Officer",
      description: "Analyze study consistency trends and diagnostic gaps to predict technical placement job readiness.",
      icon: BarChart3,
      color: "text-orange-400 bg-orange-500/10"
    }
  ];

  const steps = [
    { num: "01", name: "Index Knowledge Docs", desc: "Upload syllabus guides, coding files, or textbooks in the Knowledge Base." },
    { num: "02", name: "Orchestrate Goals", desc: "Consult the Supervisor Agent to detect intent, split subtasks, and direct sub-agents." },
    { num: "03", name: "Improve Readiness", desc: "Resolve weak concepts, complete daily timelines, and elevate your ATS scores." }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden relative">
      
      {/* Background Decorative Radial Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 select-none">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-purple flex items-center justify-center text-white">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-wider">{APP_NAME}</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-text-secondary">
            <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
            <a href="#agents" className="hover:text-slate-100 transition-colors">Agents</a>
            <a href="#how-it-works" className="hover:text-slate-100 transition-colors">Process</a>
            <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors">
              Log In
            </Link>
            <Link to="/register" className="px-4 py-2 text-xs font-semibold bg-brand-primary hover:bg-brand-primary/95 text-white rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center relative select-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/25 rounded-full text-indigo-400 text-[10px] font-bold tracking-wider uppercase mb-6">
          <Sparkles className="h-3.5 w-3.5" /> Next-Gen AI Study Companion
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-4xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Accelerate Your Placement Prep with Multi-Agent Intelligence
        </h1>
        
        <p className="text-sm md:text-base text-text-secondary max-w-2xl leading-relaxed mt-6">
          MentorAI coordinates specialized autonomous agents to review syllabus documents, outline timelines, scan resume ATS skills, and track learning consistency in real time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link to="/register" className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-glow transition-all">
            Get Started Free <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          <a href="#features" className="px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800/40 text-slate-300 hover:text-white font-semibold rounded-xl text-sm transition-all">
            Discover Features
          </a>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-900 select-none">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-primary">Core Ecosystem</h2>
          <h3 className="text-2xl md:text-3xl font-bold mt-2">Unified Personalization Matrix</h3>
          <p className="text-xs text-text-muted leading-relaxed mt-3">
            Each AI agent shares a unified personalization context memory layer to output contextual, company-focused insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} className="p-6 bg-slate-900/30 border-slate-800/60 hover:border-slate-700/80 transition-all flex flex-col justify-between h-full">
                <div>
                  <div className={`p-3 rounded-lg w-fit ${feat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-slate-200 mt-5 text-sm">{feat.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed mt-2.5">{feat.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. AI AGENTS DETAILS */}
      <section id="agents" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-900 select-none">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[9px] font-bold tracking-wider uppercase">
              <Cpu className="h-3.5 w-3.5" /> Collaborative Orchestrations
            </div>
            <h3 className="text-3xl font-black tracking-tight leading-tight">
              One Supervisor. Four Independent Specialists.
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Type complex prompts like *\"Teach me SQL Joins and review my resume for Google\"*. The Supervisor Agent detects category targets, plans execution subtasks, dispatches agents concurrently, and compiles unified Markdown reports.
            </p>
            <ul className="space-y-3 pt-2">
              {[
                "Concurrent Multi-Agent execution",
                "Unified RAG source referencing system",
                "Shared short-term & long-term memory logs",
                "Real-time stepping agent thought processes tracking"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle className="h-4.5 w-4.5 text-brand-primary" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative">
            <div className="absolute top-4 left-4 h-3.5 w-3.5 rounded-full bg-red-500/80" />
            <div className="absolute top-4 left-9 h-3.5 w-3.5 rounded-full bg-yellow-500/80" />
            <div className="absolute top-4 left-14 h-3.5 w-3.5 rounded-full bg-green-500/80" />
            
            <div className="mt-8 space-y-4">
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
                <span className="text-[10px] text-brand-primary font-mono block">/supervisor/chat [payload]</span>
                <span className="text-xs text-slate-200 mt-1 block">\"Teach me Java interfaces & check my resume target\"</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2">
                <span className="text-[10px] text-indigo-400 font-bold block">✓ Dispatching Nodes</span>
                <div className="flex gap-2">
                  <span className="text-[9px] bg-slate-950 border border-slate-850 text-slate-300 px-2 py-0.5 rounded">Tutor: Explanation</span>
                  <span className="text-[9px] bg-slate-950 border border-slate-850 text-slate-300 px-2 py-0.5 rounded">Interview: Resume scan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-900 select-none">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-primary">Workflow</h2>
          <h3 className="text-2xl md:text-3xl font-bold mt-2">How It Works</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative p-6 bg-slate-900/20 border border-slate-850 rounded-xl space-y-4">
              <span className="text-4xl font-extrabold text-indigo-500/10 block">{step.num}</span>
              <h4 className="font-semibold text-slate-200 text-sm">{step.name}</h4>
              <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRICING SECTION PLACEHOLDER */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-900 select-none">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-primary">Pricing Plans</h2>
          <h3 className="text-2xl md:text-3xl font-bold mt-2">Simple SaaS Tiers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto gap-6">
          {/* Tier 1 */}
          <Card className="p-8 bg-slate-900/40 border-slate-800/80 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-200 text-sm">Student Plan</h4>
              <div className="flex items-baseline gap-1 text-slate-100">
                <span className="text-3xl font-black">$0</span>
                <span className="text-xs text-text-muted">/month</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Perfect for individual practice and resume evaluations.
              </p>
              <ul className="space-y-2 pt-2 text-[11px] text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-primary" /> Core AI tutor access</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-primary" /> Study planner schedules</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-brand-primary" /> 5 knowledge uploads</li>
              </ul>
            </div>
            <Link to="/register" className="mt-8 w-full py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800/40 text-slate-200 text-xs font-semibold rounded-lg text-center block transition-all">
              Start Free Trial
            </Link>
          </Card>

          {/* Tier 2 */}
          <Card glow className="p-8 bg-slate-900/45 border-slate-800 flex flex-col justify-between relative">
            <span className="absolute -top-3 right-6 bg-indigo-500 text-white text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">POPULAR</span>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-200 text-sm">Professional Plan</h4>
              <div className="flex items-baseline gap-1 text-slate-100">
                <span className="text-3xl font-black">$19</span>
                <span className="text-xs text-text-muted">/month</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                For candidates targeting top-tier technical roles.
              </p>
              <ul className="space-y-2 pt-2 text-[11px] text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-indigo-400" /> All student tier configurations</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-indigo-400" /> Unlimited knowledge base uploads</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-indigo-400" /> Real-time supervisor workflows</li>
              </ul>
            </div>
            <Link to="/register" className="mt-8 w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg text-center block shadow-glow transition-all">
              Upgrade Now
            </Link>
          </Card>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="bg-gradient-to-t from-indigo-950/20 to-slate-950/30 border-t border-slate-900 select-none">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
          <h3 className="text-3xl md:text-4xl font-extrabold text-slate-100">
            Ready to Ace Your Technical Interviews?
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed max-w-xl mx-auto">
            Sign up to build personalized study curriculums, evaluate resume matches, and test readiness indicators.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold rounded-xl text-sm transition-colors mt-4">
            Create Free Account <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/40 select-none">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between text-xs text-text-muted gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold tracking-wider text-slate-300">{APP_NAME}</span>
          </div>
          <span>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
