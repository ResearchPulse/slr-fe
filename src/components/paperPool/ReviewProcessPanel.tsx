import {
  FiFolder,
  FiCheckCircle,
  FiLoader,
  FiClock,
  FiXCircle,
  FiExternalLink,
  FiUsers,
  FiPlus,
  FiLayers,
} from "react-icons/fi";
import type { ProcessSnapshot } from "./types";
import Button from "../ui/Button";

interface ReviewProcessPanelProps {
  processes: ProcessSnapshot[];
  selectedPaperIds: string[];
  onAddSelected: (processId: string) => void;
  onAddFromFilter: (processId: string) => void;
  onNavigate: (processId: string) => void;
  onCreateProcess?: () => void;
  isAdding?: boolean;
  isLeader?: boolean;
}

export function ProcessStatusIcon({
  statusText,
}: {
  statusText: ProcessSnapshot["statusText"];
}) {
  if (statusText === "Completed")
    return <FiCheckCircle className="h-4 w-4 text-success" />;
  if (statusText === "InProgress")
    return <FiLoader className="h-4 w-4 text-accent animate-spin" />;
  if (statusText === "Cancelled")
    return <FiXCircle className="h-4 w-4 text-error" />;
  return <FiClock className="h-4 w-4 text-text-secondary" />;
}

export default function ReviewProcessPanel({
  processes,
  selectedPaperIds,
  onNavigate,
  onCreateProcess,
  isLeader = false,
}: ReviewProcessPanelProps) {
  const hasSelected = selectedPaperIds.length > 0;

  return (
    <section className="mt-10 mb-8 rounded-2xl border border-border bg-surface-white p-5 shadow-sm sm:p-7 lg:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <FiFolder className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
                  Review processes
                </h2>
                <span className="text-sm text-text-secondary">
                  Each process applies its own criteria
                </span>
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-5 text-text-secondary">
                Add repository papers to one or more processes for independent screening.
              </p>
            </div>
          </div>

          {processes.length > 0 && onCreateProcess && isLeader && (
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 self-start normal-case tracking-normal sm:self-auto"
              onClick={onCreateProcess}
            >
              <FiPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              New process
            </Button>
          )}
        </div>

        {hasSelected && isLeader && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary-light px-4 py-3 text-sm text-text-primary">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-white text-primary">
              <FiLayers className="h-4 w-4" aria-hidden="true" />
            </div>
            <p>
              <span className="font-semibold tabular-nums">{selectedPaperIds.length}</span>{" "}
              {selectedPaperIds.length === 1 ? "paper is" : "papers are"} selected. Choose a process to add them.
            </p>
          </div>
        )}

        {processes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg-primary/60 px-5 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <FiFolder className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              No review processes yet
            </h3>
            <p className="mt-1 max-w-sm text-sm leading-5 text-text-secondary">
              Create a process to start screening papers from this repository.
            </p>
            {onCreateProcess && isLeader && (
              <Button
                className="mt-5 normal-case tracking-normal"
                onClick={onCreateProcess}
              >
                <FiPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Create review process
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {processes.map((process) => (
              <article
                key={process.processId}
                className={`group relative rounded-xl border bg-surface-white p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${hasSelected && isLeader ? "border-primary/40 ring-2 ring-primary/10" : "border-border"}`}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-text-on-primary">
                      <FiUsers className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-text-primary">
                        {process.processName}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2">
                        <ProcessStatusIcon statusText={process.statusText} />
                        <span className="text-xs font-medium text-text-secondary">
                          {process.statusText === "InProgress"
                            ? "In progress"
                            : process.statusText}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-bg-secondary px-2.5 py-1 text-[10px] font-medium text-text-secondary">
                    Independent screening
                  </span>
                </div>

                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary">Progress</span>
                    <span className="font-semibold tabular-nums text-primary">
                      {process.progressPercent}%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-bg-secondary"
                    role="progressbar"
                    aria-label={`${process.processName} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={process.progressPercent}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${process.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 divide-x divide-border border-t border-border pt-4">
                  <div className="pr-2">
                    <div className="text-[11px] text-text-secondary">Papers</div>
                    <div className="mt-1 text-base font-semibold tabular-nums text-text-primary">
                      {process.totalPapers ?? 0}
                    </div>
                  </div>
                  <div className="px-3">
                    <div className="text-[11px] text-text-secondary">Included</div>
                    <div className="mt-1 text-base font-semibold tabular-nums text-text-primary">
                      {process.totalIncludedPapers ?? 0}
                    </div>
                  </div>
                  <div className="pl-3">
                    <div className="text-[11px] text-text-secondary">Excluded</div>
                    <div className="mt-1 text-base font-semibold tabular-nums text-text-primary">
                      {process.totalExcludedPapers ?? 0}
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="mt-5 w-full rounded-xl normal-case tracking-normal"
                  onClick={() => onNavigate(process.processId)}
                >
                  <FiExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  View process
                </Button>

                {hasSelected && isLeader && (
                  <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed border-primary/50" />
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
