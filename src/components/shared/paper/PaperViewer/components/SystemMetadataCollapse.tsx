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
}

function MetaRow({ label, value, mono = false, wide = false }: MetaRowProps) {
  const hasValue = value !== null && value !== undefined && value !== "";
  return (
    <div className={`space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
        {label}
      </span>
      {hasValue ? (
        <div
          className={`break-all text-xs font-bold ${mono ? "font-mono text-text-secondary" : "text-slate-800"}`}
        >
          {value}
        </div>
      ) : (
        <p className="text-xs font-medium italic text-text-secondary">N/A</p>
      )}
    </div>
  );
}

export const SystemMetadataCollapse: React.FC<SystemMetadataCollapseProps> = ({
  paper,
  extras,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileSize = formatSize(extras?.pdfSizeBytes);

  return (
    <div className="bg-bg-secondary/50 rounded-xl border border-border overflow-hidden shadow-none transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-200/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-surface-white border border-border flex items-center justify-center text-text-secondary">
            <FiDatabase className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em]">
            System Metadata
          </span>
        </div>
        {isOpen ? (
          <FiChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <FiChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                Internal ID
              </span>
              <p className="text-xs font-mono font-bold text-text-secondary">
                {paper.id}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                Source
              </span>
              <p className="text-xs font-bold text-slate-800">
                {paper.source || "Manual Entry"}
              </p>
            </div>

            {extras && (
              <>
                <MetaRow label="Imported" value={formatDate(extras.importedAt ?? extras.createdAt)} />
                <MetaRow label="Last modified" value={formatDate(extras.modifiedAt)} />
                <MetaRow
                  label="PDF file"
                  value={
                    extras.pdfFileName
                      ? `${extras.pdfFileName}${fileSize ? ` (${fileSize})` : ""}`
                      : null
                  }
                  wide
                />
                <MetaRow label="Full-text extraction" value={extractionLabel(extras)} />
                <MetaRow label="Extracted content" value={extractedContentLabel(extras)} />
                <MetaRow label="Extraction error" value={extras.extractionError} />
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
                />
              </>
            )}

            <div className="col-span-full py-4 px-4 bg-surface-white/50 rounded-xl border border-border border-dashed">
              <p className="text-[10px] text-text-secondary font-medium text-center italic">
                System tracking data is primarily used for synchronization and
                conflict resolution.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
