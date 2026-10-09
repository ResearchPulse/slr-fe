import LoadingSpinner from "../ui/LoadingSpinner";
import Button from "../ui/Button";
import Select from "../ui/Select";
import PaperRow from "./PaperRow";
import type { PaperPoolItem } from "./types";
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
  onUploadPdf?: UploadPdfHandler;
  isUploadingPdf?: boolean;
  onApplyMetadataSuggestion?: ApplyMetadataSuggestionHandler;
  isApplyingMetadataSuggestion?: boolean;
  onRemovePdf?: (paperId: string) => Promise<void>;
  isRemovingPdf?: boolean;

  // Delete Action
  onDeletePaper?: (paperId: string, reason: string) => void;
  isDeletingPaper?: string | null; // PaperId being deleted
  isLeader?: boolean;
  canUploadPdf?: boolean;
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
  canUploadPdf = false,
}: PaperTableProps) {
  if (isLoading && papers.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-border bg-white">
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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {/* Table Header / Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border bg-slate-50/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text-primary">
            {totalCount.toLocaleString()}{" "}
            <span className="font-normal text-text-secondary">Results</span>
          </span>
          {isFetching && (
            <div className="flex items-center gap-2 rounded-full border border-accent/20 bg-primary-light px-2.5 py-1 text-[10px] font-medium text-accent">
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
              Refreshing
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <label className="text-xs font-medium text-text-secondary">
            Rows per page:
          </label>
          <Select
            className="w-[76px]"
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
        className="flex-1 overflow-auto custom-scrollbar"
        style={{
          maxHeight: "calc(100vh - 400px)",
          minHeight: papers.length === 0 ? "180px" : "0",
        }}
      >
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 border-b border-border bg-white">
            <tr className="text-left">
              {isLeader && (
                <th className="w-12 px-4 py-3.5 sm:px-5">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={(e) => onToggleAllPage(e.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-border text-accent focus:ring-accent/20"
                      aria-label="Select all papers in current page"
                    />
                  </div>
                </th>
              )}
              <th
                className={`whitespace-nowrap ${
                  isLeader ? "px-3" : "px-4 sm:px-5"
                } py-3.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary`}
              >
                Paper ID
              </th>
              <th className="whitespace-nowrap px-3 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                Title & Authors
              </th>
              <th className="whitespace-nowrap px-3 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                Year
              </th>
              <th className="whitespace-nowrap px-3 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                DOI
              </th>
              <th className="whitespace-nowrap px-3 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                Source
              </th>
              <th className="whitespace-nowrap px-3 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                Full Text
              </th>
              <th className="whitespace-nowrap px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
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
                canUploadPdf={canUploadPdf}
              />
            ))}
            {papers.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={isLeader ? 8 : 7}
                  className="px-5 py-8 sm:py-10"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-slate-50 text-slate-300 ring-1 ring-inset ring-border/70">
                      <svg
                        className="h-8 w-8"
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
                    <p className="mt-1 max-w-sm text-sm leading-6 text-text-secondary">
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
      <div className="flex flex-col gap-3 border-t border-border bg-slate-50/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="text-xs text-text-secondary">
          Showing page{" "}
          <span className="font-semibold text-text-primary">{pageNumber}</span> of{" "}
          <span className="font-semibold text-text-primary">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-xl px-3 text-xs font-medium"
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
            className="h-9 rounded-xl px-3 text-xs font-medium"
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
