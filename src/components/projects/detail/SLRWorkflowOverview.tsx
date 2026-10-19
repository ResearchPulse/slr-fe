import { Link } from "react-router-dom";
import { FiArrowRight, FiCheck, FiFileText, FiLayers, FiLock, FiRefreshCw } from "react-icons/fi";
import type { ReviewProcess } from "../../../types/reviewProcess";

interface SLRWorkflowOverviewProps {
  projectId: string;
  isDraft?: boolean;
  protocolReady: boolean;
  isProtocolLoading: boolean;
  processes: ReviewProcess[];
  isProcessesLoading: boolean;
  processesError: boolean;
  onRetryProcesses: () => void;
}

const PHASES = [
  { key: "planning", letter: "A", title: "Planning", icon: FiFileText },
  { key: "conducting", letter: "B", title: "Conducting", icon: FiLayers },
  { key: "reporting", letter: "C", title: "Reporting", icon: FiCheck },
] as const;

function processStatusLabel(status?: ReviewProcess["statusText"]) {
  if (status === "Completed") return "Review complete";
  if (status === "InProgress") return "Review in progress";
  if (status === "Cancelled") return "Review cancelled";
  return "Ready to start";
}

export default function SLRWorkflowOverview({
  projectId,
  isDraft = false,
  protocolReady,
  isProtocolLoading,
  processes,
  isProcessesLoading,
  processesError,
  onRetryProcesses,
}: SLRWorkflowOverviewProps) {
  const selectedProcess = processes.find((process) => process.statusText === "InProgress")
    ?? processes.find((process) => process.statusText === "NotStarted")
    ?? processes.find((process) => process.statusText === "Completed")
    ?? processes[0];
  const phaseACompleted = !isDraft;
  const phaseBCompleted = phaseACompleted
    && !isProcessesLoading
    && !processesError
    && selectedProcess?.statusText === "Completed";
  const processId = selectedProcess?.id ?? selectedProcess?.processId;
  const phaseBHref = processId
    ? `/projects/${projectId}/processes/${processId}`
    : `/projects/${projectId}/workspace`;
  const phaseCHref = processId
    ? `/projects/${projectId}/processes/${processId}/prisma-report`
    : undefined;

  const cards = [
    {
      ...PHASES[0],
      done: phaseACompleted,
      locked: false,
      detail: isProtocolLoading
        ? "Checking project setup"
        : phaseACompleted
          ? "Setup complete"
          : protocolReady
            ? "Finish setup and activate the review"
            : "Complete setup to unlock Phase B",
      href: isDraft
        ? `/projects/${projectId}?step=picoc-scope`
        : `/projects/${projectId}/overview#review-protocol`,
      action: "Open setup",
    },
    {
      ...PHASES[1],
      done: false,
      locked: !phaseACompleted,
      detail: !phaseACompleted
        ? "Complete Phase A to unlock"
        : isProcessesLoading
          ? "Checking review status"
          : processesError
            ? "Review status unavailable"
            : selectedProcess
              ? processStatusLabel(selectedProcess.statusText)
              : "Ready to start",
      href: phaseBHref,
      action: selectedProcess?.statusText === "InProgress" ? "Continue review" : "Open review",
    },
    {
      ...PHASES[2],
      done: phaseBCompleted,
      locked: !phaseBCompleted,
      detail: phaseBCompleted
        ? "PRISMA report available"
        : processesError
          ? "Retry status check to unlock"
          : "Complete Phase B to unlock",
      href: phaseCHref,
      action: "Open report",
    },
  ];

  return (
    <section aria-labelledby="slr-phases-heading" className="mb-7">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="slr-phases-heading" className="text-lg font-semibold text-text-primary">Review workflow</h2>
          <p className="mt-0.5 text-xs text-text-secondary">Complete each phase to unlock the next.</p>
        </div>
        {processesError && (
          <button
            type="button"
            onClick={onRetryProcesses}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-text-secondary hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <FiRefreshCw aria-hidden="true" /> Retry status
          </button>
        )}
      </div>

      <ol className="grid gap-2 sm:grid-cols-3" aria-label="SLR phases">
        {cards.map((phase, index) => {
          const Icon = phase.icon;
          const unavailable = phase.locked || (phase.key === "reporting" && !phase.done);
          const isLoading = phase.key === "conducting" && isProcessesLoading;
          const content = (
            <>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                phase.done
                  ? "bg-success/10 text-success"
                  : unavailable
                    ? "bg-bg-secondary text-text-muted"
                    : "bg-primary-light text-primary"
              }`}>
                {phase.done ? <FiCheck aria-hidden="true" /> : unavailable ? <FiLock aria-hidden="true" /> : <Icon aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${unavailable ? "text-text-secondary" : "text-text-primary"}`}>
                    <span className="mr-1.5 text-xs font-medium text-text-muted">{phase.letter}</span>{phase.title}
                  </span>
                  {!unavailable && <FiArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </span>
                <span className="mt-0.5 block truncate text-xs text-text-secondary">{phase.detail}</span>
              </span>
            </>
          );
          const cardClass = `flex min-h-[68px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            unavailable
              ? "cursor-not-allowed border-border bg-bg-secondary/60"
              : "border-border bg-surface-white hover:border-primary/40 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          }`;

          return (
            <li key={phase.key} className="min-w-0">
              <div className="relative">
                {phase.key === "conducting" && !phaseACompleted ? (
                  <button type="button" disabled aria-disabled="true" title="Complete Phase A first" className={`${cardClass} w-full`}>
                    {content}
                  </button>
                ) : phase.key === "reporting" && !phase.done ? (
                  <button type="button" disabled aria-disabled="true" title="Complete Phase B first" className={`${cardClass} w-full`}>
                    {content}
                  </button>
                ) : phase.key === "conducting" && isLoading ? (
                  <button type="button" disabled aria-disabled="true" title="Checking review status" className={`${cardClass} w-full`}>
                    {content}
                  </button>
                ) : phase.key === "reporting" && !phase.href ? (
                  <button type="button" disabled aria-disabled="true" title="A completed review process is required" className={`${cardClass} w-full`}>
                    {content}
                  </button>
                ) : (
                  <Link to={phase.href!} aria-label={`Phase ${phase.letter}: ${phase.action}`} className={`${cardClass} w-full`}>
                    {content}
                  </Link>
                )}
              </div>
              {unavailable && index > 0 && <span className="sr-only">Locked until the previous phase is complete.</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
