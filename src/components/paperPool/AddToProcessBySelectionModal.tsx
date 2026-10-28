import { useState, useMemo } from "react";
import { FiLayers, FiCheckCircle } from "react-icons/fi";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import type { ProcessSnapshot, SelectionInsertResult } from "./types";
import ReviewProcessCard from "./ReviewProcessCard";

interface AddToProcessBySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  processSnapshots: ProcessSnapshot[];
  selectedPaperIds: string[];
  onAddSelected: (processId: string) => Promise<void>;
  onNavigateToProcess?: (processId: string) => void;
  isAdding: boolean;
  insertResult: SelectionInsertResult | null;
  isLeader?: boolean;
}

export default function AddToProcessBySelectionModal({
  isOpen,
  onClose,
  processSnapshots,
  selectedPaperIds,
  onAddSelected,
  onNavigateToProcess,
  isAdding,
  insertResult,
  isLeader = false,
}: AddToProcessBySelectionModalProps) {
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(
    null,
  );

  const selectedProcess = useMemo(
    () => processSnapshots.find((p) => p.processId === selectedProcessId),
    [processSnapshots, selectedProcessId],
  );

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedProcessId) return;
    await onAddSelected(selectedProcessId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={insertResult ? "Transfer complete" : "Add papers to a process"}
      description={
        insertResult
          ? "Your selected papers have been processed."
          : "Choose a review process for the selected papers."
      }
      size="lg"
      className="max-w-2xl"
      bodyClassName="p-5 sm:p-6"
      footer={
        insertResult ? (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (onNavigateToProcess && selectedProcessId) {
                  onNavigateToProcess(selectedProcessId);
                }
                onClose();
              }}
            >
              View process
            </Button>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={isAdding}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              isLoading={isAdding}
              disabled={!selectedProcessId || selectedPaperIds.length === 0}
            >
              Add selected papers
            </Button>
          </>
        )
      }
    >
      {insertResult ? (
        <div className="mx-auto flex w-full max-w-lg flex-col items-center py-2 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <FiCheckCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
            Papers added successfully
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
            The selected papers were added to{" "}
            <span className="font-semibold text-primary">
              {selectedProcess?.processName || "your review process"}
            </span>
            .
          </p>

          <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border border-border bg-bg-primary p-4 sm:p-5">
              <div className="text-xs font-medium text-text-secondary">Added</div>
              <div className="mt-1 text-3xl font-semibold tabular-nums text-success">
                {insertResult.inserted}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                {insertResult.inserted === 1 ? "paper" : "papers"} added
              </div>
            </div>
            <div className="rounded-xl border border-border bg-bg-primary p-4 sm:p-5">
              <div className="text-xs font-medium text-text-secondary">Skipped</div>
              <div
                className={`mt-1 text-3xl font-semibold tabular-nums ${insertResult.skippedAsDuplicate > 0 ? "text-warning" : "text-text-primary"}`}
              >
                {insertResult.skippedAsDuplicate}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                {insertResult.skippedAsDuplicate === 1
                  ? "duplicate paper"
                  : "duplicate papers"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Destination process
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Select where you want to continue the review.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
              {processSnapshots.length} available
            </span>
          </div>

          <div className="grid max-h-[min(52vh,420px)] grid-cols-1 gap-3 overflow-y-auto pr-1 custom-scrollbar">
            {processSnapshots.map((process) => (
              <ReviewProcessCard
                key={process.processId}
                process={process}
                isSelected={selectedProcessId === process.processId}
                onSelect={setSelectedProcessId}
                onNavigate={onNavigateToProcess}
                isLeader={isLeader}
                className="cursor-pointer"
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/15 bg-primary-light px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3 text-primary">
              <FiLayers className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold">Selected papers</div>
                <div className="text-xs text-text-secondary">
                  Ready to add to the process
                </div>
              </div>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-primary">
              {selectedPaperIds.length}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
