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
    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
      {canManageActions && status === "NotStarted" && onStart && (
        <button
          onClick={onStart}
          disabled={startLoading || disabled}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-3 py-2 text-sm font-semibold text-text-on-primary shadow-sm transition-colors hover:bg-primary-hover hover:border-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiPlay className="w-3.5 h-3.5" />
          {startLoading ? "Starting..." : "Start Phase"}
        </button>
      )}

      {status === "InProgress" && (
        <>
          {onOpen && (
            <button
              onClick={onOpen}
              disabled={disabled}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-3 py-2 text-sm font-semibold text-text-on-primary shadow-sm transition-colors hover:border-primary-hover hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiExternalLink className="w-3.5 h-3.5" />
              Open Workspace
            </button>
          )}
          {canManageActions && onComplete && (
            <button
              onClick={handleCompleteClick}
              disabled={completeLoading || disabled}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-success/35 bg-success/10 px-3 py-2 text-sm font-semibold text-success transition-colors hover:border-success/50 hover:bg-success/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiCheckCircle className="w-3.5 h-3.5" />
              {completeLoading ? "Completing..." : "Complete Phase"}
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
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-white px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-text-muted hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiEye className="w-3.5 h-3.5" />
              View Results
            </button>
          )}

          {showReopen && (
            <button
              onClick={handleReopenClick}
              disabled={reopenLoading || disabled}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-warning/40 bg-warning/15 px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-warning/60 hover:bg-warning/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              {reopenLoading ? "Reopening..." : "Reopen Phase"}
            </button>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={confirmAction === "complete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleCompleteConfirm}
        title="Complete Phase?"
        message="Are you sure you want to mark this phase as complete? You can reopen it later if needed."
        confirmText="Complete"
        cancelText="Cancel"
        isLoading={completeLoading}
        variant="info"
      />

      <ConfirmModal
        isOpen={confirmAction === "reopen"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleReopenConfirm}
        title="Reopen Phase?"
        message="Are you sure you want to reopen this phase? This will mark it as in-progress again."
        confirmText="Reopen"
        cancelText="Cancel"
        isLoading={reopenLoading}
        variant="warning"
      />
    </div>
  );
}
