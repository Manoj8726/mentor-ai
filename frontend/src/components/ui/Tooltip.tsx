import React, { useState } from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-950 border border-slate-250 dark:border-slate-800/80 text-slate-100 dark:text-slate-200 text-[10px] font-bold rounded shadow-xl whitespace-nowrap z-50 pointer-events-none"
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
