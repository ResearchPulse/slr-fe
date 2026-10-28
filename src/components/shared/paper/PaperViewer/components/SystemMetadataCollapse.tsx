import React, { useState } from "react";
import { FiDatabase, FiChevronUp, FiChevronDown, FiExternalLink } from "react-icons/fi";
import type { ScreeningPaper } from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";

/** Optional system-level facts shown when the viewer is given the full paper record. */
export interface SystemMetadataExtras {
  importedAt?: string | null;
  createdAt?: string | null;
  modifiedAt?: string | null;
  pdfFileName?: string | null;
  pdfSizeBytes?: number | null;
  pdfUrl?: string | null;
  pdfProcessingStatus?: string | null;
  fullTextStatus?: string | null;
  extractionError?: string | null;
  sectionCount?: number | null;
  referenceCount?: number | null;
  figureCount?: number | null;
}

interface SystemMetadataCollapseProps {
  paper: ScreeningPaper;
  extras?: SystemMetadataExtras;
  variant?: "default" | "compact";
}

function formatSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
}

function extractedContentLabel(extras: SystemMetadataExtras): string | null {
  const parts = [
    ["section", extras.sectionCount],
    ["reference", extras.referenceCount],
    ["figure/table", extras.figureCount],
  ] as const;
  const known = parts.filter(([, count]) => typeof count === "number");
  if (known.length === 0) return null;
  return known
    .map(([name, count]) => `${count} ${name}${count === 1 ? "" : "s"}`)
    .join(" · ");
}

function extractionLabel(extras: SystemMetadataExtras): string | null {
  switch (extras.pdfProcessingStatus) {
    case "PENDING":
    case "PROCESSING":
      return "Extracting full text...";
    case "FAILED":
      return "Failed";
    case "COMPLETED":
      return extras.fullTextStatus === "PARTIAL"
        ? "Partial (metadata and references only)"
        : "Completed";
    default:
      return null;
  }
}

interface MetaRowProps {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  wide?: boolean;
  compact?: boolean;
}

function MetaRow({ label, value, mono = false, wide = false, compact = false }: MetaRowProps) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <div className={`space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className={compact ? "text-[11px] font-medium text-text-secondary" : "text-[10px] font-black uppercase tracking-widest text-text-secondary"}>
        {label}
      </span>
      {hasValue ? (
        <div
          className={`break-all ${compact ? "text-sm font-medium leading-5" : "text-xs font-bold"} ${mono ? "font-mono text-text-secondary" : "text-text-primary"}`}
        >
          {value}
        </div>
      ) : (
        <p className={compact ? "text-sm italic text-text-secondary" : "text-xs font-medium italic text-text-secondary"}>N/A</p>
      )}
    </div>
  );
}

export const SystemMetadataCollapse: React.FC<SystemMetadataCollapseProps> = ({
  paper,
  extras,
  variant = "default",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileSize = formatSize(extras?.pdfSizeBytes);
  const compact = variant === "compact";

  return (
    <section className={compact ? "overflow-hidden rounded-xl border border-border bg-surface-white" : "overflow-hidden rounded-xl border border-border bg-bg-secondary/50 shadow-none transition-colors motion-reduce:transition-none"}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 motion-reduce:transition-none ${compact ? "px-4 py-3.5 hover:bg-bg-secondary/60 sm:px-5" : "p-6 hover:bg-bg-secondary"}`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex shrink-0 items-center justify-center text-text-secondary ${compact ? "h-7 w-7 rounded-lg bg-bg-secondary" : "h-8 w-8 rounded-xl border border-border bg-surface-white"}`}>
            <FiDatabase className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className={compact ? "text-sm font-semibold text-text-primary" : "text-[11px] font-black uppercase tracking-[0.15em] text-text-secondary"}>
            System Metadata
          </span>
        </div>
        {isOpen ? (
          <FiChevronUp className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
        ) : (
          <FiChevronDown className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div className={compact ? "px-4 pb-4 sm:px-5" : "px-6 pb-8 motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:duration-150 motion-reduce:animate-none"}>
          <div className={`grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border pt-4 sm:grid-cols-2 ${compact ? "" : "gap-6"}`}>
            <div className="space-y-1">
                <span className={compact ? "text-[11px] font-medium text-text-secondary" : "text-[10px] font-black uppercase tracking-widest text-text-secondary"}>
                Internal ID
              </span>
              <p className={`break-all ${compact ? "text-xs font-mono text-text-primary" : "text-xs font-mono font-bold text-text-secondary"}`}>
                {paper.id}
              </p>
            </div>
            <div className="space-y-1">
              <span className={compact ? "text-[11px] font-medium text-text-secondary" : "text-[10px] font-black uppercase tracking-widest text-text-secondary"}>
                Source
              </span>
              <p className={compact ? "text-sm font-medium text-text-primary" : "text-xs font-bold text-text-primary"}>
                {paper.source || "Manual Entry"}
              </p>
            </div>

            {extras && (
              <>
                <MetaRow label="Imported" value={formatDate(extras.importedAt ?? extras.createdAt)} compact={compact} />
                <MetaRow label="Last modified" value={formatDate(extras.modifiedAt)} compact={compact} />
                <MetaRow
                  label="PDF file"
                  value={
                    extras.pdfFileName
                      ? `${extras.pdfFileName}${fileSize ? ` (${fileSize})` : ""}`
                      : null
                  }
                  wide
                  compact={compact}
                />
                <MetaRow label="Full-text extraction" value={extractionLabel(extras)} compact={compact} />
                <MetaRow label="Extracted content" value={extractedContentLabel(extras)} compact={compact} />
                <MetaRow label="Extraction error" value={extras.extractionError} compact={compact} />
                <MetaRow
                  label="PDF link"
                  value={
                    extras.pdfUrl ? (
                      <a
                        href={extras.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-accent hover:underline"
                      >
                        Open PDF
                        <FiExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : null
                  }
                  compact={compact}
                />
              </>
            )}

            <div className={`col-span-full ${compact ? "pt-1" : "rounded-xl border border-border border-dashed bg-surface-white/50 px-4 py-4"}`}>
              <p className={compact ? "text-xs leading-5 text-text-secondary" : "text-center text-[10px] font-medium italic text-text-secondary"}>
                System tracking data is primarily used for synchronization and
                conflict resolution.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
