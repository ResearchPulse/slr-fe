import LoadingSpinner from "../ui/LoadingSpinner";
import Button from "../ui/Button";
import Select from "../ui/Select";
import PaperRow from "./PaperRow";
import type { PaperPoolItem } from "./types";

interface PaperTableProps {
  papers: PaperPoolItem[];
  isLoading: boolean;
  isFetching: boolean;
  totalCount: number;
  pageNumber: number;
  totalPages: number;
  pageSize: number;
  selectedPaperIds: string[];
  allPageSelected: boolean;
  onToggleAllPage: (checked: boolean) => void;
  onTogglePaper: (paperId: string, selected: boolean) => void;
  onViewDetails: (paper: PaperPoolItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;

  // PDF Actions
  onUploadPdf?: any;
  isUploadingPdf?: boolean;
  onApplyMetadataSuggestion?: any;
  isApplyingMetadataSuggestion?: boolean;
  onRemovePdf?: (paperId: string) => Promise<void>;
  isRemovingPdf?: boolean;

  // Delete Action
  onDeletePaper?: (paperId: string, reason: string) => void;
  isDeletingPaper?: string | null; // PaperId being deleted
  isLeader?: boolean;
}

export default function PaperTable({
  papers,
  isLoading,
  isFetching,
  totalCount,
  pageNumber,
  totalPages,
  pageSize,
  selectedPaperIds,
  allPageSelected,
  onToggleAllPage,
  onTogglePaper,
  onViewDetails,
  onPageChange,
  onPageSizeChange,
  onUploadPdf,
  isUploadingPdf,
  onApplyMetadataSuggestion,
  isApplyingMetadataSuggestion,
  onRemovePdf,
  isRemovingPdf,
  onDeletePaper,
  isDeletingPaper,
  isLeader = false,
}: PaperTableProps) {
  if (isLoading && papers.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-surface-white rounded-[4px] border border-border">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-text-secondary animate-pulse">
            Loading paper library...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-white rounded-[4px] border border-border overflow-hidden flex flex-col shadow-none">
      {/* Table Header / Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-primary/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text-primary">
            {totalCount.toLocaleString()}{" "}
            <span className="font-normal text-text-secondary">Results</span>
          </span>
          {isFetching && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-bg-secondary text-[10px] font-bold text-accent uppercase tracking-wider border border-border">
              <div className="w-1 h-1 rounded-full bg-accent animate-ping" />
              Refreshing
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Rows per page:
          </label>
          <Select
            className="w-20"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            options={[
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
          />
        </div>
      </div>

      {/* Table Content */}
      <div
        className="overflow-auto custom-scrollbar"
        style={{ maxHeight: "calc(100vh - 400px)", minHeight: "400px" }}
      >
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-surface-white border-b border-border shadow-none">
            <tr className="text-left">
              <th className="px-6 py-4 w-12">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={(e) => onToggleAllPage(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent transition-all cursor-pointer"
                    aria-label="Select all papers in current page"
                  />
                </div>
              </th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                Paper ID
              </th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                Title & Authors
              </th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                Year
              </th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                DOI
              </th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                Source
              </th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                Full Text
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {papers.map((paper) => (
              <PaperRow
                key={paper.id}
                paper={paper}
                isSelected={selectedPaperIds.includes(paper.id)}
                onToggleSelect={onTogglePaper}
                onViewDetails={onViewDetails}
                onUploadPdf={onUploadPdf}
                isUploadingPdf={isUploadingPdf}
                onApplyMetadataSuggestion={onApplyMetadataSuggestion}
                isApplyingMetadataSuggestion={isApplyingMetadataSuggestion}
                onRemovePdf={onRemovePdf}
                isRemovingPdf={isRemovingPdf}
                onDeletePaper={onDeletePaper}
                isDeletingPaper={isDeletingPaper === paper.id}
                isLeader={isLeader}
              />
            ))}
            {papers.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-bg-primary rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">
                      No papers found
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary max-w-xs">
                      We couldn't find any papers matching your current filter
                      criteria. Try adjusting your search or filters.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-bg-primary/30">
        <div className="text-xs font-medium text-text-secondary">
          Showing page{" "}
          <span className="text-text-primary font-bold">{pageNumber}</span> of{" "}
          <span className="text-text-primary font-bold">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs font-bold uppercase tracking-wider"
            onClick={() => onPageChange(pageNumber - 1)}
            disabled={pageNumber <= 1 || isFetching}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {/* Simple page numbers could go here if needed */}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs font-bold uppercase tracking-wider"
            onClick={() => onPageChange(pageNumber + 1)}
            disabled={pageNumber >= totalPages || isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
