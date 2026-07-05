import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export const ForgotPassword: React.FC = () => {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background bg-grid-pattern relative px-4 overflow-x-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-md z-10 relative">
        <Card className="shadow-glass border-slate-800/80 bg-background-card/60 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-bold">Reset Password</CardTitle>
            <CardDescription>Recover your MentorAI student credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-center">
            <div className="p-4 rounded-xl border border-slate-800 bg-background/40 text-xs text-text-secondary leading-relaxed">
              <p className="font-semibold text-slate-200 mb-1">Feature coming soon!</p>
              Email recovery flows will be fully configured in later database integration sprints. If you forget your password, you can drop database tables or register a new email.
            </div>

            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-primary font-semibold transition-colors mt-2">
              <ArrowLeft className="h-4.5 w-4.5" /> Back to Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default ForgotPassword;
