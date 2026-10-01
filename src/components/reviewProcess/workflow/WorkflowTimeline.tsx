import { FiChevronRight, FiLock, FiFileText } from "react-icons/fi";
import PhaseCard from "./PhaseCard";
import { WORKFLOW_PHASES } from "./constants";
import type { WorkflowPhase, ProcessPaperStats } from "./types";

interface WorkflowTimelineProps {
  phases: WorkflowPhase[];
  paperStats?: ProcessPaperStats;
  onStartPhase?: (phaseKey: string) => void;
  onCompletePhase?: (phaseKey: string) => void;
  onOpenPhase?: (phaseKey: string) => void;
  onReopenPhase?: (phaseKey: string) => void;
  onAddPapers?: () => void;
  canManageActions?: boolean;
  /** Map of phaseKey to loading state for start action */
  startLoadingMap?: Record<string, boolean>;
  /** Map of phaseKey to loading state for complete action */
  completeLoadingMap?: Record<string, boolean>;
  /** Map of phaseKey to loading state for reopen action */
  reopenLoadingMap?: Record<string, boolean>;
  disabled?: boolean;
  isStudySelectionCompleted?: boolean;
}

const CONNECTOR_COLORS: Record<string, string> = {
  completed: "text-success",
  active: "text-primary",
  default: "text-text-muted",
};

function getConnectorColor(currentStatus: string, nextStatus: string): string {
  if (currentStatus === "Completed" && nextStatus !== "Locked") {
    return CONNECTOR_COLORS.completed;
  }
  if (currentStatus === "InProgress" || nextStatus === "InProgress") {
    return CONNECTOR_COLORS.active;
  }
  return CONNECTOR_COLORS.default;
}

export default function WorkflowTimeline({
  phases,
  paperStats,
  onStartPhase,
  onCompletePhase,
  onOpenPhase,
  onReopenPhase,
  canManageActions = true,
  startLoadingMap = {},
  completeLoadingMap = {},
  reopenLoadingMap = {},
  disabled = false,
}: WorkflowTimelineProps) {
  const activePhases = phases.filter((phase) => phase.key !== "identification");
  const completedCount = activePhases.filter(
    (phase) => phase.status === "Completed",
  ).length;
  const totalActivePhases = activePhases.length || 1;
  const progressPercent = Math.round((completedCount / totalActivePhases) * 100);
  const hasPapers = (paperStats?.total ?? 0) > 0;

  return (
    <section className="relative mb-8 rounded-2xl border border-border bg-surface-white p-5 shadow-sm sm:p-7 lg:p-8">
      {disabled && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-surface-white/75 p-4 backdrop-blur-[2px]">
          <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-surface-white px-6 py-5 text-center shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning/10 text-warning">
              <FiLock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                Workflow locked
              </h3>
              <p className="mt-1 text-sm leading-5 text-text-secondary">
                Start the review process to begin tracking progress across phases.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
              Review workflow
            </h2>
            <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-semibold text-primary">
              PRISMA 2020
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-5 text-text-secondary">
            Track your systematic review progress across each phase.
          </p>
        </div>

        <div className="w-full md:max-w-xs">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-text-secondary">Overall progress</span>
            <span className="font-semibold tabular-nums text-primary">
              {progressPercent}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-bg-secondary"
            role="progressbar"
            aria-label="Overall workflow progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs text-text-muted">
            {completedCount} of {totalActivePhases} phases completed
          </p>
        </div>
      </div>

      <div className="mb-7 rounded-xl border border-border bg-bg-primary p-4 sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center gap-3 lg:min-w-56 lg:border-r lg:border-border lg:pr-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-white text-primary">
              <FiFileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-semibold leading-none tabular-nums text-text-primary">
                {paperStats?.total ?? 0}
              </div>
              <div className="mt-1 text-xs text-text-secondary">Papers in review</div>
            </div>
          </div>

          {hasPapers ? (
            <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
              <HorizontalStat label="Not screened" value={paperStats?.notScreened} color="bg-text-muted" />
              <HorizontalStat label="In screening" value={paperStats?.screening} color="bg-warning" />
              <HorizontalStat label="Included" value={paperStats?.included} color="bg-success" />
              <HorizontalStat label="Excluded" value={paperStats?.excluded} color="bg-error" />
            </div>
          ) : (
            <div className="flex-1 rounded-xl border border-dashed border-border bg-surface-white px-4 py-4">
              <h3 className="text-sm font-semibold text-text-primary">
                No papers have been added yet
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Add papers from the project pool to start your review.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-text-muted">Phase progression</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="min-w-0">
        <div className="flex items-stretch gap-3 overflow-x-auto pb-3">
          {activePhases.map((phase, index) => {
            const definition = WORKFLOW_PHASES.find((item) => item.key === phase.key);
            if (!definition) return null;

            const isLast = index === activePhases.length - 1;
            const nextPhase = !isLast ? activePhases[index + 1] : null;

            return (
              <div key={phase.key} className="flex shrink-0 items-stretch gap-3">
                <PhaseCard
                  phase={phase}
                  icon={definition.icon}
                  onStart={
                    onStartPhase && phase.status === "NotStarted"
                      ? () => onStartPhase(phase.key)
                      : undefined
                  }
                  onComplete={
                    onCompletePhase && phase.status === "InProgress"
                      ? () => onCompletePhase(phase.key)
                      : undefined
                  }
                  onOpen={
                    onOpenPhase &&
                    (phase.status === "InProgress" || phase.status === "Completed")
                      ? () => onOpenPhase(phase.key)
                      : undefined
                  }
                  onReopen={
                    onReopenPhase && phase.status === "Completed"
                      ? () => onReopenPhase(phase.key)
                      : undefined
                  }
                  canManageActions={canManageActions}
                  startLoading={startLoadingMap[phase.key]}
                  completeLoading={completeLoadingMap[phase.key]}
                  reopenLoading={reopenLoadingMap[phase.key]}
                  disabled={disabled}
                />

                {!isLast && nextPhase && (
                  <div className="flex shrink-0 items-center" aria-hidden="true">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-bg-primary ${getConnectorColor(phase.status, nextPhase.status)}`}>
                      <FiChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HorizontalStat({
  label,
  value,
  color,
}: {
  label: string;
  value?: number;
  color: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} aria-hidden="true" />
        <span className="truncate text-xs text-text-secondary">{label}</span>
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-text-primary">
        {value ?? 0}
      </div>
    </div>
  );
}