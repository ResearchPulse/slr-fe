import { useState } from "react";
import {
  FiPlay,
  FiCheckCircle,
  FiExternalLink,
  FiEye,
  FiRotateCcw,
} from "react-icons/fi";
import ConfirmModal from "../../ui/ConfirmModal";
import type { PhaseStatusType } from "./types";

interface PhaseActionsProps {
  status: PhaseStatusType;
  phaseKey: string;
  onStart?: () => void;
  onComplete?: () => void;
  onOpen?: () => void;
  onReopen?: () => void;
  canManageActions?: boolean;
  startLoading?: boolean;
  completeLoading?: boolean;
  reopenLoading?: boolean;
  disabled?: boolean;
}

export default function PhaseActions({
  status,
  onStart,
  onComplete,
  onOpen,
  onReopen,
  canManageActions = true,
  startLoading = false,
  completeLoading = false,
  reopenLoading = false,
  disabled = false,
}: PhaseActionsProps) {
  const [confirmAction, setConfirmAction] = useState<
    "complete" | "reopen" | null
  >(null);

  const handleCompleteClick = () => {
    setConfirmAction("complete");
  };

  const handleCompleteConfirm = () => {
    setConfirmAction(null);
    onComplete?.();
  };

  const handleReopenClick = () => {
    setConfirmAction("reopen");
  };

  const handleReopenConfirm = () => {
    setConfirmAction(null);
    onReopen?.();
  };

  if (status === "Locked") return null;

  const showReopen = canManageActions && status === "Completed" && onReopen;

  return (
    <div className="mt-auto w-full pt-4">
      <div className="flex w-full flex-col items-stretch gap-2">
      {canManageActions && status === "NotStarted" && onStart && (
        <button
          onClick={onStart}
          disabled={startLoading || disabled}
          className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-text-on-primary transition-colors hover:bg-primary-hover hover:border-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiPlay className="w-3.5 h-3.5" />
          {startLoading ? "Starting..." : "Start module"}
        </button>
      )}

      {status === "InProgress" && (
        <>
          {onOpen && (
            <button
              onClick={onOpen}
              disabled={disabled}
              className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-text-on-primary transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiExternalLink className="w-3.5 h-3.5" />
              Open Workspace
            </button>
          )}
          {canManageActions && onComplete && (
            <button
              onClick={handleCompleteClick}
              disabled={completeLoading || disabled}
              className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-white px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-success/30 hover:bg-success/5 hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiCheckCircle className="w-3.5 h-3.5" />
              {completeLoading ? "Completing..." : "Mark complete"}
            </button>
          )}
        </>
      )}

      {status === "Completed" && (
        <>
          {onOpen && (
            <button
              onClick={onOpen}
              disabled={disabled}
              className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-white px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiEye className="w-3.5 h-3.5" />
              View Results
            </button>
          )}

          {showReopen && (
            <button
              onClick={handleReopenClick}
              disabled={reopenLoading || disabled}
              className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-white px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-warning/30 hover:bg-warning/5 hover:text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              {reopenLoading ? "Reopening..." : "Reopen module"}
            </button>
          )}
        </>
      )}

      </div>

      <ConfirmModal
        isOpen={confirmAction === "complete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleCompleteConfirm}
        title="Mark module complete?"
        message="Are you sure you want to mark this module as complete? You can reopen it later if needed."
        confirmText="Complete"
        cancelText="Cancel"
        isLoading={completeLoading}
        variant="info"
      />

      <ConfirmModal
        isOpen={confirmAction === "reopen"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleReopenConfirm}
        title="Reopen module?"
        message="Are you sure you want to reopen this module? This will mark it as in progress again."
        confirmText="Reopen"
        cancelText="Cancel"
        isLoading={reopenLoading}
        variant="warning"
      />
    </div>
  );
}
