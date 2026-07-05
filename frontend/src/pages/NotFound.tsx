import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full mb-6 animate-pulse">
        <AlertCircle className="h-12 w-12" />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-100 mb-2">404</h1>
      <h2 className="text-xl md:text-2xl font-bold text-slate-300 mb-4">Page Not Found</h2>
      <p className="text-sm md:text-base text-text-secondary max-w-md mb-8 leading-relaxed">
        The resource you are looking for has been moved, renamed, or is currently in development.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
};
