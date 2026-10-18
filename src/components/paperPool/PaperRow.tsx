import { useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiEye, FiLink, FiLoader, FiTrash2 } from "react-icons/fi";
import ConfirmModal from "../ui/ConfirmModal";
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
      <span className={`${base} bg-amber-50 text-amber-700`} title={`${paper.pdfProcessingError}. Retrying automatically.`}>
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
        <FiLoader className="h-3 w-3 animate-spin" />
        Loading
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className={`${base} bg-red-50 text-red-600`} title={paper.pdfProcessingError || "Full-text extraction failed"}>
        <FiAlertCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  if (paper.pdfFullTextStatus === "PARTIAL") {
    return (
      <span
        className={`${base} bg-amber-50 text-amber-700`}
        title="Only metadata and references could be extracted from the PDF"
      >
        <FiAlertCircle className="h-3 w-3" />
        PARTIAL
      </span>
    );
  }
  if (paper.pdfFullTextStatus === "COMPLETED" || status === "COMPLETED") {
    return (
      <span className={`${base} bg-green-50 text-green-700`} title="PDF uploaded">
        <FiCheckCircle className="h-3 w-3" />
        Loaded
      </span>
    );
  }
  return (
    <span className={`${base} bg-amber-50 text-amber-800`} title="A PDF is attached, but full text has not been extracted">
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
      className={`group border-b border-border transition-all duration-200 ${
        isSelected ? "bg-bg-secondary/40" : "hover:bg-bg-secondary/80"
      }`}
    >
      {isLeader && (
        <td className="px-6 py-4 align-top">
          <div className="flex items-center pt-0.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onToggleSelect(paper.id, e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20 transition-all cursor-pointer"
              aria-label={`Select paper ${paper.id}`}
            />
          </div>
        </td>
      )}
      <td
        className={`${
          isLeader ? "px-3" : "px-4 sm:px-5"
        } py-4 align-top`}
      >
        <span className="text-[10px] font-mono font-bold text-text-secondary bg-bg-secondary/50 px-1.5 py-0.5 rounded leading-none">
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
            <span className="block truncate whitespace-nowrap text-sm font-bold text-text-primary leading-snug group-hover/title:text-accent transition-colors">
              {paper.title}
            </span>
          </button>
          {!paper.abstract?.trim() && (
            <span className="mt-1.5 w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              Missing abstract
            </span>
          )}
          <div className="text-xs font-medium text-text-secondary mt-1.5 flex items-center gap-1.5">
            <span className="truncate max-w-[280px]">{paper.authors}</span>
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
            <span className="text-[11px] font-bold text-text-secondary truncate max-w-[100px]">
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
            onClick={() => onViewDetails(paper)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-text-primary hover:bg-surface-white hover:border-accent hover:text-accent hover:shadow-sm transition-all duration-200"
          >
            <FiEye className="h-3.5 w-3.5" />
          </button>
          {onDeletePaper && (
            <button
              type="button"
              onClick={() => {
                if (onDeleteClick) {
                  onDeleteClick(paper);
                } else {
                  setIsConfirmDeleteOpen(true);
                }
              }}
              disabled={isDeletingPaper}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-red-600 hover:bg-surface-white hover:border-red-500 hover:text-red-700 hover:shadow-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete paper"
            >
              {isDeletingPaper ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
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
