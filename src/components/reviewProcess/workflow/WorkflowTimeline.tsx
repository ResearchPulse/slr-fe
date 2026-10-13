import { FiArrowRight, FiChevronRight, FiFileText, FiPlus } from "react-icons/fi";
import Button from "../../ui/Button";
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
  onOpenReport?: () => void;
  canManageActions?: boolean;
  startLoadingMap?: Record<string, boolean>;
  completeLoadingMap?: Record<string, boolean>;
  reopenLoadingMap?: Record<string, boolean>;
  disabled?: boolean;
  isStudySelectionCompleted?: boolean;
}

export default function WorkflowTimeline({
  phases,
  paperStats,
  onStartPhase,
  onCompletePhase,
  onOpenPhase,
  onReopenPhase,
  onAddPapers,
  onOpenReport,
  canManageActions = true,
  startLoadingMap = {},
  completeLoadingMap = {},
  reopenLoadingMap = {},
  disabled = false,
}: WorkflowTimelineProps) {
  const activePhases = phases.filter((phase) => phase.key !== "identification");
  const completedCount = activePhases.filter((phase) => phase.status === "Completed").length;
  const totalActivePhases = activePhases.length;
  const progressPercent = totalActivePhases
    ? Math.round((completedCount / totalActivePhases) * 100)
    : 0;
  const totalPapers = paperStats?.total ?? 0;
  const paperMetrics = [
    { label: "Not screened", value: paperStats?.notScreened ?? 0, tone: "bg-slate-400" },
    { label: "In screening", value: paperStats?.screening ?? 0, tone: "bg-blue-500" },
    { label: "Included", value: paperStats?.included ?? 0, tone: "bg-emerald-500" },
    { label: "Excluded", value: paperStats?.excluded ?? 0, tone: "bg-slate-300" },
  ];

  return (
    <section aria-labelledby="review-workflow-title" className="mb-8 overflow-hidden rounded-2xl border border-border/80 bg-surface-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="review-workflow-title" className="text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
              Review workflow
            </h2>
            <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-semibold text-primary">
              PRISMA 2020
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Follow the review from study selection through synthesis.
          </p>
        </div>
        {onOpenReport && (
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 self-start normal-case tracking-normal sm:self-auto"
            onClick={onOpenReport}
          >
            PRISMA flow report
            <FiArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-text-primary">Phase progress</span>
            <span className="text-xs text-text-secondary">
              {completedCount} of {totalActivePhases} complete
            </span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-primary">{progressPercent}%</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-secondary"
          role="progressbar"
          aria-label="Overall workflow progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="mt-5 flex flex-col gap-4 border-y border-border/70 py-4 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-3 sm:min-w-44 sm:border-r sm:border-border/70 sm:pr-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
              <FiFileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-xl font-semibold leading-none tabular-nums text-text-primary">{totalPapers}</div>
              <div className="mt-1 text-xs text-text-secondary">Papers in review</div>
            </div>
          </div>
          {totalPapers > 0 ? (
            <dl className="grid flex-1 grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4 sm:gap-4">
              {paperMetrics.map((metric) => (
                <div key={metric.label} className="min-w-0">
                  <dt className="flex items-center gap-2 truncate text-xs text-text-secondary">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${metric.tone}`} aria-hidden="true" />
                    {metric.label}
                  </dt>
                  <dd className="mt-1 text-base font-semibold tabular-nums text-text-primary">{metric.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-secondary">Add papers from the project pool to begin your review.</p>
              {onAddPapers && canManageActions && (
                <Button variant="secondary" size="sm" className="self-start normal-case tracking-normal sm:self-auto" onClick={onAddPapers}>
                  <FiPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Add papers
                </Button>
              )}
            </div>
          )}
        </div>

        {disabled && (
          <p className="mb-4 flex items-center gap-2 text-xs text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            Start the review process to enable phase actions.
          </p>
        )}

        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-text-primary">Review phases</h3>
          <span className="text-xs text-text-secondary">{activePhases.length} stages</span>
        </div>
        <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
          {activePhases.map((phase, index) => {
            const definition = WORKFLOW_PHASES.find((item) => item.key === phase.key);
            if (!definition) return null;
            const isLast = index === activePhases.length - 1;
            return (
              <div key={phase.key} className="flex min-w-[270px] flex-1 items-stretch gap-3">
                <PhaseCard
                  phase={phase}
                  icon={definition.icon}
                  onStart={onStartPhase && phase.status === "NotStarted" ? () => onStartPhase(phase.key) : undefined}
                  onComplete={onCompletePhase && phase.status === "InProgress" ? () => onCompletePhase(phase.key) : undefined}
                  onOpen={onOpenPhase && (phase.status === "InProgress" || phase.status === "Completed") ? () => onOpenPhase(phase.key) : undefined}
                  onReopen={onReopenPhase && phase.status === "Completed" ? () => onReopenPhase(phase.key) : undefined}
                  canManageActions={canManageActions}
                  startLoading={startLoadingMap[phase.key]}
                  completeLoading={completeLoadingMap[phase.key]}
                  reopenLoading={reopenLoadingMap[phase.key]}
                  disabled={disabled}
                />
                {!isLast && (
                  <span className="my-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-text-muted" aria-hidden="true">
                    <FiChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
