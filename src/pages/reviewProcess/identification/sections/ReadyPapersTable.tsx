// Ready Papers Table — left panel in Build Dataset tab
// Shows papers eligible for snapshot selection with checkboxes and filtering

import {
  FiRefreshCw,
  FiAlertCircle,
  FiArrowRight,
  FiCheckSquare,
} from "react-icons/fi";
import Button from "../../../../components/ui/Button";
import EmptyState from "../../../../components/ui/EmptyState";
import IdentificationFilterBar from "./IdentificationFilterBar";
import type { PaperResponse } from "../../../../types/paper";

interface ReadyPapersTableProps {
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

  // Selection
  isSelected: (id: string) => boolean;
  areAllSelected: (ids: string[]) => boolean;
  areSomeSelected: (ids: string[]) => boolean;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  selectedCount: number;

  // Actions
  onAddToSnapshot: () => void;
  isAdding: boolean;
  canEdit?: boolean;
}

export default function ReadyPapersTable({
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
  isSelected,
  areAllSelected,
  areSomeSelected,
  onToggle,
  onToggleAll,
  selectedCount,
  onAddToSnapshot,
  isAdding,
  canEdit = true,
}: ReadyPapersTableProps) {
  const hasFilters = !!(searchInput || yearInput || searchSourceInput);
  const pageIds = papers.map((p) => p.id);
  const allChecked = areAllSelected(pageIds);
  const someChecked = areSomeSelected(pageIds);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-semibold text-text-primary">
            Ready Papers
          </h3>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
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
          searchPlaceholder="Search title, DOI, authors..."
          tone="emerald"
        />
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {loading && papers.length === 0 ? (
          /* Loading skeleton */
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 animate-pulse"
              >
                <div className="w-4 h-4 bg-bg-secondary rounded" />
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
            {/* Fetching indicator for subsequent loads */}
            {fetching && (
              <div className="flex items-center gap-1.5 mb-2 text-xs text-emerald-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600" />
                Updating...
              </div>
            )}
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={() => onToggleAll(pageIds)}
                      className="rounded border-border text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                      disabled={!canEdit}
                    />
                  </th>
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
                    onClick={() => canEdit && onToggle(paper.id)}
                    className={`border-b border-border transition-colors ${
                      canEdit ? "cursor-pointer" : "cursor-default"
                    } ${
                      isSelected(paper.id)
                        ? "bg-emerald-50 hover:bg-emerald-100"
                        : canEdit
                          ? "hover:bg-bg-primary"
                          : ""
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected(paper.id)}
                        onChange={() => onToggle(paper.id)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!canEdit}
                        className="rounded border-border text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                      />
                    </td>
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
                          onClick={(e) => e.stopPropagation()}
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
            icon={<FiCheckSquare className="w-12 h-12 text-gray-300" />}
            title="No Papers Available"
            description={
              hasFilters
                ? "No papers match your filters. Try adjusting your search."
                : "All eligible papers have been added to the snapshot, or no valid papers exist yet."
            }
            actionLabel={hasFilters ? "Clear Filters" : "Go to Library"}
            onAction={onClearFilters}
          />
        )}
      </div>

      {/* Footer: Pagination + Add button */}
      {papers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border space-y-3">
          {/* Pagination */}
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

          {/* Add to Snapshot Action */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-primary font-medium">
              {selectedCount > 0 ? (
                <>
                  <span className="text-emerald-600">{selectedCount}</span>{" "}
                  paper
                  {selectedCount !== 1 ? "s" : ""} selected
                </>
              ) : (
                <span className="text-text-secondary">
                  Select papers to add
                </span>
              )}
            </span>
            <Button
              size="sm"
              onClick={onAddToSnapshot}
              disabled={selectedCount === 0 || isAdding || !canEdit}
              isLoading={isAdding}
              className="!py-2 !px-4 !text-sm !bg-emerald-600 hover:!bg-emerald-700 !shadow-emerald-600/20"
            >
              <FiArrowRight className="w-4 h-4 mr-1.5" />
              Add Selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
