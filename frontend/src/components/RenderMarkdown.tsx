import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface RenderMarkdownProps {
  text: string;
}

export const RenderMarkdown: React.FC<RenderMarkdownProps> = ({ text }) => {
  if (!text) return null;

  // Split into block paragraphs
  const paragraphs = text.split("\n\n");

  const parseInline = (str: string) => {
    // Parse bold text and code snippets
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-slate-100 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="bg-slate-900 border border-slate-800 text-indigo-400 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono text-[11px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const CodeBlock: React.FC<{ content: string; language?: string }> = ({ content, language }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="my-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden font-mono text-xs select-none">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-200/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-text-muted">
          <span className="text-[10px] uppercase font-bold tracking-wider">{language || "Code"}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-[10px]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy Code
              </>
            )}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-slate-800 dark:text-slate-200 select-text leading-relaxed">
          <code>{content}</code>
        </pre>
      </div>
    );
  };

  const parseTable = (lines: string[]) => {
    // Basic table parser
    const rows = lines.map(line =>
      line
        .split("|")
        .map(cell => cell.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
    );

    const headers = rows[0];
    const dataRows = rows.slice(2); // Skip header and separator row

    return (
      <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent">
        <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-slate-300">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/20">
            {dataRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-3 whitespace-pre-wrap leading-relaxed">
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-slate-700 dark:text-slate-300 select-text leading-relaxed">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split("\n");

        // 1. Code blocks check
        if (para.startsWith("```") && para.endsWith("```")) {
          const match = para.match(/^```(\w+)?\n([\s\S]*?)\n```$/);
          const lang = match ? match[1] : "Code";
          const code = match ? match[2] : para.slice(3, -3);
          return <CodeBlock key={pIdx} content={code} language={lang} />;
        }

        // 2. Tables check
        if (lines.length >= 3 && lines[0].startsWith("|") && lines[1].includes("-")) {
          return <React.Fragment key={pIdx}>{parseTable(lines)}</React.Fragment>;
        }

        // 3. Headers check
        if (para.startsWith("### ")) {
          return (
            <h4
              key={pIdx}
              className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mt-5 select-none"
            >
              {parseInline(para.substring(4))}
            </h4>
          );
        }
        if (para.startsWith("## ")) {
          return (
            <h3
              key={pIdx}
              className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-6 select-none"
            >
              {parseInline(para.substring(3))}
            </h3>
          );
        }
        if (para.startsWith("# ")) {
          return (
            <h2
              key={pIdx}
              className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-8 select-none border-b border-slate-200 dark:border-slate-800 pb-2"
            >
              {parseInline(para.substring(2))}
            </h2>
          );
        }

        // 4. Bullet lists check
        if (lines.every(line => line.trim().startsWith("- ") || line.trim().startsWith("* "))) {
          return (
            <ul key={pIdx} className="list-disc pl-5 space-y-1.5 select-text">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="text-slate-700 dark:text-slate-300 text-xs">
                  {parseInline(line.trim().substring(2))}
                </li>
              ))}
            </ul>
          );
        }

        // 5. Ordered lists check
        if (lines.every(line => /^\d+\.\s/.test(line.trim()))) {
          return (
            <ol key={pIdx} className="list-decimal pl-5 space-y-1.5 select-text">
              {lines.map((line, lIdx) => {
                const match = line.trim().match(/^(\d+)\.\s(.*)$/);
                const textVal = match ? match[2] : line.trim();
                return (
                  <li key={lIdx} className="text-slate-700 dark:text-slate-300 text-xs">
                    {parseInline(textVal)}
                  </li>
                );
              })}
            </ol>
          );
        }

        // 6. Paragraph fallback
        return (
          <p key={pIdx} className="text-xs text-slate-750 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {parseInline(para)}
          </p>
        );
      })}
    </div>
  );
};

export default RenderMarkdown;
