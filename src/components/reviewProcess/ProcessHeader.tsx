import { FiArrowLeft, FiPlay, FiCheck, FiPackage } from "react-icons/fi";
import Button from "../ui/Button";
import { formatDate } from "../../utils/dateFormat";
import type { ReviewProcess } from "../../types/reviewProcess";

interface ProcessHeaderProps {
  process: ReviewProcess;
  onBack: () => void;
  onStartProcess: () => void;
  onCompleteProcess: () => void;
  startLoading: boolean;
  completeLoading: boolean;
  disabled?: boolean;
  canManageActions?: boolean;
  isReadyToComplete?: boolean;
}

export default function ProcessHeader({
  process,
  onBack,
  onStartProcess,
  onCompleteProcess,
  startLoading,
  completeLoading,
  disabled = false,
  canManageActions = true,
  isReadyToComplete = true,
}: ProcessHeaderProps) {
  const statusLabel = process.statusText === "InProgress"
    ? "Active"
    : process.statusText;

  return (
    <header className="border-b border-border bg-surface-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 lg:flex-1">
          <button
            onClick={onBack}
            className="shrink-0 rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            title="Back to project"
            aria-label="Back to project"
          >
            <FiArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <FiPackage className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h1 className="line-clamp-2 text-base font-semibold leading-5 text-text-primary sm:text-lg">
              {process.name || "Systematic Review Process"}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-secondary">Process overview</span>
              <span className="h-1 w-1 rounded-full bg-text-muted" aria-hidden="true" />
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${process.statusText === "InProgress" ? "bg-success/10 text-success" : process.statusText === "Completed" ? "bg-primary-light text-primary" : "bg-bg-secondary text-text-secondary"}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pl-1 sm:pl-14 lg:pl-0">
          <div className="flex items-center gap-3 text-xs text-text-secondary sm:gap-5">
            <div>
              <div className="text-[10px] font-medium text-text-muted">Started</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {formatDate(process.startedAt ?? "") || "—"}
              </div>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div>
              <div className="text-[10px] font-medium text-text-muted">Last updated</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {formatDate(process.modifiedAt ?? "") || "—"}
              </div>
            </div>
            {process.completedAt && (
              <>
                <div className="h-8 w-px bg-border" aria-hidden="true" />
                <div>
                  <div className="text-[10px] font-medium text-text-muted">Completed</div>
                  <div className="mt-0.5 font-medium text-text-primary">
                    {formatDate(process.completedAt)}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="ml-auto lg:ml-1">
            {process.statusText === "NotStarted" && (
              <Button
                onClick={onStartProcess}
                disabled={startLoading || disabled}
                title={disabled ? "Select a protocol first" : ""}
              >
                <FiPlay className="mr-2 h-4 w-4" aria-hidden="true" />
                {startLoading ? "Starting..." : "Start process"}
              </Button>
            )}

            {process.statusText === "InProgress" && (
              <Button
                onClick={onCompleteProcess}
                disabled={completeLoading || disabled}
                variant="success"
                title={
                  disabled
                    ? "Select a protocol first"
                    : canManageActions === false
                      ? "Only Lead Reviewer can complete the process"
                      : isReadyToComplete === false
                        ? "Complete all 4 workflow phases first"
                        : "Complete review process"
                }
              >
                <FiCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                {completeLoading ? "Completing..." : "Complete process"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
