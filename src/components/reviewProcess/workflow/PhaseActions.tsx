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

const actionBase = "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

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
  const [confirmAction, setConfirmAction] = useState<"complete" | "reopen" | null>(null);
  if (status === "Locked") return null;

  const showReopen = canManageActions && status === "Completed" && onReopen;
  const actions = (
    <div className="mt-auto flex flex-wrap gap-2 pt-4">
      {canManageActions && status === "NotStarted" && onStart && (
        <button
          onClick={onStart}
          disabled={startLoading || disabled}
          title={disabled ? "Start the review process first" : undefined}
          className={`${actionBase} border-primary/20 bg-primary/5 text-primary hover:border-primary/40 hover:bg-primary/10`}
        >
          <FiPlay className="h-3.5 w-3.5" aria-hidden="true" />
          {startLoading ? "Starting…" : "Start phase"}
        </button>
      )}

      {status === "InProgress" && onOpen && (
        <button
          onClick={onOpen}
          disabled={disabled}
          title={disabled ? "Start the review process first" : undefined}
          className={`${actionBase} border-primary bg-primary text-text-on-primary hover:bg-primary-hover`}
        >
          <FiExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Open workspace
        </button>
      )}
      {status === "InProgress" && canManageActions && onComplete && (
        <button
          onClick={() => setConfirmAction("complete")}
          disabled={completeLoading || disabled}
          className={`${actionBase} border-border bg-surface-white text-text-secondary hover:bg-bg-secondary hover:text-text-primary`}
        >
          <FiCheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {completeLoading ? "Saving…" : "Complete"}
        </button>
      )}

      {status === "Completed" && onOpen && (
        <button
          onClick={onOpen}
          className={`${actionBase} border-border bg-surface-white text-text-secondary hover:bg-bg-secondary hover:text-text-primary`}
        >
          <FiEye className="h-3.5 w-3.5" aria-hidden="true" />
          View results
        </button>
      )}
      {showReopen && (
        <button
          onClick={() => setConfirmAction("reopen")}
          disabled={reopenLoading || disabled}
          className={`${actionBase} border-border bg-surface-white text-text-secondary hover:bg-bg-secondary hover:text-text-primary`}
        >
          <FiRotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {reopenLoading ? "Reopening…" : "Reopen"}
        </button>
      )}
    </div>
  );

  return (
    <>
      {actions}
      <ConfirmModal
        isOpen={confirmAction === "complete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { setConfirmAction(null); onComplete?.(); }}
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
        onConfirm={() => { setConfirmAction(null); onReopen?.(); }}
        title="Reopen Phase?"
        message="Are you sure you want to reopen this phase? This will mark it as in-progress again."
        confirmText="Reopen"
        cancelText="Cancel"
        isLoading={reopenLoading}
        variant="warning"
      />
    </>
  );
}
