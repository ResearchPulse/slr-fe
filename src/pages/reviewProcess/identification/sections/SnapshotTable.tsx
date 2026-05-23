// Snapshot Table — right panel in Build Dataset tab
// Shows papers already added to the screening dataset (read-only, no selection)

import { FiRefreshCw, FiAlertCircle, FiDatabase } from "react-icons/fi";
import Button from "../../../../components/ui/Button";

import IdentificationFilterBar from "./IdentificationFilterBar";
import type { PaperResponse } from "../../../../types/paper";
import EmptyState from "../../../../components/ui/EmptyState";

interface SnapshotTableProps {
  papers: PaperResponse[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  loading: boolean;
  fetching: boolean;
  error: string | null;
  pageSize: number;
  protocolId?: string;

  // Filters
  searchInput: string;
  yearInput: string;
  searchSourceInput: string;
  onSearchInputChange: (v: string) => void;
  onYearInputChange: (v: string) => void;
  onSearchSourceInputChange: (v: string) => void;
  onSearch: (v: string) => void;
  onYearFilter: (v: number | undefined) => void;
  onSearchSourceFilter: (v: string | undefined) => void;
  onClearFilters: () => void;
  onRefetch: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

export default function SnapshotTable({
  papers,
  totalCount,
  page,
  totalPages,
  hasNext,
  hasPrev,
  loading,
  fetching,
  error,
  pageSize,
  protocolId,
  searchInput,
  yearInput,
  searchSourceInput,
  onSearchInputChange,
  onYearInputChange,
  onSearchSourceInputChange,
  onSearch,
  onYearFilter,
  onSearchSourceFilter,
  onClearFilters,
  onRefetch,
  onNextPage,
  onPreviousPage,
}: SnapshotTableProps) {
  const hasFilters = !!(searchInput || yearInput || searchSourceInput);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h3 className="text-sm font-semibold text-text-primary">
            Snapshot Dataset
          </h3>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {totalCount.toLocaleString()}
          </span>
        </div>
        <button
          onClick={onRefetch}
          disabled={fetching}
          className="p-1.5 text-text-secondary hover:text-text-secondary hover:bg-bg-secondary rounded-md transition-colors"
          title="Refresh"
        >
          <FiRefreshCw
            className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="mb-4">
        <IdentificationFilterBar
          protocolId={protocolId}
          searchInput={searchInput}
          yearInput={yearInput}
          searchSourceInput={searchSourceInput}
          onSearchInputChange={onSearchInputChange}
          onYearInputChange={onYearInputChange}
          onSearchSourceInputChange={onSearchSourceInputChange}
          onSearch={onSearch}
          onYearFilter={onYearFilter}
          onSearchSourceFilter={onSearchSourceFilter}
          onClearFilters={onClearFilters}
          searchPlaceholder="Search snapshot..."
          tone="blue"
        />
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {loading && papers.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 animate-pulse"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FiAlertCircle className="w-10 h-10 text-red-400 mb-2" />
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={onRefetch}>
              <FiRefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        ) : papers.length > 0 ? (
          <>
            {fetching && (
              <div className="flex items-center gap-1.5 mb-2 text-xs text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
                Updating...
              </div>
            )}
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Authors
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Year
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    DOI
                  </th>
                </tr>
              </thead>
              <tbody>
                {papers.map((paper) => (
                  <tr
                    key={paper.id}
                    className="border-b border-border hover:bg-bg-primary transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <p className="text-sm font-medium text-text-primary line-clamp-2 max-w-xs">
                        {paper.title}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-text-secondary max-w-[150px] truncate">
                      {paper.authors || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-text-secondary">
                      {paper.publicationYear || "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      {paper.doi ? (
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline truncate max-w-[120px] block"
                        >
                          {paper.doi}
                        </a>
                      ) : (
                        <span className="text-xs text-text-secondary">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <EmptyState
            icon={<FiDatabase className="w-12 h-12 text-gray-300" />}
            title="No Papers in Dataset"
            description={
              hasFilters
                ? "No snapshot papers match your filters."
                : "No papers have been added to the screening dataset yet. Select papers from the Ready Papers list and click 'Add Selected'."
            }
            actionLabel={hasFilters ? "Clear Filters" : "Start Adding"}
            onAction={onClearFilters}
          />
        )}
      </div>

      {/* Footer: Pagination */}
      {papers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, totalCount)} of{" "}
              {totalCount.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={!hasPrev || fetching}
                onClick={onPreviousPage}
                className="px-2.5 py-1 text-xs font-medium text-text-secondary bg-surface-white border border-border rounded-md hover:bg-bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="text-xs text-text-secondary px-1">
                {page}/{totalPages}
              </span>
              <button
                disabled={!hasNext || fetching}
                onClick={onNextPage}
                className="px-2.5 py-1 text-xs font-medium text-text-secondary bg-surface-white border border-border rounded-md hover:bg-bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Total count summary */}
          <div className="flex items-center justify-end mt-2">
            <span className="text-sm text-blue-700 font-medium">
              Total: {totalCount.toLocaleString()} paper
              {totalCount !== 1 ? "s" : ""} in dataset
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
