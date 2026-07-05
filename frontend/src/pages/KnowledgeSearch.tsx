import React, { useState } from "react";
import { Search, FileText, Sparkles, MessageSquare, Loader2 } from "lucide-react";
import { api } from "@/services";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

interface SearchResult {
  chunk_id: string;
  text: string;
  score: number;
  document_id: string;
  file_name: string;
  page: number;
  chunk_number: number;
}

export const KnowledgeSearch: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const response = await api.post("/rag/search", {
        question: query,
        top_k: 5,
      });
      setResults(response.data.results || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to retrieve search results.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to highlight terms or format search match displays
  const getScoreColorClass = (score: number) => {
    if (score >= 0.8) return "bg-emerald-500/10 border-emerald-500/20 text-brand-secondary";
    if (score >= 0.6) return "bg-yellow-500/10 border-yellow-500/20 text-amber-600 dark:text-yellow-400";
    return "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/30 text-slate-600 dark:text-text-secondary";
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Knowledge Search"
        description="Query matching segments, topics, or course contents directly from your uploaded study materials."
      />

      {/* Query input card */}
      <Card className="bg-white dark:bg-background-card/40 border-slate-200 dark:border-slate-800/80 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <input
              type="text"
              placeholder='e.g., "What is polymorphism?", "Explain database normalization"...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-background/50 py-3.5 pl-12 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all placeholder:text-slate-400 dark:placeholder:text-text-muted"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !query.trim()}
              className="px-6 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Querying Database...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Run Semantic Search
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Search results display area */}
      <div className="space-y-4">
        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="h-10 w-10 text-brand-primary animate-spin mb-3" />
            <p className="text-xs text-text-secondary">Searching matching vector databases...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-text-secondary">
                Top {results.length} Most Relevant Chunks Match
              </span>
            </div>

            <div className="space-y-4">
              {results.map((result) => (
                <Card
                  key={result.chunk_id}
                  className="bg-white dark:bg-background-card/20 border-slate-250 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-700/50 transition-all p-5 relative overflow-hidden"
                >
                  {/* Decorative glowing gradient border */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-primary to-brand-purple" />
                  
                  <div className="space-y-3">
                    {/* Header info row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <FileText className="h-4 w-4 text-brand-primary" />
                        <span className="font-semibold text-slate-800 dark:text-slate-300 max-w-[200px] truncate">
                          {result.file_name}
                        </span>
                        <span className="text-text-muted">•</span>
                        <span className="text-slate-500 dark:text-text-muted bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded">
                          Page {result.page}
                        </span>
                      </div>
                      
                      {/* Similarity Score Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getScoreColorClass(result.score)}`}>
                        {(result.score * 100).toFixed(1)}% Match
                      </span>
                    </div>

                    {/* Text extract */}
                    <blockquote className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-1.5 italic whitespace-pre-wrap">
                      {result.text}
                    </blockquote>

                    {/* Footer index row */}
                    <div className="flex justify-between items-center text-[10px] text-text-muted pt-1">
                      <span>Chunk ID: {result.chunk_id}</span>
                      <span>Chunk {result.chunk_number}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          hasSearched && (
            <div className="flex flex-col items-center justify-center text-center p-16 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-background-card/5">
              <MessageSquare className="h-10 w-10 text-text-muted mb-3" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-300">No matching text segments found</h4>
              <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed">
                Try searching with different keywords or verify your PDFs are successfully indexed in the Knowledge Base.
              </p>
            </div>
          )
        )}

        {!hasSearched && (
          <div className="flex flex-col items-center justify-center text-center p-16 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-background-card/10">
            <Search className="h-10 w-10 text-text-muted mb-3" />
            <h4 className="text-sm font-semibold text-slate-850 dark:text-slate-300">Run a semantic query</h4>
            <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed">
              Enter a question above to retrieve context segments and matching paragraphs from your document database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default KnowledgeSearch;
