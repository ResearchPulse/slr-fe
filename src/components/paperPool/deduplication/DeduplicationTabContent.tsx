// Deduplication Tab Content — Main orchestrator
// Composes: ProgressBanner, QueuePanel, ComparisonCards, keyboard navigation, undo, safety UX

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  FiCheck,
  FiLayers,
  FiAlertTriangle,
  FiCornerUpLeft,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { Check } from "lucide-react";
import Button from "../../ui/Button";
import Switch from "../../ui/Switch";
import DeduplicationProgressBanner from "./DeduplicationProgressBanner";
import DuplicateQueuePanel from "./DuplicateQueuePanel";
import PaperComparisonCard from "./PaperComparisonCard";
import type {
  DuplicatePair,
  DuplicateResolution,
  UndoableResolution,
} from "../../../types/deduplication";
import {
  MAX_UNDO_STACK,
  SIMILARITY_THRESHOLDS,
} from "../../../pages/reviewProcess/identification/constants";
import { useDeduplicationKeyboard } from "../../../pages/reviewProcess/identification/hooks/useDeduplicationKeyboard";
import { getConfidenceLevel } from "../../../pages/reviewProcess/identification/utils";

interface DeduplicationTabContentProps {
  duplicatePairs: DuplicatePair[];
  pendingDuplicates: DuplicatePair[];
  selectedDuplicate?: DuplicatePair | null;
  onSelectDuplicate?: (pair: DuplicatePair | null) => void;
  onResolveDuplicate: (pairId: string, decision: DuplicateResolution) => void;
  /** Whether duplicate pairs are currently loading from the API */
  isLoading?: boolean;
  /** API error message, if any */
  error?: string | null;
  /** Whether a resolve action is in progress */
  isResolving?: boolean;
  /** Refetch duplicate pairs from the API */
  onRefetch?: () => void;
  canEdit?: boolean;
}

export default function DeduplicationTabContent({
  duplicatePairs,
  pendingDuplicates,
  selectedDuplicate: externalSelectedDuplicate,
  onSelectDuplicate: externalOnSelectDuplicate,
  onResolveDuplicate,
  isLoading = false,
  error = null,
  isResolving = false,
  onRefetch,
  canEdit = true,
}: DeduplicationTabContentProps) {
  const [internalSelectedDuplicate, setInternalSelectedDuplicate] =
    useState<DuplicatePair | null>(null);

  // Robust derivation: only use external if it's strictly provided (not undefined)
  const selectedDuplicate =
    externalSelectedDuplicate !== undefined
      ? externalSelectedDuplicate
      : internalSelectedDuplicate;

  const onSelectDuplicate = useCallback(
    (pair: DuplicatePair | null) => {
      if (externalOnSelectDuplicate !== undefined) {
        externalOnSelectDuplicate(pair);
      } else {
        setInternalSelectedDuplicate(pair);
      }
    },
    [externalOnSelectDuplicate],
  );

  // --- Auto-select first pair ---
  useEffect(() => {
    if (!selectedDuplicate && pendingDuplicates.length > 0 && !isLoading) {
      onSelectDuplicate(pendingDuplicates[0]);
    }
  }, [selectedDuplicate, pendingDuplicates, isLoading, onSelectDuplicate]);
  // --- Internal state (does NOT affect parent props contract) ---
  const [undoStack, setUndoStack] = useState<UndoableResolution[]>([]);
  const [showDiffs, setShowDiffs] = useState(true);
  const [confirmingDecision, setConfirmingDecision] =
    useState<DuplicateResolution | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionResolvedCount, setSessionResolvedCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedCount = duplicatePairs.filter(
    (d) => d.status === "resolved",
  ).length;
  const unresolvedCount = pendingDuplicates.length;

  // --- Safety check: low-confidence cancel needs confirmation ---
  const needsConfirmation = useCallback(
    (decision: DuplicateResolution): boolean => {
      if (!selectedDuplicate) return false;
      if (decision === "keep-both") return false; // Keeping both is always safe
      return (
        selectedDuplicate.similarityScore < SIMILARITY_THRESHOLDS.LOW_WARNING
      );
    },
    [selectedDuplicate],
  );

  // --- Core resolve handler with undo, auto-advance, session tracking ---
  const handleResolve = useCallback(
    (decision: DuplicateResolution) => {
      if (!selectedDuplicate) return;

      // Check if confirmation is needed for low-similarity removals
      if (needsConfirmation(decision) && confirmingDecision !== decision) {
        setConfirmingDecision(decision);
        return;
      }

      // Track session timing
      if (!sessionStartTime) {
        setSessionStartTime(Date.now());
      }
      setSessionResolvedCount((prev) => prev + 1);

      // Push to undo stack
      setUndoStack((prev) => {
        const next = [
          ...prev,
          { pairId: selectedDuplicate.id, decision, timestamp: Date.now() },
        ];
        return next.length > MAX_UNDO_STACK
          ? next.slice(-MAX_UNDO_STACK)
          : next;
      });

      // Clear confirmation state
      setConfirmingDecision(null);

      // Execute the resolution
      onResolveDuplicate(selectedDuplicate.id, decision);

      // Auto-advance logic
      const remainingUnresolved = pendingDuplicates.filter(
        (p) => p.id !== selectedDuplicate.id,
      );
      if (remainingUnresolved.length > 0) {
        // Try to find the next one in the current list
        const currentIndex = pendingDuplicates.findIndex(
          (p) => p.id === selectedDuplicate.id,
        );
        const nextIndex = (currentIndex + 1) % pendingDuplicates.length;
        const nextPair = pendingDuplicates[nextIndex] || pendingDuplicates[0];

        // If the next one is the same as current (last one), it will be removed soon anyway,
        // so we pick another one or null.
        if (
          nextPair.id === selectedDuplicate.id &&
          remainingUnresolved.length > 0
        ) {
          onSelectDuplicate(remainingUnresolved[0]);
        } else {
          onSelectDuplicate(nextPair);
        }
      } else {
        onSelectDuplicate(null);
      }
    },
    [
      selectedDuplicate,
      needsConfirmation,
      confirmingDecision,
      sessionStartTime,
      onResolveDuplicate,
      pendingDuplicates,
      onSelectDuplicate,
    ],
  );

  // --- Undo last resolution ---
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    // Find the pair and re-select it
    const pair = duplicatePairs.find((p) => p.id === lastAction.pairId);
    if (pair) {
      onSelectDuplicate(pair);
    }
  }, [undoStack, duplicatePairs, onSelectDuplicate]);

  // --- Cancel confirmation dialog ---
  const handleCancelConfirm = useCallback(() => {
    setConfirmingDecision(null);
  }, []);

  // --- Keyboard navigation ---
  const isComparisonFocused = selectedDuplicate !== null;
  useDeduplicationKeyboard({
    visiblePairs: duplicatePairs,
    selectedPair: selectedDuplicate,
    onSelectPair: onSelectDuplicate,
    onResolve: handleResolve,
    enabled: isComparisonFocused && confirmingDecision === null && canEdit,
  });

  // --- Confidence info for selected pair ---
  const selectedConfidence = useMemo(() => {
    if (!selectedDuplicate) return null;
    return getConfidenceLevel(selectedDuplicate.similarityScore);
  }, [selectedDuplicate]);

  // --- Render ---
  return (
    <div ref={containerRef} className="flex flex-col gap-5">
      {/* Loading state */}
      {isLoading && duplicatePairs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <FiRefreshCw className="w-8 h-8 text-accent motion-safe:animate-spin motion-reduce:animate-none mb-3" />
          <p className="text-text-secondary font-medium">
            Loading duplicate pairs...
          </p>
          <p className="text-sm text-text-secondary mt-1">
            Analyzing imported papers for duplicates
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <FiAlertTriangle className="w-10 h-10 text-error mb-3" />
          <p className="text-text-primary font-medium">
            Failed to load duplicate pairs
          </p>
          <p className="mt-1 text-sm text-error">{error}</p>
          {onRefetch && (
            <button
              onClick={onRefetch}
              className="mt-4 min-h-11 px-4 text-sm font-medium text-accent bg-primary-light rounded-xl hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Main content (only when not loading initial and no error) */}
      {!isLoading && !error && (
        <>
          <DeduplicationProgressBanner
            duplicatePairs={duplicatePairs}
            pendingCount={unresolvedCount}
            resolvedCount={resolvedCount}
            sessionStartTime={sessionStartTime}
            sessionResolvedCount={sessionResolvedCount}
          />

          {duplicatePairs.length > 0 ? (
            <div className="grid min-h-[540px] grid-cols-1 overflow-hidden rounded-xl border border-border bg-surface-white lg:grid-cols-[minmax(280px,0.58fr)_minmax(0,1fr)]">
              {/* Left Panel: Queue */}
              <DuplicateQueuePanel
                duplicatePairs={duplicatePairs}
                selectedPair={selectedDuplicate}
                onSelectPair={onSelectDuplicate}
              />

              {/* Right Panel: Comparison */}
              {selectedDuplicate ? (
                <div className="min-w-0 p-4 sm:p-5 lg:p-6">
                    {/* Header with undo */}
                    <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-text-primary">
                          Compare & Resolve
                        </h3>
                        {selectedConfidence && (
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="text-xs text-text-secondary">
                              Similarity: {selectedDuplicate.similarityScore}% -{" "}
                              <span
                                className={
                                  selectedConfidence === "high"
                                    ? "text-accent"
                                    : selectedConfidence === "medium"
                                      ? "text-warning"
                                      : "text-text-secondary"
                                }
                              >
                                {selectedConfidence === "high"
                                  ? "Very Likely Duplicate"
                                  : selectedConfidence === "medium"
                                    ? "Probable Duplicate"
                                    : "Possible Duplicate"}
                              </span>
                            </p>
                            <p className="text-xs text-text-secondary">
                              Method:{" "}
                              {selectedDuplicate.methodText || "Not available"}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Switch
                          checked={showDiffs}
                          onChange={setShowDiffs}
                          label="Highlight differences"
                        />
                        {undoStack.length > 0 && (
                          <button
                            onClick={handleUndo}
                            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary-hover transition-colors px-3 py-1.5 rounded-xl hover:bg-primary-light"
                            title="Undo last resolution"
                          >
                            <FiCornerUpLeft className="w-4 h-4" />
                            Undo
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedDuplicate.deduplicationNotes && (
                      <p className="mb-4 rounded-lg bg-bg-primary px-3 py-2 text-xs leading-5 text-text-secondary">
                        {selectedDuplicate.deduplicationNotes}
                      </p>
                    )}

                    {/* Low-similarity warning */}
                    {selectedDuplicate.similarityScore <
                      SIMILARITY_THRESHOLDS.LOW_WARNING && (
                      <div className="mb-4 flex items-start gap-2 rounded-lg bg-warning/10 p-3">
                        <FiAlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                        <p className="text-xs text-warning">
                          Low similarity score (
                          {selectedDuplicate.similarityScore}%). These papers
                          may not be true duplicates. Review carefully before
                          confirming.
                        </p>
                      </div>
                    )}

                    {/* Confirmation overlay */}
                    {confirmingDecision && (
                      <div className="mb-4 rounded-lg bg-error/5 p-4">
                        <div className="flex items-start gap-3">
                          <FiAlertTriangle className="w-5 h-5 text-error mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-error">
                              Confirm duplicate removal for low-similarity pair
                            </p>
                            <p className="text-xs text-error mt-1">
                              This pair has a similarity score below{" "}
                              {SIMILARITY_THRESHOLDS.LOW_WARNING}%. Are you sure
                              these papers are duplicates? The flagged paper
                              will be removed from the identification process.
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  handleResolve(confirmingDecision)
                                }
                              >
                                Yes, remove duplicate
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelConfirm}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Side-by-side comparison cards */}
                    <div className="mb-5 grid grid-cols-1 divide-y divide-border xl:grid-cols-2 xl:divide-x xl:divide-y-0">
                      <PaperComparisonCard
                        label="PAPER A"
                        labelColor="text-accent"
                        paper={selectedDuplicate.originalPaper}
                        otherPaper={selectedDuplicate.duplicatePaper}
                        isResolved={selectedDuplicate.status === "resolved"}
                        side="original"
                        resolvedDecision={selectedDuplicate.resolvedDecision}
                        showDiffs={showDiffs}
                      />
                      <PaperComparisonCard
                        label="PAPER B (Flagged)"
                        labelColor="text-primary-hover"
                        paper={selectedDuplicate.duplicatePaper}
                        otherPaper={selectedDuplicate.originalPaper}
                        isResolved={selectedDuplicate.status === "resolved"}
                        side="duplicate"
                        resolvedDecision={selectedDuplicate.resolvedDecision}
                        showDiffs={showDiffs}
                      />
                    </div>

                    {/* Decision Controls */}
                    <div className="border-t border-border pt-4">
                      <p className="mb-3 text-sm text-text-secondary">
                        Do these papers represent the same study?
                      </p>
                      <div className="flex flex-col items-stretch gap-2 sm:flex-row">
                        <Button
                          variant="danger"
                          className="flex-1"
                          onClick={() => handleResolve("cancel")}
                          disabled={
                            selectedDuplicate.status === "resolved" ||
                            isResolving ||
                            !canEdit
                          }
                        >
                          <FiX className="w-4 h-4 mr-2" />
                          Keep only original record
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={() => handleResolve("keep-both")}
                          disabled={
                            selectedDuplicate.status === "resolved" ||
                            isResolving ||
                            !canEdit
                          }
                        >
                          <FiCheck className="w-4 h-4 mr-2" />
                          Keep Both (Not Duplicates)
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                        <span>Shortcuts:</span>
                        <kbd className="px-2 py-1 bg-bg-secondary border border-border rounded font-mono">
                          1
                        </kbd>
                        <span>Keep Both</span>
                        <kbd className="px-2 py-1 bg-bg-secondary border border-border rounded font-mono">
                          2
                        </kbd>
                        <span>Cancel</span>
                        <span className="mx-1 text-text-secondary/50">|</span>
                        <kbd className="px-2 py-1 bg-bg-secondary border border-border rounded font-mono">
                          ↑↓
                        </kbd>
                        <span>Navigate</span>
                        <kbd className="px-2 py-1 bg-bg-secondary border border-border rounded font-mono">
                          N
                        </kbd>
                        <span>Next unresolved</span>
                      </div>
                    </div>
                </div>
              ) : (
                // No pair selected placeholder
              <div className="flex min-h-[360px] items-center justify-center border-t border-border bg-bg-primary/50 px-6 py-10 lg:min-h-0 lg:border-l lg:border-t-0 sm:px-10">
                  <div className="max-w-sm text-center">
                    <FiLayers className="mx-auto mb-3 h-9 w-9 text-accent/70" />
                    <p className="text-text-secondary font-medium">
                      Select a duplicate pair to review
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      Use ↑↓ keys or click a pair in the queue to begin
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Empty state: no duplicates at all
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-border bg-surface-white px-5 py-10 text-center sm:px-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-accent">
                <Check size={25} strokeWidth={2.25} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary sm:text-xl">
                No duplicate pairs to review
              </h3>
              <p className="mt-1.5 max-w-md text-sm leading-6 text-text-secondary">
                {canEdit
                  ? "No matching records were found. Run a duplicate check again after adding or updating papers."
                  : "There are no duplicate pairs in the review queue right now."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
