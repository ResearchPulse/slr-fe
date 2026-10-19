import { useEffect, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiArrowRight, FiCheck, FiClock, FiExternalLink, FiLock, FiRefreshCw } from "react-icons/fi";
import type { ReviewProcess } from "../../../types/reviewProcess";
import { useProject } from "../../../hooks/useProjects";
import {
  PLANNING_MODULES,
  REPORTING_MODULES,
  SLR_WORKFLOW_PHASES,
  type SLRPhaseKey,
  type SLRWorkflowModule,
} from "../../../constants/slrWorkflow";

interface SLRPhaseWorkspaceProps {
  projectId: string;
  processId: string;
  process: ReviewProcess;
  children: ReactNode;
}

type ModuleStatus = "NotStarted" | "InProgress" | "Completed" | "Cancelled";

const STATUS_COPY: Record<ModuleStatus, string> = {
  NotStarted: "Not started",
  InProgress: "In progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

function moduleStatus(status?: string | null): ModuleStatus | null {
  if (status === "Completed") return "Completed";
  if (status === "Cancelled") return "Cancelled";
  if (status === "InProgress" || status === "Reopened") return "InProgress";
  if (status === "NotStarted" || status === "Pending") return "NotStarted";
  return null;
}

export default function SLRPhaseWorkspace({ projectId, processId, process, children }: SLRPhaseWorkspaceProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectQuery = useProject(projectId);
  const phaseACompleted = projectQuery.project?.statusText === "Active" || projectQuery.project?.statusText === "Completed";
  const phaseAStatusKnown = !projectQuery.isLoading && !projectQuery.isError && Boolean(projectQuery.project);
  const phaseBCompleted = process.statusText === "Completed";
  const requestedPhase = searchParams.get("phase");
  const canOpenPhase = (phase: SLRPhaseKey) => {
    if (phase === "planning") return true;
    if (!phaseACompleted) return false;
    return phase !== "reporting" || phaseBCompleted;
  };
  const activePhase: SLRPhaseKey = requestedPhase === "planning"
    ? "planning"
    : requestedPhase === "reporting" && canOpenPhase("reporting")
      ? "reporting"
      : canOpenPhase("conducting")
        ? "conducting"
        : "planning";
  useEffect(() => {
    if (requestedPhase === "reporting" && !canOpenPhase("reporting")) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("phase");
        return next;
      }, { replace: true });
    } else if (requestedPhase === "conducting" && !canOpenPhase("conducting")) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("phase");
        return next;
      }, { replace: true });
    }
  }, [requestedPhase, phaseACompleted, phaseBCompleted, setSearchParams]);
  const setActivePhase = (phase: SLRPhaseKey) => {
    if (!canOpenPhase(phase)) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (phase === "conducting") next.delete("phase");
      else next.set("phase", phase);
      return next;
    }, { replace: true });
  };
  const projectRoute = (route: string) => {
    if (!processId || processId === "undefined" || processId === "null") {
      return `/projects/${projectId}/overview`;
    }
    if (route.includes(":identificationPhaseId") && !process.identificationProcess?.id) {
      return `/projects/${projectId}/processes/${processId}`;
    }
    return route
      .replace(":projectId", projectId)
      .replace(":processId", processId)
      .replace(":identificationPhaseId", process.identificationProcess?.id ?? "");
  };
  const statusLabel = process.statusText === "Completed"
    ? "Completed"
    : process.statusText === "InProgress"
      ? "In progress"
      : process.statusText === "Cancelled"
        ? "Cancelled"
        : "Not started";
  const identificationStats = process.identificationProcess?.prismaStatistics;
  const identificationWorkspacePath = processId && processId !== "undefined" && processId !== "null" && process.identificationProcess?.id
    ? `/projects/${projectId}/processes/${processId}/identification/${process.identificationProcess.id}`
    : undefined;
  const activeDefinition = SLR_WORKFLOW_PHASES.find((phase) => phase.id === activePhase)!;
  const identificationWorkspaceContent = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <ModuleStatusIcon status={moduleStatus(process.identificationProcess?.statusText)} />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-text-primary">Open search & import workspace</span>
          {identificationStats ? <span className="mt-0.5 block text-xs text-text-secondary">{identificationStats.totalRecordsImported.toLocaleString()} imported · {identificationStats.uniqueRecords.toLocaleString()} unique</span> : null}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <StatusPill status={moduleStatus(process.identificationProcess?.statusText)} />
        <FiExternalLink className="h-4 w-4 text-text-muted" aria-hidden="true" />
      </span>
    </>
  );

  return (
    <section aria-labelledby="slr-workflow-title" className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="slr-workflow-title" className="text-lg font-semibold text-text-primary">Review phases</h2>
          <p className="mt-0.5 text-xs text-text-secondary">Finish a phase to unlock the next one.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3" role="group" aria-label="Review phases">
        {SLR_WORKFLOW_PHASES.map((phase) => {
          const selected = phase.id === activePhase;
          const locked = !canOpenPhase(phase.id);
          const phaseStatus = phase.id === "planning"
            ? phaseACompleted ? "Complete" : "Current"
            : phase.id === "conducting"
              ? !phaseACompleted ? phaseAStatusKnown ? "Locked" : "Checking setup" : statusLabel
              : !phaseACompleted ? "Locked" : phaseBCompleted ? "Ready" : "Locked";
          return (
            <button
              key={phase.id}
              type="button"
              aria-pressed={selected}
              aria-disabled={locked}
              disabled={locked}
              onClick={() => setActivePhase(phase.id)}
              title={locked ? phase.id === "conducting" ? "Complete Phase A first" : "Complete Phase B first" : undefined}
              className={`flex min-h-16 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-4 ${selected ? "border-primary/40 bg-primary-light/50" : locked ? "cursor-not-allowed border-border bg-bg-secondary" : "border-border bg-surface-white hover:bg-bg-primary"}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${phaseStatus === "Complete" ? "bg-success/10 text-success" : selected ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary"}`}>
                {phaseStatus === "Complete" ? <FiCheck aria-hidden="true" /> : locked ? <FiLock aria-hidden="true" /> : phase.letter}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-text-primary">Phase {phase.letter} · {phase.title}</span>
                <span className="block truncate text-xs text-text-secondary">{locked ? phase.id === "conducting" ? phaseAStatusKnown ? "Complete Phase A to unlock" : "Checking Phase A status" : phaseACompleted ? "Complete Phase B to unlock" : "Complete Phase A to unlock" : phaseStatus}</span>
              </span>
              {selected ? <span className="rounded-full bg-primary-light px-2 py-1 text-[11px] font-semibold text-primary">Current</span> : null}
              {!locked && !selected ? <FiArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-text-muted" /> : null}
              {locked ? <span className="sr-only">Locked until the previous phase is complete</span> : null}
            </button>
          );
        })}
      </div>

      <section aria-labelledby="slr-phase-detail-title" className="rounded-xl border border-border bg-surface-white">
        <header className="border-b border-border px-4 py-3.5 sm:px-5">
          {activePhase === "conducting" ? (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div>
                <h3 id="slr-phase-detail-title" className="text-base font-semibold text-text-primary">Conducting the Review</h3>
                <p className="mt-0.5 text-xs text-text-secondary">Identify, screen, assess, and synthesize research evidence.</p>
              </div>
              <span className="text-xs font-medium text-text-secondary">Phase B · {statusLabel}</span>
            </div>
          ) : (
            <>
              <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-text-secondary">
                <Link to={`/projects/${projectId}/overview`} className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">Project</Link>
                <FiArrowRight aria-hidden className="h-3 w-3 text-text-muted" />
                <span>SLR workflow</span>
                <FiArrowRight aria-hidden className="h-3 w-3 text-text-muted" />
                <span aria-current="page" className="font-medium text-text-primary">Phase {activeDefinition.letter}</span>
              </nav>
              <p className="text-xs font-semibold text-primary">PHASE {activeDefinition.letter}</p>
              <h3 id="slr-phase-detail-title" className="text-base font-semibold text-text-primary">{activeDefinition.title}</h3>
            </>
          )}
        </header>

        {activePhase === "planning" ? (
          <>
            {!phaseACompleted ? (
              <div className="flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <p className="text-sm font-medium text-text-primary">{projectQuery.isLoading ? "Checking Phase A status…" : phaseAStatusKnown ? "Complete project setup to unlock Phase B." : "Project setup status could not be confirmed."}</p>
                  <p className="mt-1 text-xs text-text-secondary">{projectQuery.isLoading ? "The review workspace will unlock when setup is confirmed." : phaseAStatusKnown ? "Finish the remaining preparation steps and activate the review." : "Retry the status check before opening the review phase."}</p>
                </div>
                {projectQuery.isLoading ? <span className="inline-flex min-h-9 shrink-0 items-center px-2 text-xs text-text-secondary">Checking…</span> : phaseAStatusKnown ? <Link to={`/projects/${projectId}?step=picoc-scope`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors motion-reduce:transition-none hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">Open project setup <FiArrowRight aria-hidden="true" /></Link> : <button type="button" onClick={() => void projectQuery.refetch()} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-text-secondary transition-colors motion-reduce:transition-none hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><FiRefreshCw aria-hidden="true" />Retry status</button>}
              </div>
            ) : (
              <>
                <p className="px-4 pt-4 text-xs text-text-secondary sm:px-5">Review or update the saved project plan.</p>
                <ModuleList modules={PLANNING_MODULES} projectRoute={projectRoute} />
              </>
            )}
          </>
        ) : activePhase === "reporting" ? (
          <>
            <p className="px-4 pt-4 text-xs text-text-secondary sm:px-5">Phase B is complete. Choose a reporting workspace.</p>
            <ModuleList modules={REPORTING_MODULES} projectRoute={projectRoute} />
          </>
        ) : (
          <div className="divide-y divide-border">
            <div className="px-4 py-4 sm:px-5">
              <h4 className="text-sm font-semibold text-text-primary">Literature identification</h4>
              <p className="mt-1 text-xs text-text-secondary">Search sources, import references and resolve duplicates.</p>
              {identificationWorkspacePath ? (
                <Link to={identificationWorkspacePath} className="group mt-3 flex min-h-14 items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors motion-reduce:transition-none hover:border-primary/30 hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4">
                  {identificationWorkspaceContent}
                </Link>
              ) : (
                <div aria-disabled="true" title="Identification workspace is not available for this review process yet" className="mt-3 flex min-h-14 items-center justify-between gap-3 rounded-lg border border-border bg-bg-secondary/40 px-3 py-2.5 sm:px-4">
                  {identificationWorkspaceContent}
                </div>
              )}
            </div>
            <div className="px-4 py-3 sm:px-5">
              {children}
            </div>
          </div>
        )}
        <PhaseFooterNavigation activePhase={activePhase} onChangePhase={setActivePhase} canOpenPhase={canOpenPhase} />
      </section>
    </section>
  );
}

function ModuleList({ modules, projectRoute }: { modules: SLRWorkflowModule[]; projectRoute: (route: string) => string }) {
  return (
    <ul className="divide-y divide-border px-4 sm:px-5">
      {modules.map((module) => (
        <li key={module.id} className="py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{module.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-text-secondary">{module.description}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {module.availability === "available" ? (
              <>
                <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-bg-secondary px-2.5 py-1 text-[11px] font-medium text-text-secondary"><FiClock aria-hidden /> Workspace available</span>
                {module.links?.map((link) => <Link key={link.label} to={projectRoute(link.route)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-semibold text-text-primary transition-colors motion-reduce:transition-none hover:border-primary/30 hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">{link.label}<FiArrowRight aria-hidden /></Link>)}
                {!module.links && module.route ? <Link to={projectRoute(module.route)} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-semibold text-text-primary transition-colors motion-reduce:transition-none hover:border-primary/30 hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">Open workspace <FiArrowRight aria-hidden /></Link> : null}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-secondary px-2.5 py-1 text-[11px] font-medium text-text-secondary"><FiLock aria-hidden /> Not available yet</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ModuleStatusIcon({ status }: { status: ModuleStatus | null }) {
  if (status === "Completed") return <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"><FiCheck aria-hidden className="h-3.5 w-3.5" /></span>;
  if (status === "InProgress") return <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light"><span className="h-2 w-2 rounded-full bg-primary" /></span>;
  return <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-secondary text-text-secondary"><FiClock aria-hidden className="h-3.5 w-3.5" /></span>;
}

function StatusPill({ status }: { status: ModuleStatus | null }) {
  if (!status) return <span className="rounded-full bg-bg-secondary px-2.5 py-1 text-[11px] font-medium text-text-secondary">Not tracked</span>;
  const classes = status === "Completed" ? "bg-success/10 text-success" : status === "InProgress" ? "bg-primary-light text-primary" : "bg-bg-secondary text-text-secondary";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${classes}`}>{STATUS_COPY[status]}</span>;
}

function PhaseFooterNavigation({ activePhase, onChangePhase, canOpenPhase }: { activePhase: SLRPhaseKey; onChangePhase: (phase: SLRPhaseKey) => void; canOpenPhase: (phase: SLRPhaseKey) => boolean }) {
  const currentIndex = SLR_WORKFLOW_PHASES.findIndex((phase) => phase.id === activePhase);
  const previous = SLR_WORKFLOW_PHASES[currentIndex - 1];
  const next = SLR_WORKFLOW_PHASES[currentIndex + 1];
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
      {previous ? (
        <button type="button" onClick={() => onChangePhase(previous.id)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-text-primary hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><FiArrowRight aria-hidden className="h-3.5 w-3.5 rotate-180" />Phase {previous.letter}</button>
      ) : <span />}
      {next ? (
        <button type="button" onClick={() => onChangePhase(next.id)} disabled={!canOpenPhase(next.id)} aria-disabled={!canOpenPhase(next.id)} title={!canOpenPhase(next.id) ? next.id === "conducting" ? "Complete Phase A first" : "Complete Phase B first" : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-bg-secondary disabled:text-text-muted enabled:bg-accent enabled:text-white enabled:hover:bg-primary-hover">{!canOpenPhase(next.id) && <FiLock aria-hidden className="h-3.5 w-3.5" />}Phase {next.letter}<FiArrowRight aria-hidden className="h-3.5 w-3.5" /></button>
      ) : <span />}
    </footer>
  );
}
