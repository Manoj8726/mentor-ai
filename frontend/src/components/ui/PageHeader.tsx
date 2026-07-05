import React from "react";
import { cn } from "@/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode; // Optional action buttons
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80 mb-6",
        className
      )}
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
          {title}
        </h1>
        {description && (
          <p className="text-sm md:text-base text-slate-600 dark:text-text-secondary mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};
