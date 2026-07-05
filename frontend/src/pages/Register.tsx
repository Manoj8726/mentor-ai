import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, User, Eye, EyeOff, AlertTriangle, GraduationCap, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { APP_NAME } from "@/constants";

export const Register: React.FC = () => {
  const { register: registerUser, isAuthenticated, error: authError, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
    return () => clearError();
  }, [isAuthenticated, navigate, clearError]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: any) => {
    setLoading(true);
    setSubmitError(null);
    setSuccessMsg(null);
    try {
      await registerUser(data.fullName, data.email, data.password);
      setSuccessMsg("Account created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || "Registration failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background bg-grid-pattern relative px-4 overflow-x-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <div className="w-full max-w-md z-10 relative py-8">
        {/* Branding Logo */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-purple text-white shadow-glow">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
          <p className="text-xs text-text-secondary mt-1">Create an account to begin your learning sprint</p>
        </div>

        {/* Registration Card */}
        <Card className="shadow-glass border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-background-card/60 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold">Sign Up</CardTitle>
            <CardDescription>Join MentorAI for intelligent placement tutoring</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Success Notification */}
            {successMsg && (
              <div className="mb-4.5 p-3 rounded-xl border border-brand-secondary/20 bg-brand-secondary/10 text-brand-secondary flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="leading-normal">{successMsg}</span>
              </div>
            )}

            {/* Error notifications */}
            {(submitError || authError) && (
              <div className="mb-4.5 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 flex items-start gap-2.5 text-xs">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="leading-normal">{submitError || authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    {...register("fullName", {
                      required: "Full name is required",
                      minLength: { value: 2, message: "Name must be at least 2 characters" },
                    })}
                    className={`w-full rounded-xl border ${
                      errors.fullName ? "border-red-500/50" : "border-slate-200 dark:border-slate-800/80"
                    } bg-slate-55 dark:bg-background/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all placeholder:text-slate-405 dark:placeholder:text-text-muted`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[10px] text-red-400 font-medium pl-1">{errors.fullName.message}</p>
                )}
              </div>

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
                    } bg-slate-55 dark:bg-background/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all placeholder:text-slate-405 dark:placeholder:text-text-muted`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-red-400 font-medium pl-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                      validate: {
                        hasUpper: (v) => /[A-Z]/.test(v) || "Must contain at least one uppercase letter",
                        hasLower: (v) => /[a-z]/.test(v) || "Must contain at least one lowercase letter",
                        hasDigit: (v) => /[0-9]/.test(v) || "Must contain at least one number",
                      },
                    })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-55 dark:bg-background/50 py-2.5 pl-10 pr-10 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all placeholder:text-slate-405 dark:placeholder:text-text-muted"
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

              {/* Confirm Password field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === passwordValue || "Passwords do not match",
                    })}
                    className="w-full rounded-xl border border-slate-800/80 bg-background/50 py-2.5 pl-10 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-slate-200 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[10px] text-red-400 font-medium pl-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" variant="primary" className="w-full py-3" isLoading={loading}>
                Register Account
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Navigation redirection */}
        <p className="text-center text-xs text-text-secondary mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-primary font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Register;
