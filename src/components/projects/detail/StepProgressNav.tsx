import React from "react";
import { FiArrowRight, FiCheck, FiLock } from "react-icons/fi";

export type StepStatus = "completed" | "current" | "locked" | "upcoming";

export interface WorkflowStep {
  key: string;
  label: string;
  status: StepStatus;
  lockedReason?: string;
}

interface StepProgressNavProps {
  steps: WorkflowStep[];
  onStepClick: (key: string) => void;
  actionLabel?: string;
  onAction?: () => void;
}

const StepProgressNav: React.FC<StepProgressNavProps> = ({
  steps,
  onStepClick,
  actionLabel,
  onAction,
}) => {
  const completedCount = steps.filter((step) => step.status === "completed").length;
  const currentIndex = steps.findIndex((step) => step.status === "current");
  const progressPercent = steps.length
    ? Math.round(((completedCount + (currentIndex >= 0 ? 0.45 : 0)) / steps.length) * 100)
    : 0;

  return (
    <section className="mb-7 border-b border-border pb-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text-primary">
          Phase A · Planning the Review
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            {completedCount} of {steps.length} complete
          </span>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent px-3.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              {actionLabel} <FiArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      <nav
        aria-label="Phase A planning setup steps"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
      >
        {steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";
          const isLocked = step.status === "locked";
          const isClickable = !isLocked;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => isClickable && onStepClick(step.key)}
              disabled={isLocked}
              aria-current={isCurrent ? "step" : undefined}
              className="flex min-w-0 items-center gap-3 py-2 text-left disabled:cursor-not-allowed"
              title={isLocked ? step.lockedReason ?? "Complete the previous step first" : step.label}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                  isCompleted
                    ? "border-accent bg-accent text-white"
                    : isCurrent
                      ? "border-accent text-accent"
                      : "border-border text-text-muted"
                }`}
              >
                {isCompleted ? <FiCheck size={14} /> : isLocked ? <FiLock size={12} /> : index + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={`block truncate text-sm font-medium ${
                    isLocked ? "text-text-muted" : "text-text-primary"
                  }`}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 block text-xs text-text-secondary">
                  {isCompleted ? "Completed" : isCurrent ? "In progress" : isLocked ? step.lockedReason ?? "Complete the previous step first" : "Not started"}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div
        className="mt-4 grid h-1 grid-cols-4 gap-1"
        role="progressbar"
        aria-label="Project preparation progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
      >
        {steps.map((step) => (
          <span key={step.key} className="h-full overflow-hidden rounded-full bg-bg-secondary">
            <span
              className={`block h-full rounded-full bg-accent transition-[width] duration-300 ${step.status === "completed" ? "w-full" : step.status === "current" ? "w-[45%]" : "w-0"}`}
            />
          </span>
        ))}
      </div>
    </section>
  );
};

export default StepProgressNav;
