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

const ICON_TONE: Record<string, string> = {
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
    <article className="flex min-h-[220px] flex-1 flex-col rounded-xl border border-border/70 bg-surface-white p-4 transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary/30 hover:bg-bg-secondary/20 hover:shadow-sm sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_TONE[phase.status]}`}>
          {phase.status === "Locked" ? (
            <FiLock className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Icon className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold leading-5 text-text-primary">{phase.name}</h4>
          <div className="mt-1.5">
            <PhaseStatusBadge status={phase.status} />
          </div>
        </div>
      </div>

      {phase.status === "Locked" && phase.lockReason ? (
        <p className="mt-3 text-xs leading-5 text-text-secondary">{phase.lockReason}</p>
      ) : phase.stats.length > 0 ? (
        <PhaseStatistics stats={phase.stats} status={phase.status} />
      ) : (
        <p className="mt-3 text-xs text-text-secondary">No activity recorded yet.</p>
      )}

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
    </article>
  );
}
