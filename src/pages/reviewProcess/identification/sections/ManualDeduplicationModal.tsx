import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import {
  FiSearch,
  FiAlertTriangle,
  FiInfo,
  FiArrowRight,
} from "react-icons/fi";
import { useUniquePapers } from "../../../../hooks/useUniquePapers";
import type { PaperResponse } from "../../../../types/paper";
import PaperComparisonCard from "../../../../components/paperPool/deduplication/PaperComparisonCard";
import { useDebounce } from "../../../../hooks/useDebounce";
import Switch from "../../../../components/ui/Switch";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

interface ManualDeduplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePaper: PaperResponse | null;
  identificationProcessId: string;
  onConfirm: (originalPaperId: string, reason?: string) => Promise<void>;
}

export default function ManualDeduplicationModal({
  isOpen,
  onClose,
  sourcePaper,
  identificationProcessId,
  onConfirm,
}: ManualDeduplicationModalProps) {
  const [step, setStep] = useState<"search" | "compare">("search");
  const [selectedOriginal, setSelectedOriginal] =
    useState<PaperResponse | null>(null);
  const [reason, setReason] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showDiffs, setShowDiffs] = useState(true);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const {
    papers: searchResults,
    loading: searchLoading,
    pageNumber,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    setSearch,
  } = useUniquePapers({
    identificationProcessId,
    pageSize: 5,
    autoFetch: isOpen && step === "search",
  });

  useEffect(() => {
    if (debouncedSearch !== undefined) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, setSearch]);

  // Sync scroll refs
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const handleScroll = useCallback(
    (
      source: React.RefObject<HTMLDivElement | null>,
      target: React.RefObject<HTMLDivElement | null>,
    ) => {
      if (!isSyncingRef.current && source.current && target.current) {
        isSyncingRef.current = true;
        target.current.scrollTop = source.current.scrollTop;
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 10);
      }
    },
    [],
  );

  const handleSelectOriginal = (paper: PaperResponse) => {
    setSelectedOriginal(paper);
    setStep("compare");
  };

  const handleConfirm = async () => {
    if (!selectedOriginal) return;
    setIsConfirming(true);
    try {
      await onConfirm(selectedOriginal.id, reason);
      handleReset();
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReset = () => {
    setStep("search");
    setSelectedOriginal(null);
    setSearchInput("");
    setReason("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!sourcePaper) return null;

  const modalFooter = step === "compare" ? (
    <>
      <Button
        variant="secondary"
        onClick={() => setStep("search")}
        disabled={isConfirming}
        className="px-8 rounded-xl font-bold"
      >
        Back to Search
      </Button>
      <Button
        variant="danger"
        onClick={handleConfirm}
        isLoading={isConfirming}
        className="px-10 rounded-xl font-black shadow-xl shadow-error/20"
      >
        Confirm Duplicate
      </Button>
    </>
  ) : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manual Deduplication"
      size={step === "compare" ? "xl" : "lg"}
      description={
        step === "search"
          ? "Search for the original paper to link this duplicate to."
          : "Compare both papers and confirm the duplication."
      }
      footer={modalFooter}
      bodyClassName={step === "compare" ? "p-6 flex flex-col h-[70vh] overflow-hidden" : undefined}
    >
      <div className="flex flex-col h-full min-h-0">
        {step === "search" ? (
          <div className="space-y-6">
            {/* Source Paper Preview */}
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-4" role="status">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-warning/10 p-2">
                  <FiAlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h4 className="line-clamp-1 text-sm font-bold text-warning">
                    Marking as Duplicate: {sourcePaper.title}
                  </h4>
                  <p className="mt-1 text-xs text-text-primary">
                    This paper will be excluded once linked to an original.
                  </p>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search original paper by title or DOI..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-border bg-bg-secondary py-3 pl-12 pr-4 text-base font-medium text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none sm:text-lg"
                autoFocus
              />
            </div>

            {/* Results List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {searchLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <LoadingSpinner size="md" className="mb-4" />
                  <p className="text-text-secondary font-medium">
                    Searching project papers...
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults
                  .filter((p) => p.id !== sourcePaper.id)
                  .map((paper) => (
                    <div
                      key={paper.id}
                      className="group flex items-center justify-between rounded-xl border border-border bg-surface-white p-4 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 motion-reduce:transition-none"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <h5 className="font-bold text-text-primary truncate group-hover:text-accent transition-colors">
                          {paper.title}
                        </h5>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-semibold text-text-secondary">
                            {paper.publicationYear || "N/A"}
                          </span>
                          <span className="text-xs text-text-secondary truncate max-w-[200px]">
                            {paper.authors || "Unknown Authors"}
                          </span>
                          {paper.doi && (
                            <span className="text-xs font-mono text-accent bg-bg-secondary px-2 py-0.5 rounded-xl">
                              {paper.doi}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSelectOriginal(paper)}
                        className="rounded-xl font-bold"
                      >
                        Select <FiArrowRight className="ml-2" />
                      </Button>
                    </div>
                  ))
              ) : searchInput ? (
                <div className="text-center py-12 bg-bg-secondary rounded-xl border border-dashed border-border">
                  <FiInfo className="mx-auto mb-2 h-8 w-8 text-text-secondary" />
                  <p className="text-text-secondary font-medium">
                    No results found for "{searchInput}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary italic">
                  Start typing to find the original paper...
                </div>
              )}
            </div>

            {/* Pagination for results */}
            {searchResults.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-2 border-t border-border">
                <span className="text-xs font-medium text-text-secondary">
                  Page {pageNumber} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous results page"
                    onClick={previousPage}
                    disabled={!hasPreviousPage || searchLoading}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30 disabled:hover:bg-transparent motion-reduce:transition-none"
                  >
                    <FiArrowRight className="rotate-180" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next results page"
                    onClick={nextPage}
                    disabled={!hasNextPage || searchLoading}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30 disabled:hover:bg-transparent motion-reduce:transition-none"
                  >
                    <FiArrowRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col grow gap-6 overflow-hidden min-h-0">
            {/* Warning Banner & Toggle */}
            <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-error/20 bg-error/5 p-3" role="alert">
              <div className="flex items-center gap-3">
                <FiAlertTriangle className="h-5 w-5 shrink-0 text-error" />
                <p className="text-xs font-medium text-error">
                  Warning: Marking this paper as a duplicate will exclude it
                  from the final screening snapshot.
                </p>
              </div>
              <Switch
                checked={showDiffs}
                onChange={setShowDiffs}
                label="Highlight differences"
                className="scale-90"
              />
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-2 gap-6 min-h-0 grow">
              {/* Original Paper (Keep) */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">
                    Original Paper (Keep)
                  </h4>
                </div>
                <div
                  ref={leftScrollRef}
                  onScroll={() => handleScroll(leftScrollRef, rightScrollRef)}
                  className="grow overflow-y-auto pr-2 custom-scrollbar"
                >
                  <PaperComparisonCard
                    label="SELECTED ORIGINAL"
                    labelColor="text-success"
                    paper={{
                      id: selectedOriginal!.id,
                      title: selectedOriginal!.title,
                      authors: selectedOriginal!.authors || "N/A",
                      year:
                        selectedOriginal!.publicationYear?.toString() || "N/A",
                      doi: selectedOriginal!.doi || undefined,
                      source: selectedOriginal!.source || "N/A",
                      abstract:
                        selectedOriginal!.abstract || "No abstract available",
                    }}
                    otherPaper={{
                      id: sourcePaper.id,
                      title: sourcePaper.title,
                      authors: sourcePaper.authors || "N/A",
                      year: sourcePaper.publicationYear?.toString() || "N/A",
                      doi: sourcePaper.doi || undefined,
                      source: sourcePaper.source || "N/A",
                      abstract: sourcePaper.abstract || "No abstract available",
                    }}
                    isResolved={false}
                    side="original"
                    showDiffs={showDiffs}
                  />
                </div>
              </div>

              {/* Potential Duplicate (Remove) */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-error" />
                  <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">
                    Potential Duplicate (Remove)
                  </h4>
                </div>
                <div
                  ref={rightScrollRef}
                  onScroll={() => handleScroll(rightScrollRef, leftScrollRef)}
                  className="grow overflow-y-auto pr-2 custom-scrollbar"
                >
                  <PaperComparisonCard
                    label="PAPER TO REMOVE"
                    labelColor="text-error"
                    paper={{
                      id: sourcePaper.id,
                      title: sourcePaper.title,
                      authors: sourcePaper.authors || "N/A",
                      year: sourcePaper.publicationYear?.toString() || "N/A",
                      doi: sourcePaper.doi || undefined,
                      source: sourcePaper.source || "N/A",
                      abstract: sourcePaper.abstract || "No abstract available",
                    }}
                    otherPaper={{
                      id: selectedOriginal!.id,
                      title: selectedOriginal!.title,
                      authors: selectedOriginal!.authors || "N/A",
                      year:
                        selectedOriginal!.publicationYear?.toString() || "N/A",
                      doi: selectedOriginal!.doi || undefined,
                      source: selectedOriginal!.source || "N/A",
                      abstract:
                        selectedOriginal!.abstract || "No abstract available",
                    }}
                    isResolved={false}
                    side="duplicate"
                    showDiffs={showDiffs}
                  />
                </div>
              </div>
            </div>

            {/* Deduplication Reason */}
            <div className="space-y-2 pt-6 border-t border-border shrink-0">
              <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">
                Reason for Manual Deduplication
              </label>
              <textarea
                placeholder="E.g., Same study, different title translation or corrected authors list."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-20 w-full resize-none rounded-xl border border-border bg-bg-secondary p-4 text-sm font-medium text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
