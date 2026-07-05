import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, FileText, Trash2, Eye, Download, Search, AlertCircle, CheckCircle2, Loader2, FolderOpen, RefreshCw } from "lucide-react";
import { api } from "@/services";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

interface DocumentMetadata {
  id: string;
  original_name: string;
  file_size: number;
  upload_status: string;
  index_status: string;
  index_error?: string;
  total_chunks?: number;
  created_at: string;
  mime_type: string;
}

export const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Upload States
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents list on mount
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/knowledge/documents");
      setDocuments(response.data.documents || []);
    } catch (err: any) {
      showNotification("error", err.response?.data?.detail || "Failed to load files.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileSelection(e.target.files[0]);
    }
  };

  const processFileSelection = async (file: File) => {
    // 1. Validation checks (PDF only)
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showNotification("error", "Only PDF files are supported.");
      return;
    }

    // 2. Size limit checks (Max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showNotification("error", "File exceeds maximum allowed size of 25MB.");
      return;
    }

    // 3. Initiate upload via multipart form
    const formData = new FormData();
    formData.append("file", file);

    setUploadProgress(0);
    try {
      await api.post("/knowledge/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        },
      });

      showNotification("success", `File '${file.name}' uploaded successfully.`);
      fetchDocuments();
    } catch (err: any) {
      showNotification("error", err.response?.data?.detail || "Failed to upload file.");
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Action Handlers
  const handleView = async (doc: DocumentMetadata) => {
    try {
      // Authenticated stream view via temp blob window
      const response = await api.get(`/knowledge/download/${doc.id}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      window.open(blobUrl, "_blank");
    } catch (err) {
      showNotification("error", "Failed to open document preview.");
    }
  };

  const handleDownload = async (doc: DocumentMetadata) => {
    try {
      const response = await api.get(`/knowledge/download/${doc.id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showNotification("error", "Failed to download document.");
    }
  };

  const handleReindex = async (docId: string) => {
    try {
      await api.post(`/knowledge/reindex/${docId}`);
      showNotification("success", "Background indexing scheduled.");
      fetchDocuments();
    } catch (err: any) {
      showNotification("error", err.response?.data?.detail || "Failed to schedule indexing.");
    }
  };

  const getIndexStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case "indexing":
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded text-[10px] font-bold text-yellow-400 select-none animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> Indexing
          </span>
        );
      case "indexed":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded text-[10px] font-bold text-brand-secondary select-none">
            Indexed
          </span>
        );
      case "failed":
        return (
          <span
            className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded text-[10px] font-bold text-red-400 select-none cursor-help"
            title={error || "Indexing failed. Hover or check logs."}
          >
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded text-[10px] font-bold text-blue-400 select-none">
            Uploaded
          </span>
        );
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document? This action is permanent.")) return;
    try {
      await api.delete(`/knowledge/document/${docId}`);
      showNotification("success", "Document deleted successfully.");
      fetchDocuments();
    } catch (err: any) {
      showNotification("error", err.response?.data?.detail || "Deletion failed.");
    }
  };

  // Helpers
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (isoStr: string): string => {
    return new Date(isoStr).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Knowledge Base"
        description="Compile your course PDFs to build the primary training context for your AI Agent."
      >
        <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()}>
          <UploadCloud className="h-4 w-4" /> Upload Document
        </Button>
      </PageHeader>

      {/* Floating Notifications Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm z-50 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : "bg-red-500/10 border-red-500/25 text-red-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Grid: Upload & Listing */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Drag & Drop Zone */}
        <div className="lg:col-span-1 space-y-4">
          <Card
            className={`border-dashed border-2 p-8 transition-colors ${
              isDragging ? "border-brand-primary bg-brand-primary/5" : "border-slate-800 bg-background-card/40"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent className="flex flex-col items-center justify-center text-center p-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              
              <div className="p-4 bg-background-accent/40 rounded-full border border-slate-700/30 text-brand-primary mb-4 select-none">
                <UploadCloud className="h-10 w-10 animate-bounce" />
              </div>
              
              <h3 className="text-sm font-semibold text-slate-200 mb-1 select-none">
                Drag & Drop PDF here
              </h3>
              <p className="text-xs text-text-muted mb-4 select-none">
                Maximum file size allowed is 25MB
              </p>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
              >
                Choose Local PDF
              </Button>

              {/* Upload Progress Bar */}
              {uploadProgress !== null && (
                <div className="w-full mt-6 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-brand-primary">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading PDF...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-background-accent rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-brand-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Files Data Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtering Header Card */}
          <Card className="p-4 flex gap-4 items-center bg-background-card/40 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search uploads by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-background py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDocuments}
              className="flex items-center gap-1.5 whitespace-nowrap"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Status
            </Button>
          </Card>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <Loader2 className="h-10 w-10 text-brand-primary animate-spin mb-3" />
              <p className="text-xs text-text-secondary">Loading your documents index...</p>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="space-y-3.5">
              {filteredDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  hoverable
                  className="flex items-center justify-between p-4 bg-background-card/30"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-brand-primary shrink-0 select-none">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate leading-snug">
                        {doc.original_name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-text-muted mt-1 select-none flex-wrap">
                        {getIndexStatusBadge(doc.index_status, doc.index_error)}
                        <span>{formatBytes(doc.file_size)}</span>
                        {doc.total_chunks !== undefined && doc.total_chunks !== null && (
                          <span>{doc.total_chunks} chunks</span>
                        )}
                        <span>Uploaded {formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleReindex(doc.id)}
                      className="p-2 rounded-lg text-text-secondary hover:text-slate-100 hover:bg-slate-800/40 transition-colors"
                      title="Re-index Document"
                      disabled={doc.index_status === "indexing"}
                    >
                      <RefreshCw className={`h-4.5 w-4.5 ${doc.index_status === "indexing" ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleView(doc)}
                      className="p-2 rounded-lg text-text-secondary hover:text-slate-100 hover:bg-slate-800/40 transition-colors"
                      title="View PDF"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 rounded-lg text-text-secondary hover:text-slate-100 hover:bg-slate-800/40 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete PDF"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty State Panel */
            <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-800/80 rounded-2xl bg-background-card/10 select-none">
              <FolderOpen className="h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-base font-semibold text-slate-300">No PDF documents uploaded</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm leading-relaxed">
                Drag a syllabus sheet or university study guide on the left drag area to populate your Knowledge Base.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default KnowledgeBase;
