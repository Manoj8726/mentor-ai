import React from "react";
import { cn } from "@/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
  fullPage = false,
}) => {
  const sizes = {
    sm: "h-6 w-6 border-2",
    md: "h-10 w-10 border-3",
    lg: "h-16 w-16 border-4",
    xl: "h-24 w-24 border-4",
  };

  const spinner = (
    <div
      className={cn(
        "animate-spin rounded-full border-t-brand-primary border-r-transparent border-b-transparent border-l-brand-primary/20",
        sizes[size],
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-sm font-medium text-text-secondary animate-pulse">
            Loading MentorAI...
          </p>
        </div>
      </div>
    );
  }

  return spinner;
};
