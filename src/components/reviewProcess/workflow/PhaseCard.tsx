import type { IconType } from "react-icons";
import { FiLock } from "react-icons/fi";
import PhaseStatusBadge from "./PhaseStatusBadge";
import PhaseStatistics from "./PhaseStatistics";
import PhaseActions from "./PhaseActions";
import type { WorkflowPhase } from "./types";

interface PhaseCardProps {
  phase: WorkflowPhase;
  icon: IconType;
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

const CARD_STYLES: Record<string, string> = {
  Completed: "border-success/20 bg-success/5",
  InProgress: "border-primary/35 bg-primary-light/50 shadow-sm ring-1 ring-primary/10",
  NotStarted: "border-border bg-surface-white",
  Locked: "border-border bg-bg-primary/80 opacity-70",
};

const ICON_BG: Record<string, string> = {
  Completed: "bg-success/10 text-success",
  InProgress: "bg-primary-light text-primary",
  NotStarted: "bg-bg-secondary text-text-secondary",
  Locked: "bg-bg-secondary text-text-secondary",
};

export default function PhaseCard({
  phase,
  icon: Icon,
  onStart,
  onComplete,
  onOpen,
  onReopen,
  canManageActions = true,
  startLoading,
  completeLoading,
  reopenLoading,
  disabled = false,
}: PhaseCardProps) {
  return (
    <div
      className={`relative flex w-60 min-w-[200px] max-w-60 flex-col rounded-xl border p-4 transition-[border-color,box-shadow,background-color] duration-200 print:break-inside-avoid ${CARD_STYLES[phase.status]}`}
    >
      {/* Header: Icon + Name + Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex min-w-0 items-center gap-2.5">
          <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_BG[phase.status]}`}
          >
            {phase.status === "Locked" ? (
              <FiLock className="w-4 h-4" />
            ) : (
              <Icon className="w-4.5 h-4.5" />
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-text-primary">
            {phase.name}
          </h3>
        </div>
      </div>

      {/* Status Badge */}
      <PhaseStatusBadge status={phase.status} />

      {/* Lock Reason */}
      {phase.status === "Locked" && phase.lockReason && (
        <p className="mt-2 text-xs leading-5 text-text-secondary">
          {phase.lockReason}
        </p>
      )}

      {/* Statistics */}
      <PhaseStatistics stats={phase.stats} status={phase.status} />

      {/* Actions */}
      <PhaseActions
        status={phase.status}
        phaseKey={phase.key}
        onStart={onStart}
        onComplete={onComplete}
        onOpen={onOpen}
        onReopen={onReopen}
        canManageActions={canManageActions}
        startLoading={startLoading}
        completeLoading={completeLoading}
        reopenLoading={reopenLoading}
        disabled={disabled}
      />
    </div>
  );
}
