// Papers Library Tab Content (now specifically showing Ready Papers)

import {
  FiRefreshCw,
  FiAlertCircle,
  FiDownload,
  FiDatabase,
  FiEye,
  FiMoreVertical,
  FiFileText,
} from "react-icons/fi";
import Button from "../../../../components/ui/Button";
import EmptyState from "../../../../components/ui/EmptyState";
import IdentificationFilterBar from "./IdentificationFilterBar";
import type { PaperResponse } from "../../../../types/paper";
import type { TabType } from "../types";
import { Ban } from "lucide-react";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

interface PapersLibraryTabContentProps {
  readyPapers: PaperResponse[];
  readyPapersTotalCount: number;
  readyPapersPage: number;
  readyPapersTotalPages: number;
  readyPapersHasNext: boolean;
  readyPapersHasPrev: boolean;
  readyPapersLoading: boolean;
  readyPapersError: string | null;
  protocolId?: string;
  librarySearchInput: string;
  yearFilterInput: string;
  searchSourceFilterInput: string;
  onSearchInputChange: (value: string) => void;
  onYearInputChange: (value: string) => void;
  onSearchSourceInputChange: (value: string) => void;
  onSearch: (value: string) => void;
  onYearFilter: (year: number | undefined) => void;
  onSearchSourceFilter: (searchSourceId: string | undefined) => void;
  onClearFilters: () => void;
  onRefetch: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onViewPaper: (paper: PaperResponse) => void;
  onMarkAsDuplicate: (paper: PaperResponse) => void;
  onChangeTab: (tab: TabType) => void;
  canEdit?: boolean;
}

export default function PapersLibraryTabContent({
  readyPapers,
  readyPapersTotalCount,
  readyPapersPage,
  readyPapersTotalPages,
  readyPapersHasNext,
  readyPapersHasPrev,
  readyPapersLoading,
  readyPapersError,
  protocolId,
  librarySearchInput,
  yearFilterInput,
  searchSourceFilterInput,
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
  onViewPaper,
  onMarkAsDuplicate,
  onChangeTab,
  canEdit = true,
}: PapersLibraryTabContentProps) {
  const hasFilters = !!(
    librarySearchInput ||
    yearFilterInput ||
    searchSourceFilterInput
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 sm:flex-1">
          <IdentificationFilterBar
            protocolId={protocolId}
            searchInput={librarySearchInput}
            yearInput={yearFilterInput}
            searchSourceInput={searchSourceFilterInput}
            onSearchInputChange={onSearchInputChange}
            onYearInputChange={onYearInputChange}
            onSearchSourceInputChange={onSearchSourceInputChange}
            onSearch={onSearch}
            onYearFilter={onYearFilter}
            onSearchSourceFilter={onSearchSourceFilter}
            onClearFilters={onClearFilters}
            tone="blue"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="text-sm text-text-secondary">
            {readyPapersTotalCount.toLocaleString()} ready paper
            {readyPapersTotalCount !== 1 ? "s" : ""}
          </span>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={onRefetch}
            disabled={readyPapersLoading}
          >
            <FiRefreshCw
              className={`w-4 h-4 ${readyPapersLoading ? "motion-safe:animate-spin motion-reduce:animate-none" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="secondary" className="flex items-center gap-2">
            <FiDownload className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {readyPapersLoading && readyPapers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-text-secondary">Loading papers...</p>
        </div>
      ) : readyPapersError ? (
        /* Error State */
        <div className="flex flex-col items-center justify-center py-16">
          <FiAlertCircle className="mb-3 h-12 w-12 text-error" />
          <p className="mb-4 text-sm text-error" role="alert">{readyPapersError}</p>
          <Button variant="secondary" onClick={onRefetch}>
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : readyPapers.length > 0 ? (
        <div className="overflow-x-auto">
          {/* Loading overlay for subsequent fetches */}
          {readyPapersLoading && (
            <div className="flex items-center gap-2 mb-3 text-sm text-accent">
              <LoadingSpinner size="sm" />
              Updating...
            </div>
          )}
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 w-8">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Title
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Authors
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Year
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Source
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Journal
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-text-primary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {readyPapers.map((paper) => (
                <tr
                  key={paper.id}
                  className="border-b border-border hover:bg-bg-primary transition-colors"
                >
                  <td className="py-4 px-4">
                    <input type="checkbox" className="rounded border-border" />
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs text-text-secondary font-bold">
                      {paper.id}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="max-w-md">
                      <p className="font-medium text-text-primary line-clamp-2">
                        {paper.title}
                      </p>
                      {paper.doi && (
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent hover:text-primary-hover mt-1 flex items-center gap-1"
                        >
                          DOI: {paper.doi}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-text-primary">
                    {paper.authors || "N/A"}
                  </td>
                  <td className="py-4 px-4 text-sm text-text-primary">
                    {paper.publicationYear || "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <FiDatabase className="w-4 h-4 text-accent" />
                      <span className="text-sm text-text-primary">
                        {paper.source || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-text-primary">
                    {paper.journal || "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewPaper(paper)}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors"
                        title="View paper details"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>

                      {/* Manual Deduplication Action */}
                      <button
                        onClick={() => onMarkAsDuplicate(paper)}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-warning transition-colors hover:bg-warning/10 hover:text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/30 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                        title="Mark as duplicate"
                        disabled={!canEdit}
                      >
                        <Ban className="w-4 h-4" />
                      </button>

                      <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors">
                        <FiMoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <div className="text-sm text-text-secondary">
              Showing {(readyPapersPage - 1) * 20 + 1}-
              {Math.min(readyPapersPage * 20, readyPapersTotalCount)} of{" "}
              {readyPapersTotalCount.toLocaleString()} records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!readyPapersHasPrev || readyPapersLoading}
                onClick={onPreviousPage}
              >
                Previous
              </Button>
              <span className="text-sm text-text-secondary px-2">
                Page {readyPapersPage} of {readyPapersTotalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!readyPapersHasNext || readyPapersLoading}
                onClick={onNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<FiFileText className="h-16 w-16 text-text-secondary" />}
          title="No Ready Papers Found"
          description={
            hasFilters
              ? "No papers match your current filters. Try adjusting your search criteria."
              : "No ready papers are currently available. This may be because they are pending deduplication or have already been added to the snapshot."
          }
          actionLabel={hasFilters ? "Clear Filters" : "Go to Dataset"}
          onAction={() => {
            if (hasFilters) {
              onClearFilters();
            } else {
              onChangeTab("dataset");
            }
          }}
        />
      )}
    </div>
  );
}
