import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Lock, Mail, AlertTriangle, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { APP_NAME } from "@/constants";

export const Login: React.FC = () => {
  const { login, isAuthenticated, error: authError, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  const from = location.state?.from?.pathname || "/";
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
    return () => clearError();
  }, [isAuthenticated, navigate, from, clearError]);

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Pre-fill email if Remember Me was selected previously
  useEffect(() => {
    const savedEmail = localStorage.getItem("remember_email");
    if (savedEmail) {
      setValue("email", savedEmail);
      setValue("rememberMe", true);
    }
  }, [setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setSubmitError(null);
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate(from, { replace: true });
    } catch (err: any) {
      setSubmitError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background bg-grid-pattern relative px-4 overflow-x-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <div className="w-full max-w-md z-10 relative">
        {/* Branding Logo */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-purple text-white shadow-glow">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
          <p className="text-xs text-text-secondary mt-1">AI-powered student mentoring & placement</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-glass border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-background-card/60 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold">Sign In</CardTitle>
            <CardDescription>Access your study guides and placement analytics</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error notifications */}
            {(submitError || authError) && (
              <div className="mb-4.5 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 flex items-start gap-2.5 text-xs">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="leading-normal">{submitError || authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="email"
                    placeholder="name@university.edu"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address format",
                      },
                    })}
                    className={`w-full rounded-xl border ${
                      errors.email ? "border-red-500/50" : "border-slate-200 dark:border-slate-800/80"
                    } bg-slate-50 dark:bg-background/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all placeholder:text-slate-400 dark:placeholder:text-text-muted`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-red-400 font-medium pl-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-[10px] text-brand-primary hover:underline font-semibold"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password", {
                      required: "Password is required",
                    })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-background/50 py-2.5 pl-10 pr-10 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all placeholder:text-slate-400 dark:placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] text-red-400 font-medium pl-1">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me checkbox */}
              <div className="flex items-center justify-between py-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary select-none">
                  <input
                    type="checkbox"
                    {...register("rememberMe")}
                    className="rounded border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-background/50 text-brand-primary focus:ring-1 focus:ring-brand-primary h-4 w-4 cursor-pointer"
                  />
                  <span>Remember Email</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button type="submit" variant="primary" className="w-full py-3" isLoading={loading}>
                Sign In to Account
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Navigation redirection */}
        <p className="text-center text-xs text-text-secondary mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-primary font-bold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Login;
