import { FiEye, FiLink } from "react-icons/fi";
import type { PaperPoolItem } from "./types";
import PaperPdfActions from "../reviewProcess/leader/PaperPdfActions";
import type { PaperDetailsResponse } from "../../types/paper";

interface PaperRowProps {
  paper: PaperPoolItem;
  isSelected: boolean;
  onToggleSelect: (paperId: string, selected: boolean) => void;
  onViewDetails: (paper: PaperPoolItem) => void;

  // PDF Actions
  onUploadPdf?: any;
  isUploadingPdf?: boolean;
  onApplyMetadataSuggestion?: any;
  isApplyingMetadataSuggestion?: boolean;
  onRemovePdf?: (paperId: string) => Promise<void>;
  isRemovingPdf?: boolean;

  // Delete Action
  onDeletePaper?: (paperId: string, reason: string) => void;
  isDeletingPaper?: boolean;
  isLeader?: boolean;
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
  // onDeletePaper,
  // isDeletingPaper,
  isLeader = false,
}: PaperRowProps) {
  return (
    <tr
      className={`group border-b border-gray-50 transition-all duration-200 ${
        isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/80"
      }`}
    >
      <td className="px-6 py-4 align-top">
        <div className="flex items-center pt-0.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(paper.id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
            aria-label={`Select paper ${paper.id}`}
          />
        </div>
      </td>
      <td className="px-3 py-4 align-top">
        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100/50 px-1.5 py-0.5 rounded leading-none">
          {paper.id.slice(0, 8)}...
        </span>
      </td>
      <td className="px-3 py-4 align-top min-w-[320px]">
        <div className="flex flex-col">
          <button
            onClick={() => onViewDetails(paper)}
            className="text-left group/title focus:outline-none"
          >
            <span className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover/title:text-blue-600 transition-colors">
              {paper.title}
            </span>
          </button>
          <div className="text-xs font-medium text-gray-500 mt-1.5 flex items-center gap-1.5">
            <span className="truncate max-w-[280px]">{paper.authors}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 align-top">
        <span className="text-xs font-black text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
          {paper.year ?? "N/A"}
        </span>
      </td>
      <td className="px-3 py-4 align-top max-w-[150px]">
        {paper.doi ? (
          <div className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 cursor-pointer group/doi">
            <FiLink className="w-3 h-3 shrink-0" />
            <span className="text-[11px] font-mono truncate">{paper.doi}</span>
          </div>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            No DOI
          </span>
        )}
      </td>
      <td className="px-3 py-4 align-top">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[11px] font-bold text-gray-600 truncate max-w-[100px]">
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
        />
      </td>

      <td className="px-6 py-4 align-top text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onViewDetails(paper)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-700 hover:bg-white hover:border-blue-500 hover:text-blue-600 hover:shadow-sm transition-all duration-200"
          >
            <FiEye className="h-3.5 w-3.5" />
          </button>
          {/* {onDeletePaper && (
            <button
              onClick={() => {
                const reason = window.prompt(
                  `Reason for deleting "${paper.title.substring(0, 30)}...":`,
                  "Other reason",
                );
                if (reason !== null) {
                  onDeletePaper?.(paper.id, reason || "Other reason");
                }
              }}
              disabled={isDeletingPaper}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-red-600 hover:bg-red-50 hover:border-red-500 hover:text-red-700 hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete paper"
            >
              {isDeletingPaper ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
              ) : (
                <FiTrash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )} */}
        </div>
      </td>
    </tr>
  );
}
