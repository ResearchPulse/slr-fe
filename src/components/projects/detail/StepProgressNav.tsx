import React from "react";
import { FiArrowRight, FiCheck, FiLock } from "react-icons/fi";

export type StepStatus = "completed" | "current" | "locked";

export interface WorkflowStep {
  key: string;
  label: string;
  status: StepStatus;
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
  const progressPercent = steps.length
    ? Math.round((completedCount / steps.length) * 100)
    : 0;

  return (
    <section className="mb-7 border-b border-border pb-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text-primary">
          Project preparation
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            {completedCount} of {steps.length} complete
          </span>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              {actionLabel} <FiArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      <nav
        aria-label="Project preparation steps"
        className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4"
      >
        {steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";
          const isLocked = step.status === "locked";
          const isClickable = isCompleted || isCurrent;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => isClickable && onStepClick(step.key)}
              disabled={isLocked}
              aria-current={isCurrent ? "step" : undefined}
              className="flex min-w-0 items-center gap-3 py-2 text-left disabled:cursor-not-allowed"
              title={isLocked ? "Complete the previous step to continue" : step.label}
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
                  {isCompleted ? "Completed" : isCurrent ? "In progress" : "Not started"}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div
        className="mt-4 h-1 overflow-hidden rounded-full bg-bg-secondary"
        role="progressbar"
        aria-label="Project preparation progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  );
};

export default StepProgressNav;
