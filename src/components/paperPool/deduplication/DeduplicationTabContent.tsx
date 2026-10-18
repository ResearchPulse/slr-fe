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
  onRunDeduplication?: () => void;
  isRunningDeduplication?: boolean;
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
  onRunDeduplication,
  isRunningDeduplication = false,
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
  const totalCount = duplicatePairs.length;

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
    <div ref={containerRef} className="flex min-h-[460px] flex-col">
      {/* Loading state */}
      {isLoading && duplicatePairs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <FiRefreshCw className="w-8 h-8 text-accent animate-spin mb-3" />
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
          <FiAlertTriangle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-text-primary font-medium">
            Failed to load duplicate pairs
          </p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          {onRefetch && (
            <button
              onClick={onRefetch}
              className="mt-4 px-4 py-2 text-sm font-medium text-accent bg-primary-light rounded-xl hover:bg-accent/10 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Main content (only when not loading initial and no error) */}
      {!isLoading && !error && (
        <>
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-text-primary sm:text-lg">
                Duplicate review queue
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Compare flagged papers and record a decision for each pair.
              </p>
            </div>
            <dl className="flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2">
                <dt className="text-text-secondary">Total</dt>
                <dd className="font-semibold tabular-nums text-text-primary">{totalCount}</dd>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2">
                <dt className="text-warning">Pending</dt>
                <dd className="font-semibold tabular-nums text-warning">{unresolvedCount}</dd>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
                <dt className="text-success">Resolved</dt>
                <dd className="font-semibold tabular-nums text-success">{resolvedCount}</dd>
              </div>
            </dl>
          </div>

          {/* Progress Banner (always visible when pairs exist) */}
          {duplicatePairs.length > 0 && (
            <DeduplicationProgressBanner
              duplicatePairs={duplicatePairs}
              pendingCount={pendingDuplicates.length}
              resolvedCount={resolvedCount}
              sessionStartTime={sessionStartTime}
              sessionResolvedCount={sessionResolvedCount}
              onRunDeduplication={onRunDeduplication}
              isRunningDeduplication={isRunningDeduplication}
              canEdit={canEdit}
            />
          )}

          {duplicatePairs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel: Queue */}
              <DuplicateQueuePanel
                duplicatePairs={duplicatePairs}
                selectedPair={selectedDuplicate}
                onSelectPair={onSelectDuplicate}
              />

              {/* Right Panel: Comparison */}
              {selectedDuplicate ? (
                <div className="lg:col-span-2">
                  <div className="bg-surface-white border border-border rounded-xl p-6">
                    {/* Header with undo */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-text-primary">
                          Compare & Resolve
                        </h3>
                        {selectedConfidence && (
                          <div className="mt-1.5">
                            <p className="text-xs text-text-secondary">
                              Similarity: {selectedDuplicate.similarityScore}% -{" "}
                              <span
                                className={
                                  selectedConfidence === "high"
                                    ? "text-red-600"
                                    : selectedConfidence === "medium"
                                      ? "text-orange-600"
                                      : "text-yellow-600"
                                }
                              >
                                {selectedConfidence === "high"
                                  ? "Very Likely Duplicate"
                                  : selectedConfidence === "medium"
                                    ? "Probable Duplicate"
                                    : "Possible Duplicate"}
                              </span>
                            </p>
                            <p className="text-xs text-text-secondary mt-0.5">
                              Method:{" "}
                              {selectedDuplicate.methodText || "Not available"}
                            </p>
                            <p className="text-xs text-text-secondary mt-0.5">
                              Notes:{" "}
                              {selectedDuplicate.deduplicationNotes ||
                                "No notes"}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-6">
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

                    {/* Low-similarity warning */}
                    {selectedDuplicate.similarityScore <
                      SIMILARITY_THRESHOLDS.LOW_WARNING && (
                      <div className="flex items-start gap-2 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <FiAlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">
                          Low similarity score (
                          {selectedDuplicate.similarityScore}%). These papers
                          may not be true duplicates. Review carefully before
                          confirming.
                        </p>
                      </div>
                    )}

                    {/* Confirmation overlay */}
                    {confirmingDecision && (
                      <div className="mb-4 p-4 bg-surface-white border-2 border-border rounded-xl">
                        <div className="flex items-start gap-3">
                          <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">
                              Confirm duplicate removal for low-similarity pair
                            </p>
                            <p className="text-xs text-red-600 mt-1">
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
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
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
                        labelColor="text-purple-600"
                        paper={selectedDuplicate.duplicatePaper}
                        otherPaper={selectedDuplicate.originalPaper}
                        isResolved={selectedDuplicate.status === "resolved"}
                        side="duplicate"
                        resolvedDecision={selectedDuplicate.resolvedDecision}
                        showDiffs={showDiffs}
                      />
                    </div>

                    {/* Decision Controls */}
                    <div className="border-t border-border pt-6">
                      <p className="text-sm text-text-secondary text-center mb-4">
                        Do these papers represent the same study?
                      </p>
                      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4">
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
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-text-secondary">
                        <span>Shortcuts:</span>
                        <kbd className="px-2 py-1 bg-bg-secondary border border-border rounded font-mono">
                          1
                        </kbd>
                        <span>Keep Both</span>
                        <kbd className="px-2 py-1 bg-bg-secondary border border-border rounded font-mono">
                          2
                        </kbd>
                        <span>Cancel</span>
                        <span className="mx-1 text-gray-300">|</span>
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
                </div>
              ) : (
                // No pair selected placeholder
              <div className="lg:col-span-2 flex min-h-[420px] items-center justify-center rounded-lg bg-bg-primary px-6 py-10 sm:px-10">
                  <div className="text-center">
                    <FiLayers className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                    <p className="text-text-secondary font-medium">
                      Select a duplicate pair to compare
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
            <div className="flex min-h-[420px] flex-col items-center justify-center px-5 py-12 text-center sm:px-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-accent">
                <Check size={25} strokeWidth={2.25} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary sm:text-xl">
                No duplicate pairs to review
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                {canEdit
                  ? "Run a duplicate check to compare imported papers. Any matching pairs will appear here."
                  : "There are no duplicate pairs in the review queue right now."}
              </p>
              {canEdit && onRunDeduplication && (
                <Button
                  onClick={onRunDeduplication}
                  isLoading={isRunningDeduplication}
                  className="mt-6 normal-case tracking-normal"
                >
                  <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
                  Run duplicate check
                </Button>
              )}
              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-border pt-4 text-xs text-text-secondary">
                <span>Matches by DOI</span>
                <span>Matches by normalized title</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
