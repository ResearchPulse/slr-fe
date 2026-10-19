import { useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiEye, FiLink, FiLoader, FiTrash2 } from "react-icons/fi";
import ConfirmModal from "../ui/ConfirmModal";
import Checkbox from "../ui/Checkbox";
import type { PaperPoolItem } from "./types";
import PaperPdfActions from "../reviewProcess/leader/PaperPdfActions";
import type { PaperDetailsResponse } from "../../types/paper";
import type { UploadPdfOptions } from "../../pages/reviewProcess/studySelection/uploadTypes";
import type { PaperWithDecisionsResponse } from "../../types/studySelection";

type UploadPdfHandler = (
  paperId: string,
  file: File,
  options?: UploadPdfOptions,
) => Promise<PaperWithDecisionsResponse>;
type ApplyMetadataSuggestionHandler = (
  paperId: string,
  sourceMetadataId: string,
  fields: string[],
) => Promise<void>;

function PdfStatusBadge({ paper }: { paper: PaperPoolItem }) {
  const status = paper.pdfProcessingStatus;
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider whitespace-nowrap";

  if (!paper.hasFullText) {
    return (
      <span className={`${base} bg-bg-secondary text-text-secondary`} title="No PDF is attached to this paper">
        NOT PDF
      </span>
    );
  }

  // A queued job that already failed once is waiting to be retried (e.g. GROBID is offline).
  if (status === "PENDING" && paper.pdfProcessingError) {
    return (
      <span className={`${base} border border-warning/20 bg-warning/10 text-warning`} title={`${paper.pdfProcessingError}. Retrying automatically.`}>
        <FiAlertCircle className="h-3 w-3" />
        Retrying
      </span>
    );
  }
  if (status === "PENDING" || status === "PROCESSING") {
    return (
      <span
        className={`${base} bg-primary-light text-accent`}
        title={status === "PENDING" ? "Waiting in the extraction queue" : "Extracting full text with GROBID"}
      >
        <FiLoader aria-hidden="true" className="h-3 w-3 motion-safe:animate-spin motion-reduce:animate-none" />
        Loading
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className={`${base} border border-error/20 bg-error/10 text-error`} title={paper.pdfProcessingError || "Full-text extraction failed"}>
        <FiAlertCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  if (paper.pdfFullTextStatus === "PARTIAL") {
    return (
      <span
        className={`${base} border border-warning/20 bg-warning/10 text-warning`}
        title="Only metadata and references could be extracted from the PDF"
      >
        <FiAlertCircle className="h-3 w-3" />
        PARTIAL
      </span>
    );
  }
  if (paper.pdfFullTextStatus === "COMPLETED" || status === "COMPLETED") {
    return (
      <span className={`${base} border border-success/20 bg-success/10 text-success`} title="PDF uploaded">
        <FiCheckCircle className="h-3 w-3" />
        Loaded
      </span>
    );
  }
  return (
    <span className={`${base} border border-warning/20 bg-warning/10 text-warning`} title="A PDF is attached, but full text has not been extracted">
      NOT FULL TEXT
    </span>
  );
}

interface PaperRowProps {
  paper: PaperPoolItem;
  isSelected: boolean;
  onToggleSelect: (paperId: string, selected: boolean) => void;
  onViewDetails: (paper: PaperPoolItem) => void;

  // PDF Actions
  onUploadPdf?: UploadPdfHandler;
  isUploadingPdf?: boolean;
  onApplyMetadataSuggestion?: ApplyMetadataSuggestionHandler;
  isApplyingMetadataSuggestion?: boolean;
  onRemovePdf?: (paperId: string) => Promise<void>;
  isRemovingPdf?: boolean;

  // Delete Action
  onDeletePaper?: (paperId: string, reason: string) => void;
  onDeleteClick?: (paper: PaperPoolItem) => void;
  isDeletingPaper?: boolean;
  isLeader?: boolean;
  canUploadPdf?: boolean;
}

export default function PaperRow({
  paper,
  isSelected,
  onToggleSelect,
  onViewDetails,
  onUploadPdf,
  isUploadingPdf,
  onApplyMetadataSuggestion,
  isApplyingMetadataSuggestion,
  onRemovePdf,
  isRemovingPdf,
  onDeletePaper,
  onDeleteClick,
  isDeletingPaper,
  isLeader = false,
  canUploadPdf = false,
}: PaperRowProps) {
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const deleteMessage = `Delete "${paper.title.substring(0, 60)}${paper.title.length > 60 ? "..." : ""}"?`;

  return (
    <tr
      className={`group border-b border-border transition-colors duration-150 motion-reduce:transition-none ${
        isSelected ? "bg-bg-secondary/40" : "hover:bg-bg-secondary/80"
      }`}
    >
      {isLeader && (
        <td className="px-6 py-4 align-top">
          <div className="flex items-center pt-0.5">
            <Checkbox
              checked={isSelected}
              onChange={(e) => onToggleSelect(paper.id, e.target.checked)}
              aria-label={`Select paper ${paper.id}`}
              wrapperClassName="h-8 w-8 justify-center rounded-lg transition-colors hover:bg-primary-light motion-reduce:transition-none"
            />
          </div>
        </td>
      )}
      <td
        className={`${
          isLeader ? "px-3" : "px-4 sm:px-5"
        } py-4 align-top`}
      >
        <span className="whitespace-nowrap rounded bg-bg-secondary/50 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-text-secondary">
          {paper.id.slice(0, 8)}...
        </span>
      </td>
      <td className="w-[360px] max-w-[360px] overflow-hidden px-3 py-4 align-top">
        <div className="flex flex-col">
          <button
            onClick={() => onViewDetails(paper)}
            className="block min-w-0 max-w-full text-left group/title focus:outline-none"
            title={paper.title}
          >
            <span className="line-clamp-2 break-words text-sm font-bold leading-snug text-text-primary transition-colors group-hover/title:text-accent">
              {paper.title}
            </span>
          </button>
          {!paper.abstract?.trim() && (
            <span className="mt-1.5 w-fit rounded-full border border-warning/20 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
              Missing abstract
            </span>
          )}
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs font-medium text-text-secondary">
            <span className="min-w-0 max-w-[280px] truncate">{paper.authors}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 align-top">
        <span className="text-xs font-black text-text-primary bg-bg-secondary px-2 py-0.5 rounded-full">
          {paper.year ?? "N/A"}
        </span>
      </td>
      <td className="px-3 py-4 align-top max-w-[150px]">
        {paper.doi ? (
          <div className="flex items-center gap-1.5 text-text-primary hover:text-accent cursor-pointer group/doi">
            <FiLink className="w-3 h-3 shrink-0" />
            <span className="text-[11px] font-mono truncate border-b border-transparent group-hover/doi:border-accent">{paper.doi}</span>
          </div>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            No DOI
          </span>
        )}
      </td>
      <td className="px-3 py-4 align-top">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="min-w-0 max-w-[104px] truncate text-[11px] font-bold text-text-secondary" title={paper.source}>
              {paper.source}
            </span>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 align-top">
        <PaperPdfActions
          paper={paper as unknown as PaperDetailsResponse}
          onUploadPdf={onUploadPdf}
          isUploadingPdf={isUploadingPdf}
          onApplyMetadataSuggestion={onApplyMetadataSuggestion}
          isApplyingMetadataSuggestion={isApplyingMetadataSuggestion}
          onRemovePdf={onRemovePdf}
          isRemovingPdf={isRemovingPdf}
          isLeader={isLeader}
          canUploadPdf={canUploadPdf}
        />
      </td>
      <td className="px-3 py-4 align-top">
        <PdfStatusBadge paper={paper} />
      </td>

      <td className="px-6 py-4 align-top text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            aria-label={`View details for ${paper.title}`}
            onClick={() => onViewDetails(paper)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-[11px] font-black uppercase tracking-wider text-text-primary transition-colors hover:border-accent hover:bg-surface-white hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <FiEye className="h-3.5 w-3.5" />
          </button>
          {onDeletePaper && (
            <button
              type="button"
              aria-label={`Delete ${paper.title}`}
              onClick={() => {
                if (onDeleteClick) {
                  onDeleteClick(paper);
                } else {
                  setIsConfirmDeleteOpen(true);
                }
              }}
              disabled={isDeletingPaper}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-error/20 px-3 text-[11px] font-black uppercase tracking-wider text-error transition-colors hover:border-error/50 hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              title="Delete paper"
            >
              {isDeletingPaper ? (
                <div aria-hidden="true" className="h-3.5 w-3.5 rounded-full border-2 border-error border-t-transparent motion-safe:animate-spin motion-reduce:animate-none" />
              ) : (
                <FiTrash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {onDeletePaper && (
            <ConfirmModal
              isOpen={isConfirmDeleteOpen}
              onClose={() => setIsConfirmDeleteOpen(false)}
              onConfirm={() => {
                setIsConfirmDeleteOpen(false);
                onDeletePaper(paper.id, "Deleted from paper repository");
              }}
              title="Delete paper"
              message={deleteMessage}
              confirmText="Delete"
            />
          )}
        </div>
      </td>
    </tr>
  );
}
