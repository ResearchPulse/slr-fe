import { FiArrowRight, FiFileText, FiLock, FiPlus } from "react-icons/fi";
import PhaseStatusBadge from "./PhaseStatusBadge";
import PhaseActions from "./PhaseActions";
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
  startLoadingMap?: Record<string, boolean>;
  completeLoadingMap?: Record<string, boolean>;
  reopenLoadingMap?: Record<string, boolean>;
  disabled?: boolean;
  isStudySelectionCompleted?: boolean;
}

const MODULE_DESCRIPTIONS: Record<string, string> = {
  screening: "Screen studies against your eligibility criteria.",
  extraction: "Collect structured evidence from included studies.",
  quality: "Assess study quality and risk of bias.",
  synthesis: "Bring findings together across included studies.",
};

export default function WorkflowTimeline({
  phases,
  paperStats,
  onStartPhase,
  onCompletePhase,
  onOpenPhase,
  onReopenPhase,
  onAddPapers,
  canManageActions = true,
  startLoadingMap = {},
  completeLoadingMap = {},
  reopenLoadingMap = {},
  disabled = false,
}: WorkflowTimelineProps) {
  const activePhases = phases.filter((phase) => phase.key !== "identification");
  const completedCount = activePhases.filter((phase) => phase.status === "Completed").length;
  const totalPapers = paperStats?.total ?? 0;

  return (
    <section aria-label="Review modules" className="min-w-0">
      {disabled && (
        <div className="mb-3 flex items-start gap-2.5 rounded-lg bg-bg-secondary px-3 py-2.5 text-sm text-text-secondary">
          <FiLock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>This review has not started yet. Module actions will be available when it starts.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border py-3 text-sm" aria-label="Review overview">
        <span className="inline-flex items-center gap-2 font-medium text-text-primary">
          <FiFileText className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          <span className="tabular-nums">{totalPapers}</span> papers in review
        </span>
        {totalPapers > 0 ? (
          <>
            <SummaryStat label="Included" value={paperStats?.included} />
            <SummaryStat label="Excluded" value={paperStats?.excluded} />
            <SummaryStat label="Not screened" value={paperStats?.notScreened} />
            <SummaryStat label="In screening" value={paperStats?.screening} />
          </>
        ) : (
          <span className="text-text-secondary">Add papers from your project pool to begin screening.</span>
        )}
        {totalPapers === 0 && onAddPapers && canManageActions && !disabled ? (
          <button
            type="button"
            onClick={onAddPapers}
            className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <FiPlus aria-hidden="true" className="h-3.5 w-3.5" />
            Add papers
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-primary">Module workspaces</h3>
        <p className="text-xs text-text-secondary">{completedCount} of {activePhases.length} complete</p>
      </div>

      <ol className="mt-2 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-10" aria-label="Phase B module workspaces in workflow order">
        {activePhases.map((phase, index) => {
          const definition = WORKFLOW_PHASES.find((item) => item.key === phase.key);
          if (!definition) return null;
          const Icon = definition.icon;
          const isLocked = phase.status === "Locked";

          return (
            <li key={phase.key} className={`relative flex min-h-[250px] min-w-0 flex-col rounded-xl border p-4 transition-colors ${isLocked ? "border-border bg-bg-primary/60" : phase.status === "Completed" ? "border-success/25 bg-success/[0.025]" : "border-primary/25 bg-surface-white"}`}>
              {index < activePhases.length - 1 ? (
                <span aria-hidden="true" className="absolute -right-8 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface-white text-text-secondary shadow-sm xl:flex">
                  <FiArrowRight className="h-3.5 w-3.5" />
                </span>
              ) : null}
              <div className="flex min-w-0 items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isLocked ? "bg-bg-secondary text-text-muted" : "bg-primary-light text-primary"}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Step {String(index + 1).padStart(2, "0")}</p>
                  <h4 className="text-sm font-semibold leading-5 text-text-primary">{phase.name}</h4>
                  <div className="mt-1.5"><PhaseStatusBadge status={phase.status} /></div>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-text-secondary">
                {isLocked && phase.lockReason ? phase.lockReason : MODULE_DESCRIPTIONS[phase.key] ?? "Continue work in this review module."}
              </p>
              {!isLocked && phase.stats.length > 0 ? <InlineStats stats={phase.stats} /> : null}

              <PhaseActions
                status={phase.status}
                phaseKey={phase.key}
                onStart={phase.status === "NotStarted" ? () => onStartPhase?.(phase.key) : undefined}
                onComplete={phase.status === "InProgress" ? () => onCompletePhase?.(phase.key) : undefined}
                onOpen={phase.status === "InProgress" || phase.status === "Completed" ? () => onOpenPhase?.(phase.key) : undefined}
                onReopen={phase.status === "Completed" ? () => onReopenPhase?.(phase.key) : undefined}
                canManageActions={canManageActions}
                startLoading={startLoadingMap[phase.key]}
                completeLoading={completeLoadingMap[phase.key]}
                reopenLoading={reopenLoadingMap[phase.key]}
                disabled={disabled}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value?: number }) {
  return (
    <span className="text-text-secondary">
      <span className="font-semibold tabular-nums text-text-primary">{value ?? 0}</span> {label}
    </span>
  );
}

function InlineStats({ stats }: { stats: WorkflowPhase["stats"] }) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2">
      {stats.map((stat, index) => (
        <div key={`${stat.label}-${index}`} className="min-w-0 rounded-lg bg-bg-secondary/70 px-2.5 py-2">
          <dt className="truncate text-[11px] leading-4 text-text-secondary">{stat.label}</dt>
          <dd className={`mt-0.5 text-base font-semibold leading-5 tabular-nums ${stat.variant === "success" ? "text-success" : stat.variant === "warning" ? "text-warning" : stat.variant === "danger" ? "text-error" : "text-text-primary"}`}>
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
