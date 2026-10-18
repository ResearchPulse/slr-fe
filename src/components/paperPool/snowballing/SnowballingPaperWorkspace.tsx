import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import Button from "../../ui/Button";
import Pagination from "../../ui/Pagination";
import Select from "../../ui/Select";
import CandidateDetailPanel, { CandidateDetailActions } from "./CandidateDetailPanel";
import CandidateRow from "./CandidateRow";
import FiltersBar from "./FiltersBar";
import { formatAuthors } from "./formatAuthors";
import Modal from "../../ui/Modal";
import {
  usePaperSpecificCandidates,
  useRejectCandidates,
  useSelectCandidates,
} from "../../../hooks/useSnowballCandidates";
import type { PaperWithCandidateDto } from "../../../types/paper";
import { type MockCandidate } from "../../../mocks/snowballingMockData";
import { toastError, toastSuccess } from "../../../utils/toast";
import { getErrorMessage } from "../../../utils/errorUtils";

interface SnowballingPaperWorkspaceProps {
  projectId: string;
  paper: PaperWithCandidateDto;
  onSelectCandidate: (candidate: MockCandidate) => void;
  selectedCandidateId?: string;
  selectedCandidate: MockCandidate | null;
  onCloseDetail: () => void;
  onAction: (id: string, action: "select" | "reject") => Promise<void>;
  isProcessing: boolean;
}

const SourcePaperSummary: React.FC<{ paper: PaperWithCandidateDto }> = ({ paper }) => {
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);
  const abstract = paper.abstract?.trim() || "No abstract is available for this paper.";
  const canExpandAbstract = abstract.length > 420;

  return (
    <div className="space-y-5 px-5 py-5 sm:px-7 lg:px-6 lg:py-6">
      <section>
        <p className="mb-2 text-xs font-medium text-text-secondary">Source paper</p>
        <h2 className="break-words text-lg font-semibold leading-6 text-text-primary [text-wrap:pretty] xl:text-xl">
          {paper.title || "Untitled paper"}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          {paper.doi ? (
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-accent hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="truncate">DOI: {paper.doi}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
          ) : (
            <span className="text-xs text-text-secondary">DOI unavailable</span>
          )}
        </div>
        <dl className="mt-4 space-y-2 text-sm leading-5 text-text-secondary">
          <div className="flex items-start gap-2">
            <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            <dd className="min-w-0 break-words">{formatAuthors(paper.authors)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            <dd>{paper.publicationYear || "Year unavailable"}</dd>
          </div>
        </dl>
      </section>

      <section className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-text-primary">Abstract</h3>
        <p className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-text-secondary ${canExpandAbstract && !isAbstractExpanded ? "line-clamp-6" : ""}`}>
          {abstract}
        </p>
        {canExpandAbstract && (
          <button
            type="button"
            onClick={() => setIsAbstractExpanded((expanded) => !expanded)}
            aria-expanded={isAbstractExpanded}
            className="mt-2 inline-flex min-h-8 items-center gap-1 text-sm font-medium text-accent hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isAbstractExpanded ? (
              <>Show less <ChevronUp className="h-4 w-4" aria-hidden="true" /></>
            ) : (
              <>Read full abstract <ChevronDown className="h-4 w-4" aria-hidden="true" /></>
            )}
          </button>
        )}
      </section>

      <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <dt className="text-xs text-text-secondary">References</dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-text-primary">{paper.candidateCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-secondary">Suggested</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-base font-semibold tabular-nums text-text-primary">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
            {paper.suggestedCount}
          </dd>
        </div>
      </dl>
    </div>
  );
};

const SnowballingPaperWorkspace: React.FC<SnowballingPaperWorkspaceProps> = ({
  projectId,
  paper,
  onSelectCandidate,
  selectedCandidateId,
  selectedCandidate,
  onCloseDetail,
  onAction,
  isProcessing,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isSourceExpanded, setIsSourceExpanded] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(
    new Set(),
  );

  const {
    data: response,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = usePaperSpecificCandidates(paper.id, {
    searchTerm: searchTerm || undefined,
    status: status === "all" ? undefined : Number.parseInt(status, 10),
    year: year === "all" ? undefined : year,
    pageNumber,
    pageSize,
  });

  const candidates = response?.items || [];
  const totalCandidates = response?.totalCount ?? paper.candidateCount;
  const availableYears = useMemo(
    () =>
      Array.from(
        new Set(
          candidates
            .map((candidate) => candidate.publicationYear)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => b.localeCompare(a)),
    [candidates],
  );
  const hasFilters = Boolean(searchTerm || status !== "all" || year !== "all");

  const selectMutation = useSelectCandidates(projectId);
  const rejectMutation = useRejectCandidates();
  const isMutationPending = selectMutation.isPending || rejectMutation.isPending;

  const selectableCandidates = candidates.filter(
    (candidate) => !candidate.isSelectedInProjectRepository && candidate.statusText !== "Rejected",
  );
  const isAllPageSelected =
    selectableCandidates.length > 0 &&
    selectableCandidates.every((candidate) => bulkSelectedIds.has(candidate.candidateId));
  const isSomePageSelected =
    selectableCandidates.some((candidate) => bulkSelectedIds.has(candidate.candidateId)) &&
    !isAllPageSelected;

  const handleToggleAllOnPage = () => {
    setBulkSelectedIds((current) => {
      const next = new Set(current);
      if (isAllPageSelected) {
        selectableCandidates.forEach((candidate) => next.delete(candidate.candidateId));
      } else {
        selectableCandidates.forEach((candidate) => next.add(candidate.candidateId));
      }
      return next;
    });
  };

  const handleBulkAction = async (action: "select" | "reject") => {
    if (bulkSelectedIds.size === 0) return;
    const ids = Array.from(bulkSelectedIds);
    try {
      if (action === "select") {
        await selectMutation.mutateAsync({ candidateIds: ids });
      } else {
        await rejectMutation.mutateAsync({ candidateIds: ids });
      }
      setBulkSelectedIds(new Set());
      await refetch();
      toastSuccess(`Successfully updated ${ids.length} candidates.`);
    } catch (error) {
      toastError(getErrorMessage(error, "Failed to update candidates."));
    }
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[560px] flex-1 grid-cols-1 lg:grid-cols-[minmax(280px,0.32fr)_minmax(0,0.68fr)]">
        <div className="order-2 space-y-5 border-t border-border p-5 lg:order-1 lg:border-r lg:border-t-0 lg:p-6">
          <div className="h-3 w-24 animate-pulse rounded bg-bg-secondary" />
          <div className="h-7 w-4/5 animate-pulse rounded bg-bg-secondary" />
          <div className="h-20 animate-pulse rounded-lg bg-bg-secondary" />
          <div className="h-32 animate-pulse rounded-lg bg-bg-secondary" />
        </div>
        <div className="order-1 space-y-3 p-3 lg:order-2 lg:p-4">
          <div className="h-10 animate-pulse rounded-xl bg-bg-secondary" />
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse border-b border-border bg-surface-white" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[520px] flex-1 flex-col items-center justify-center bg-surface-white px-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-error">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">Failed to load references</h3>
        <p className="mb-6 mt-2 max-w-md text-sm text-text-secondary">
          We couldn't retrieve the references for this source paper.
        </p>
        <Button onClick={() => void refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[620px] flex-col overflow-hidden bg-surface-white">
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(280px,0.32fr)_minmax(0,0.68fr)] lg:overflow-hidden">
        <aside className="order-2 min-h-0 border-t border-border bg-surface-white lg:order-1 lg:overflow-y-auto lg:border-r lg:border-t-0">
          <button
            type="button"
            onClick={() => setIsSourceExpanded((expanded) => !expanded)}
            aria-expanded={isSourceExpanded}
            className="flex min-h-12 w-full items-center justify-between px-5 text-left text-sm font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent lg:hidden"
          >
            <span className="flex min-w-0 flex-col py-2">
              <span className="text-xs text-text-secondary">Source paper</span>
              <span className="max-w-full truncate font-medium">{paper.title || "Untitled paper"}</span>
            </span>
            {isSourceExpanded ? (
              <ChevronUp className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            )}
          </button>
          <div className={`${isSourceExpanded ? "block" : "hidden"} lg:block`}>
            <SourcePaperSummary paper={paper} />
          </div>
        </aside>

        <section className="order-1 flex min-h-[440px] min-w-0 flex-col bg-surface-white lg:order-2 lg:min-h-0">
          <FiltersBar
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPageNumber(1);
            }}
            status={status}
            onStatusChange={(value) => {
              setStatus(value);
              setPageNumber(1);
            }}
            year={year}
            onYearChange={(value) => {
              setYear(value);
              setPageNumber(1);
            }}
            years={availableYears}
          />

          <div className="min-h-0 flex-1 overflow-y-auto">
            {candidates.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-bg-primary text-text-muted">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-text-primary">
                  {totalCandidates === 0
                    ? "No references extracted yet"
                    : "No references match these filters"}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">
                  {totalCandidates === 0
                    ? "Extract references from the source paper to start reviewing candidates here."
                    : "Try changing the search, status, or year filters."}
                </p>
                {hasFilters && totalCandidates > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setStatus("all");
                      setYear("all");
                      setPageNumber(1);
                    }}
                    className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-accent hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-white px-4 py-2.5 sm:px-5">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      ref={(element) => {
                        if (element) element.indeterminate = isSomePageSelected;
                      }}
                      onChange={handleToggleAllOnPage}
                      aria-label="Select all available references on this page"
                      className="h-4 w-4 rounded border-border accent-accent focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    <span>
                      {bulkSelectedIds.size > 0
                        ? `${bulkSelectedIds.size} selected`
                        : `${candidates.length} shown`}
                    </span>
                  </label>
                  <span className="text-xs tabular-nums text-text-secondary">
                    {totalCandidates} total
                  </span>
                </div>
                <div className="divide-y divide-border px-2 sm:px-4">
                  {candidates.map((candidate) => (
                    <div key={candidate.candidateId}>
                      <CandidateRow
                        candidate={candidate}
                        isSelected={selectedCandidateId === candidate.candidateId}
                        isBulkSelected={bulkSelectedIds.has(candidate.candidateId)}
                        onToggleBulkSelect={(id) => {
                          setBulkSelectedIds((current) => {
                            const next = new Set(current);
                            if (next.has(id)) next.delete(id);
                            else next.add(id);
                            return next;
                          });
                        }}
                        onSelect={onSelectCandidate}
                        onAction={onAction}
                        isProcessing={isProcessing}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {totalCandidates > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-white px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <label htmlFor="snowballing-page-size">Rows</label>
                <Select
                  id="snowballing-page-size"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPageNumber(1);
                  }}
                  className="w-[76px]"
                  options={[
                    { value: "10", label: "10" },
                    { value: "25", label: "25" },
                    { value: "50", label: "50" },
                    { value: "100", label: "100" },
                  ]}
                />
                <span className="hidden sm:inline">
                  Showing {Math.min((pageNumber - 1) * pageSize + 1, totalCandidates)}–
                  {Math.min(pageNumber * pageSize, totalCandidates)} of {totalCandidates}
                </span>
              </div>
              <Pagination
                currentPage={pageNumber}
                totalPages={response?.totalPages || 1}
                onPageChange={setPageNumber}
                disabled={isFetching}
              />
            </div>
          )}
        </section>
      </div>

      {bulkSelectedIds.size > 0 &&
        createPortal(
          <div className="fixed inset-x-4 bottom-5 z-(--z-index-dropdown) flex justify-center sm:inset-x-0">
            <div className="flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-white p-2 shadow-[0_4px_12px_rgba(18,35,49,0.14)] sm:gap-3 sm:px-4">
              <div className="flex flex-col pr-2 sm:pr-3">
                <span className="text-xs text-text-secondary">Selected</span>
                <span className="text-sm font-semibold text-text-primary">
                  {bulkSelectedIds.size} references
                </span>
              </div>
              <div className="h-8 w-px bg-border" />
              <button
                type="button"
                onClick={() => void handleBulkAction("select")}
                disabled={isMutationPending}
                className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 sm:px-4"
              >
                {isMutationPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span>Add to repository</span>
              </button>
              <button
                type="button"
                onClick={() => void handleBulkAction("reject")}
                disabled={isMutationPending}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-error transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:opacity-50 sm:px-4"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkSelectedIds(new Set())}
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                title="Clear selection"
                aria-label="Clear selection"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>,
          document.body,
        )}

      <Modal
        isOpen={!!selectedCandidate}
        onClose={onCloseDetail}
        title="Candidate details"
        size="lg"
        bodyClassName="!p-0"
        footer={
          <CandidateDetailActions
            candidate={selectedCandidate}
            onAction={onAction}
            isProcessing={isProcessing}
          />
        }
      >
        <CandidateDetailPanel
          candidate={selectedCandidate}
          onClose={onCloseDetail}
          onAction={onAction}
          isProcessing={isProcessing}
          isModal
        />
      </Modal>
    </div>
  );
};

export default SnowballingPaperWorkspace;
