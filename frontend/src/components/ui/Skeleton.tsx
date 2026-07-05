import React from "react";
import { cn } from "@/utils";

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn("animate-pulse rounded bg-slate-800/60 dark:bg-slate-800/40", className)}
      {...props}
    />
  );
};

export default Skeleton;
