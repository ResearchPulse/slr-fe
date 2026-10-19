import React, { memo, useMemo, useCallback, useState } from "react";
import {
  FiCopy,
  FiExternalLink,
  FiTag,
  FiDatabase,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { PDF_WORKER_URL } from "../../config/pdfWorker";

// Import styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import type { PaperResponse } from "../../types/paper";
import PaperAbstractSection from "./PaperAbstractSection";
import PaperMetadataGrid from "./PaperMetadataGrid";
import PaperAccessPanel from "./PaperAccessPanel";
import Drawer from "../ui/Drawer";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";

// ============================================
// Props
// ============================================

interface PaperDetailsViewProps {
  paper: PaperResponse | null;
  /** Loading state — shows skeleton when true */
  loading?: boolean;
  /** Display mode: Drawer (default) or inline content */
  mode?: "drawer" | "inline";
  /** Drawer open state (only used when mode="drawer") */
  isOpen?: boolean;
  /** Drawer close handler (only used when mode="drawer") */
  onClose?: () => void;
  /** Optional callback when a PDF is uploaded */
  onUploadPdf?: (
    paperId: string,
    file: File,
    options: Record<string, unknown>,
  ) => Promise<void>;
  /** Optional loading state for PDF upload */
  isUploadingPdf?: boolean;
  /** Custom z-index class for the drawer mode */
  zIndexClassName?: string;
}

// ============================================
// Skeleton Loader
// ============================================

function PaperDetailsSkeleton() {
  return (
    <div className="motion-safe:animate-pulse motion-reduce:animate-none space-y-6">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-3/4 rounded bg-border/60 motion-safe:animate-pulse motion-reduce:animate-none" />
        <div className="h-6 w-1/2 rounded bg-border/60 motion-safe:animate-pulse motion-reduce:animate-none" />
      </div>
      {/* Authors */}
      <div className="h-4 w-2/3 rounded bg-border/60 motion-safe:animate-pulse motion-reduce:animate-none" />
      {/* Badges */}
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-border/60 motion-safe:animate-pulse motion-reduce:animate-none" />
        <div className="h-6 w-20 rounded-full bg-border/60 motion-safe:animate-pulse motion-reduce:animate-none" />
        <div className="h-6 w-14 rounded-full bg-border/60 motion-safe:animate-pulse motion-reduce:animate-none" />
      </div>
      {/* Abstract */}
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-border/40" />
        <div className="h-4 w-full rounded bg-border/60" />
        <div className="h-4 w-full rounded bg-border/60" />
        <div className="h-4 w-5/6 rounded bg-border/60" />
        <div className="h-4 w-4/6 rounded bg-border/60" />
      </div>
      {/* Metadata */}
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-border/40" />
        <div className="h-10 rounded bg-border/60" />
        <div className="h-10 rounded bg-border/60" />
        <div className="h-10 rounded bg-border/60" />
      </div>
      {/* Provenance */}
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-border/40" />
        <div className="h-16 rounded bg-border/60" />
      </div>
    </div>
  );
}

// ============================================
// Keywords Component
// ============================================

const PaperKeywords = memo(({ keywords }: { keywords?: string | null }) => {
  const tags = useMemo(() => {
    if (!keywords) return [];
    return keywords
      .split(/[;,]/)
      .map((k) => k.trim())
      .filter(Boolean);
  }, [keywords]);

  if (tags.length === 0) return null;

  return (
    <section className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        <FiTag className="w-3.5 h-3.5" />
        Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
          >
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
});
PaperKeywords.displayName = "PaperKeywords";

// ============================================
// Header Section
// ============================================

const PaperHeader = memo(({ paper }: { paper: PaperResponse }) => {
  const handleCopyDoi = useCallback(() => {
    if (paper.doi) {
      navigator.clipboard.writeText(paper.doi).then(
        () => toast.success("DOI copied to clipboard"),
        () => toast.error("Failed to copy DOI"),
      );
    }
  }, [paper.doi]);

  return (
    <header className="mb-6 border-b border-border pb-6">
      {/* Title */}
      <h2 className="mb-3 text-lg font-bold leading-snug text-text-primary wrap-break-word">
        {paper.title}
      </h2>
      <span className="text-xs font-bold text-text-secondary">ID: {paper.id}</span>
      {/* Authors */}
      {paper.authors && (
        <p className="mb-4 flex items-start gap-2 text-sm text-text-secondary">
          <FiUser className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
          <span className="wrap-break-word">{paper.authors}</span>
        </p>
      )}

      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {paper.publicationYear && (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
            <FiCalendar className="w-3 h-3" />
            {paper.publicationYear}
          </span>
        )}
        {paper.publicationType && (
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
            {paper.publicationType}
          </span>
        )}
        {paper.source && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-secondary px-2.5 py-1 text-xs font-medium text-text-secondary">
            <FiDatabase className="w-3 h-3" />
            {paper.source}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {paper.doi && (
          <button
            onClick={handleCopyDoi}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-bg-secondary px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
            title={`Copy DOI: ${paper.doi}`}
          >
            <FiCopy className="w-3.5 h-3.5" />
            Copy DOI
          </button>
        )}
        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Open DOI
          </a>
        )}
        {paper.url && !paper.doi && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Open URL
          </a>
        )}
        {paper.url && paper.doi && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Source URL
          </a>
        )}
      </div>
    </header>
  );
});
PaperHeader.displayName = "PaperHeader";

// ============================================
// Main Content (shared between drawer and inline)
// ============================================

const PaperDetailsContent = memo(
  ({
    paper,
    loading,
    onUploadPdf,
    isUploadingPdf,
  }: {
    paper: PaperResponse | null;
    loading?: boolean;
    onUploadPdf?: (
      paperId: string,
      file: File,
      options: Record<string, unknown>,
    ) => Promise<void>;
    isUploadingPdf?: boolean;
  }) => {
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

    if (loading) {
      return <PaperDetailsSkeleton />;
    }

    if (!paper) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <FiDatabase className="mb-3 h-12 w-12 text-text-secondary" />
          <p className="text-sm text-text-secondary">No paper selected</p>
        </div>
      );
    }

    const handlePreviewPdf = (url: string) => {
      setPreviewPdfUrl(url);
    };

    return (
      <div>
        <PaperHeader paper={paper} />
        <PaperAbstractSection abstract={paper.abstract} />
        <PaperMetadataGrid paper={paper} />
        <PaperKeywords keywords={paper.keywords} />
        <PaperAccessPanel
          paper={paper}
          onUploadPdf={onUploadPdf}
          isUploadingPdf={isUploadingPdf}
          onPreviewPdf={handlePreviewPdf}
        />

        {previewPdfUrl && (
          <Modal
            isOpen={!!previewPdfUrl}
            onClose={() => setPreviewPdfUrl(null)}
            title="PDF Preview"
            description={`Viewing full text for: ${paper.title}`}
            size="xl"
          >
            <div className="relative -mx-8 -mb-8 mt-4 h-[75vh] w-[calc(100%+4rem)] overflow-hidden bg-bg-secondary">
              <Worker workerUrl={PDF_WORKER_URL}>
                <Viewer fileUrl={previewPdfUrl} />
              </Worker>
            </div>
          </Modal>
        )}
      </div>
    );
  },
);
PaperDetailsContent.displayName = "PaperDetailsContent";

// ============================================
// Main Export: PaperDetailsView
// ============================================

/**
 * Paper Details View — read-only inspection of a single paper.
 *
 * Supports two modes:
 *   - **drawer** (default): Renders inside a right-side Drawer component
 *   - **inline**: Renders content directly (for embedding in a page layout)
 *
 * @example
 * // Drawer mode
 * <PaperDetailsView
 *   paper={selectedPaper}
 *   loading={loading}
 *   mode="drawer"
 *   isOpen={isDrawerOpen}
 *   onClose={() => setIsDrawerOpen(false)}
 * />
 *
 * @example
 * // Inline mode
 * <PaperDetailsView paper={selectedPaper} mode="inline" />
 */
const PaperDetailsView: React.FC<PaperDetailsViewProps> = ({
  paper,
  loading = false,
  mode = "drawer",
  isOpen = false,
  onClose,
  onUploadPdf,
  isUploadingPdf,
  zIndexClassName,
}) => {
  if (mode === "inline") {
    return (
      <PaperDetailsContent
        paper={paper}
        loading={loading}
        onUploadPdf={onUploadPdf}
        isUploadingPdf={isUploadingPdf}
      />
    );
  }

  // Drawer mode
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      title={
        <div className="flex items-center gap-2">
          <FiDatabase className="h-5 w-5 text-primary" />
          <span className="truncate max-w-md">
            {loading ? "Loading..." : paper?.title || "Paper Details"}
          </span>
        </div>
      }
      maxWidth="max-w-2xl"
      side="right"
      className={zIndexClassName}
    >
      <PaperDetailsContent
        paper={paper}
        loading={loading}
        onUploadPdf={onUploadPdf}
        isUploadingPdf={isUploadingPdf}
      />
    </Drawer>
  );
};

export default memo(PaperDetailsView);
