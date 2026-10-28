import Select from "../ui/Select";
import React, { useRef, useState } from "react";
import {
  FiUpload,
  FiSearch,
  FiLink,
  FiCheckCircle,
  FiInfo,
  FiAlertCircle,
  FiFileText,
  FiX,
} from "react-icons/fi";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { usePaperImport } from "../../hooks/usePaperImport";
import { useProjectMember } from "../../hooks/useProjectMember";
import { MAX_PDF_BATCH_FILES } from "../../services/paperImportService";
import type { PdfBatchProgress } from "../../services/paperImportService";
import { toastWarning } from "../../utils/toast";
import type { CrossrefQueryParameters } from "../../types/paper";

interface PaperImportModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  sourceOptions?: { label: string; value: string }[];
}

type ImportMode = "ris" | "bibtex" | "pdf" | "doi" | "crossref";

interface SelectedPdf {
  file: File;
  error?: string;
  progress?: number;
  progressStatus?: PdfBatchProgress["status"];
}

const pdfKey = (file: File) => `${file.name}::${file.size}::${file.lastModified}`;

export default function PaperImportModal({
  projectId,
  isOpen,
  onClose,
  sourceOptions = [],
}: PaperImportModalProps) {
  const [mode, setMode] = useState<ImportMode>("ris");
  const { member } = useProjectMember(projectId);
  const canImportPapers = member?.isLeader === true;

  const {
    importRis,
    isImportingRis,
    importBibTex,
    isImportingBibTex,
    importPdfs,
    isImportingPdfs,
    importByDoi,
    isImportingByDoi,
    importFromCrossref,
    isImportingFromCrossref,
  } = usePaperImport(projectId);

  // RIS State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // BibTeX State
  const [bibFile, setBibFile] = useState<File | null>(null);
  const [bibSourceId, setBibSourceId] = useState<string>("");
  const [isDraggingBib, setIsDraggingBib] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<SelectedPdf[]>([]);
  const [pdfSourceId, setPdfSourceId] = useState<string>("");
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  // Hidden file inputs: the whole drop zone opens the file browser, not just the "browse" link.
  const risInputRef = useRef<HTMLInputElement>(null);
  const bibInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // DOI State
  const [doi, setDoi] = useState("");
  const [doiSourceId, setDoiSourceId] = useState<string>("");

  // Crossref State
  const [crossrefQuery, setCrossrefQuery] = useState<CrossrefQueryParameters>({
    query: "",
    queryAuthor: "",
    queryTitle: "",
    rows: 20,
  });
  const [crossrefSourceId, setCrossrefSourceId] = useState<string>("");

  const isImporting =
    isImportingRis ||
    isImportingBibTex ||
    isImportingPdfs ||
    isImportingByDoi ||
    isImportingFromCrossref;

  const isSubmitDisabled =
    mode === "ris"
      ? !selectedFile || isImportingRis
      : mode === "bibtex"
        ? !bibFile || isImportingBibTex
        : mode === "pdf"
          ? pdfFiles.length === 0 || isImportingPdfs
          : mode === "doi"
            ? !doi.trim() || isImportingByDoi
            : (!crossrefQuery.query?.trim() &&
                !crossrefQuery.queryAuthor?.trim() &&
                !crossrefQuery.queryTitle?.trim()) ||
              isImportingFromCrossref;

  const submitLabel =
    mode === "ris"
      ? isImportingRis
        ? "Importing..."
        : "Import RIS File"
      : mode === "bibtex"
        ? isImportingBibTex
          ? "Importing..."
          : "Import BibTeX File"
        : mode === "pdf"
          ? isImportingPdfs
            ? "Importing..."
            : pdfFiles.length > 1
              ? `Import ${pdfFiles.length} PDFs`
              : "Import PDF"
          : mode === "doi"
            ? isImportingByDoi
              ? "Importing..."
              : "Import by DOI"
            : isImportingFromCrossref
              ? "Importing..."
              : "Search & Import";

  const handleClose = () => {
    if (isImporting) return;
    onClose();
    // Reset state if needed or keep it
  };

  const zoneKeyDown = (e: React.KeyboardEvent, input: { current: HTMLInputElement | null }) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.current?.click();
    }
  };

  const addPdfFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const rejected: string[] = [];
    const next = [...pdfFiles];
    const keys = new Set(next.map((item) => pdfKey(item.file)));

    for (const file of Array.from(incoming)) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        rejected.push(`${file.name}: not a PDF file`);
      } else if (file.size === 0) {
        rejected.push(`${file.name}: file is empty`);
      } else if (keys.has(pdfKey(file))) {
        rejected.push(`${file.name}: already selected`);
      } else if (next.length >= MAX_PDF_BATCH_FILES) {
        rejected.push(`${file.name}: limit of ${MAX_PDF_BATCH_FILES} files reached`);
      } else {
        keys.add(pdfKey(file));
        next.push({ file });
      }
    }

    setPdfFiles(next);
    if (rejected.length > 0) {
      toastWarning(`${rejected.length} file(s) were not added`, rejected.join("\n"));
    }
  };

  const removePdfFile = (index: number) => {
    setPdfFiles((current) => current.filter((_, i) => i !== index));
  };

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pdfFiles.length === 0) return;
    try {
      const response = await importPdfs({
        files: pdfFiles.map((item) => item.file),
        projectId,
        searchSourceId: pdfSourceId || undefined,
      }, (progress) => {
        setPdfFiles((current) => current.map((item, index) => index === progress.index
          ? {
              ...item,
              progress: progress.percent,
              progressStatus: progress.status,
              error: progress.error,
            }
          : item));
      });
      const items = response.data?.items ?? [];
      // Keep only failed files (with their reason) so the user can review or retry them.
      const remaining = pdfFiles
        .map((item, index) => ({
          ...item,
          error: items[index]?.status === "FAILED" ? items[index].error || "Import failed" : undefined,
        }))
        .filter((_, index) => items[index]?.status !== "IMPORTED");
      setPdfFiles(remaining);
      if (remaining.length === 0) onClose();
    } catch {
      // Error handled by hook toast
    }
  };

  const handleRisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    try {
      await importRis({
        file: selectedFile,
        projectId,
        searchSourceId: selectedSourceId || undefined,
      });
      setSelectedFile(null);
      onClose();
    } catch {
      // Error handled by hook toast
    }
  };

  const handleBibSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bibFile) return;
    try {
      await importBibTex({
        file: bibFile,
        projectId,
        searchSourceId: bibSourceId || undefined,
      });
      setBibFile(null);
      onClose();
    } catch {
      // Error handled by hook toast
    }
  };

  const handleDoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doi.trim()) return;
    try {
      await importByDoi({
        doi: doi.trim(),
        projectId,
        searchSourceId: doiSourceId || undefined,
      });
      setDoi("");
      onClose();
    } catch {
      // Error handled by hook toast
    }
  };

  const handleCrossrefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !crossrefQuery.query?.trim() &&
      !crossrefQuery.queryAuthor?.trim() &&
      !crossrefQuery.queryTitle?.trim()
    )
      return;
    try {
      await importFromCrossref({
        query: crossrefQuery,
        projectId,
        searchSourceId: crossrefSourceId || undefined,
      });
      setCrossrefQuery({
        query: "",
        queryAuthor: "",
        queryTitle: "",
        rows: 20,
      });
      onClose();
    } catch {
      // Error handled by hook toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Papers to Repository"
      size="xl"
      className="max-h-[calc(100vh-1rem)]"
      bodyClassName="min-h-0 overflow-y-auto overscroll-contain"
      footer={canImportPapers ? (
        <>
          <Button variant="secondary" onClick={handleClose} type="button" className="rounded-xl px-8">Cancel</Button>
          <Button type="submit" form={`paper-${mode}-import-form`} disabled={isSubmitDisabled} className="rounded-xl px-5 sm:px-8">
            {submitLabel}
          </Button>
        </>
      ) : undefined}
    >
      {!canImportPapers ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <FiAlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">
            Permission Restricted
          </h3>
          <p className="text-sm text-text-secondary mt-2 max-w-xs">
            Only project leaders can perform bulk paper imports and manage the
            project repository.
          </p>
          <Button
            variant="secondary"
            onClick={onClose}
            className="mt-8 rounded-xl px-8"
          >
            Close
          </Button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-col gap-4">
          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-bg-secondary p-1 sm:flex sm:gap-2">
            {[
              { id: "ris", label: "RIS File", icon: FiUpload },
              { id: "bibtex", label: "BibTeX", icon: FiUpload },
              { id: "pdf", label: "PDF File", icon: FiUpload },
              { id: "doi", label: "DOI Lookup", icon: FiLink },
              { id: "crossref", label: "API Search", icon: FiSearch },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as ImportMode)}
                type="button"
                aria-label={item.label}
                aria-pressed={mode === item.id}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-bold leading-tight transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary sm:min-h-11 sm:flex-1 sm:flex-row sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm ${
                  mode === item.id
                    ? "bg-surface-white text-accent shadow-sm"
                    : "text-text-secondary hover:bg-bg-primary hover:text-text-primary"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="sm:hidden">
                  {item.id === "bibtex" ? "BibTeX" : item.id.toUpperCase()}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {mode === "pdf" && (
            <form id="paper-pdf-import-form" onSubmit={handlePdfSubmit} className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:animate-none">
              <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary-light p-3">
                <FiInfo className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm font-medium text-primary">
                  Upload up to {MAX_PDF_BATCH_FILES} PDF papers at once. Metadata is extracted automatically when GROBID is available.
                </p>
              </div>
              <div
                className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  isImportingPdfs ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                } ${
                  isDraggingPdf
                    ? "border-accent bg-primary-light"
                    : "border-border bg-bg-secondary/50 hover:border-primary/30 hover:bg-bg-secondary"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
                onDragLeave={() => setIsDraggingPdf(false)}
                role="button"
                tabIndex={0}
                aria-label="Select PDF files"
                onClick={() => {
                  if (!isImportingPdfs) pdfInputRef.current?.click();
                }}
                onKeyDown={(e) => zoneKeyDown(e, pdfInputRef)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingPdf(false);
                  if (!isImportingPdfs) addPdfFiles(e.dataTransfer.files);
                }}
              >
                <FiUpload className="w-9 h-9 text-text-secondary mx-auto mb-2" />
                <h3 className="text-base font-semibold text-text-primary">Drop your PDF files</h3>
                <p className="text-sm text-text-secondary">
                  Drag and drop or <span className="text-accent hover:underline">browse your computer</span>
                </p>
                <input
                  ref={pdfInputRef}
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  disabled={isImportingPdfs}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    addPdfFiles(e.target.files);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <p className="text-xs text-text-secondary mt-1">
                  {pdfFiles.length}/{MAX_PDF_BATCH_FILES} files selected
                </p>
              </div>
              {pdfFiles.length > 0 && (
                <div className="rounded-xl border border-border">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <span className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Selected files</span>
                    <button
                      type="button"
                      onClick={() => setPdfFiles([])}
                      disabled={isImportingPdfs}
                      className="inline-flex min-h-11 items-center rounded-md px-3 text-xs font-semibold text-error transition-colors motion-reduce:transition-none hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-50"
                    >
                      Clear all
                    </button>
                  </div>
                  <ul className="max-h-48 overflow-y-auto divide-y divide-border">
                    {pdfFiles.map((item, index) => (
                      <li key={pdfKey(item.file)} className="flex items-center gap-3 px-4 py-2">
                        {item.error ? (
                          <FiAlertCircle className="h-5 w-5 shrink-0 text-error" />
                        ) : (
                          <FiFileText className="h-5 w-5 shrink-0 text-text-muted" />
                        )}
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-bold text-text-primary">{item.file.name}</p>
                          <p className={`text-xs ${item.error ? "text-error" : item.progressStatus === "IMPORTED" ? "text-success" : "text-text-secondary"}`}>
                            {item.error ?? (item.progressStatus === "SIGNING" ? "Preparing secure upload…"
                              : item.progressStatus === "UPLOADING" ? `Uploading to Cloudinary… ${item.progress ?? 0}%`
                              : item.progressStatus === "FINALIZING" ? "Registering paper and queueing GROBID…"
                              : item.progressStatus === "IMPORTED" ? "Imported · GROBID is processing in background"
                              : `${(item.file.size / 1024).toFixed(2)} KB`)}
                          </p>
                          {isImportingPdfs && item.progressStatus === "UPLOADING" && (
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-secondary" role="progressbar" aria-valuenow={item.progress ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={`Upload progress for ${item.file.name}`}>
                              <div className="h-full rounded-full bg-accent transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${item.progress ?? 0}%` }} />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePdfFile(index)}
                          disabled={isImportingPdfs}
                          aria-label={`Remove ${item.file.name}`}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors motion-reduce:transition-none hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-50"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-2 ml-1">
                  Associate with Search Source (Optional)
                </label>
                <Select value={pdfSourceId} onChange={(e) => setPdfSourceId(e.target.value)} className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none">
                  <option value="">Unspecified source</option>
                  {sourceOptions.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}
                </Select>
              </div>
            </form>
          )}

          {/* RIS Import Content */}
          {mode === "ris" && (
            <form
              id="paper-ris-import-form"
              onSubmit={handleRisSubmit}
              className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 motion-reduce:animate-none"
            >
              <div className="bg-primary-light border border-accent/20 rounded-xl p-4 flex gap-3">
                <FiInfo className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <p className="text-sm text-accent font-medium leading-relaxed">
                  Upload a RIS file exported from databases like Scopus, Web of
                  Science, or PubMed. Max file size 10MB.
                </p>
              </div>

              <div
                className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  isDragging
                    ? "border-accent bg-primary-light"
                    : "border-border bg-bg-secondary/50 hover:border-primary/30 hover:bg-bg-secondary"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                role="button"
                tabIndex={0}
                aria-label="Select RIS file"
                onClick={() => risInputRef.current?.click()}
                onKeyDown={(e) => zoneKeyDown(e, risInputRef)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = e.dataTransfer.files;
                  if (files.length > 0) setSelectedFile(files[0]);
                }}
              >
                <input
                  ref={risInputRef}
                  type="file"
                  accept=".ris"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-success/10 text-success">
                      <FiCheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-text-primary">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-text-secondary font-bold">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-error transition-colors motion-reduce:transition-none hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface-white">
                      <FiUpload className="w-8 h-8 text-text-secondary" />
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-text-primary">
                      Drop your RIS file
                    </h3>
                    <p className="text-text-secondary font-medium mb-3">
                      Drag and drop or{" "}
                      <span className="text-accent hover:underline">browse your computer</span>
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="px-3 py-1 bg-surface-white border border-border rounded-xl text-[10px] font-black text-text-secondary uppercase tracking-widest">
                        .RIS
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                  Associate with Search Source (Optional)
                </label>
                <Select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                >
                  <option value="">Unspecified source</option>
                  {sourceOptions.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </Select>
              </div>

            </form>
          )}

          {/* BibTeX Import Content */}
          {mode === "bibtex" && (
            <form
              id="paper-bibtex-import-form"
              onSubmit={handleBibSubmit}
              className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 motion-reduce:animate-none"
            >
              <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary-light p-4">
                <FiInfo className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm font-medium leading-relaxed text-primary">
                  Upload a BibTeX (.bib) file. This format is widely used with
                  LaTeX and reference managers like Mendeley or Zotero. Max file
                  size 10MB.
                </p>
              </div>

              <div
                className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  isDraggingBib
                    ? "border-accent bg-primary-light"
                    : "border-border bg-bg-secondary/50 hover:border-primary/30 hover:bg-bg-secondary"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingBib(true);
                }}
                onDragLeave={() => setIsDraggingBib(false)}
                role="button"
                tabIndex={0}
                aria-label="Select BibTeX file"
                onClick={() => bibInputRef.current?.click()}
                onKeyDown={(e) => zoneKeyDown(e, bibInputRef)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingBib(false);
                  const files = e.dataTransfer.files;
                  if (files.length > 0) setBibFile(files[0]);
                }}
              >
                <input
                  ref={bibInputRef}
                  type="file"
                  accept=".bib"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setBibFile(file);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                {bibFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-success/10 text-success">
                      <FiCheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-text-primary">
                        {bibFile.name}
                      </p>
                      <p className="text-sm text-text-secondary font-bold">
                        {(bibFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBibFile(null);
                      }}
                      className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-error transition-colors motion-reduce:transition-none hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface-white">
                      <FiUpload className="w-8 h-8 text-text-secondary" />
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-text-primary">
                      Drop your BibTeX file
                    </h3>
                    <p className="text-text-secondary font-medium mb-3">
                      Drag and drop or{" "}
                      <span className="text-accent hover:underline">browse your computer</span>
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="px-3 py-1 bg-surface-white border border-border rounded-xl text-[10px] font-black text-text-secondary uppercase tracking-widest">
                        .BIB
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                  Associate with Search Source (Optional)
                </label>
                <Select
                  value={bibSourceId}
                  onChange={(e) => setBibSourceId(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                >
                  <option value="">Unspecified source</option>
                  {sourceOptions.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </Select>
              </div>

            </form>
          )}

          {/* DOI Import Content */}
          {mode === "doi" && (
            <form
              id="paper-doi-import-form"
              onSubmit={handleDoiSubmit}
              className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 motion-reduce:animate-none"
            >
              <div className="bg-bg-secondary border border-accent/20 rounded-xl p-4 flex gap-3">
                <FiInfo className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <p className="text-sm text-accent font-medium leading-relaxed">
                  Enter a Digital Object Identifier (DOI) to automatically fetch
                  metadata from Crossref and import the paper.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                    DOI String <span className="text-error">*</span>
                  </label>
                  <div className="relative group">
                    <FiLink className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-accent motion-reduce:transition-none" />
                    <input
                      type="text"
                      value={doi}
                      onChange={(e) => setDoi(e.target.value)}
                      placeholder="e.g. 10.1145/3313831.3376227"
                      className="min-h-11 w-full rounded-xl border border-border bg-surface-white py-2.5 pl-14 pr-5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                    Associate with Search Source (Optional)
                  </label>
                  <Select
                    value={doiSourceId}
                    onChange={(e) => setDoiSourceId(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                  >
                    <option value="">Unspecified source</option>
                    {sourceOptions.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

            </form>
          )}

          {/* API Search Content */}
          {mode === "crossref" && (
            <form
              id="paper-crossref-import-form"
              onSubmit={handleCrossrefSubmit}
              className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 motion-reduce:animate-none"
            >
              <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary-light p-4">
                <FiInfo className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed text-primary">
                  Query the Crossref API directly to search for papers. All
                  matching results (up to the limit) will be imported.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                    General Query
                  </label>
                  <div className="relative group">
                    <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-accent motion-reduce:transition-none" />
                    <input
                      type="text"
                      value={crossrefQuery.query}
                      onChange={(e) =>
                        setCrossrefQuery({
                          ...crossrefQuery,
                          query: e.target.value,
                        })
                      }
                      placeholder="e.g. Systematic Review and AI"
                      className="min-h-11 w-full rounded-xl border border-border bg-surface-white py-2.5 pl-14 pr-5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={crossrefQuery.queryAuthor}
                    onChange={(e) =>
                      setCrossrefQuery({
                        ...crossrefQuery,
                        queryAuthor: e.target.value,
                      })
                    }
                    placeholder="e.g. Kitchenham"
                    className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                    Title Keywords
                  </label>
                  <input
                    type="text"
                    value={crossrefQuery.queryTitle}
                    onChange={(e) =>
                      setCrossrefQuery({
                        ...crossrefQuery,
                        queryTitle: e.target.value,
                      })
                    }
                    placeholder="e.g. Software Engineering"
                    className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                    Max Results
                  </label>
                  <input
                    type="number"
                    value={crossrefQuery.rows}
                    onChange={(e) =>
                      setCrossrefQuery({
                        ...crossrefQuery,
                        rows: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="1000"
                    className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                    Target Search Source
                  </label>
                  <Select
                    value={crossrefSourceId}
                    onChange={(e) => setCrossrefSourceId(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                  >
                    <option value="">Unspecified source</option>
                    {sourceOptions.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
