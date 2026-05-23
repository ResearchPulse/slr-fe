import React from "react";
import { FiCheck, FiLock } from "react-icons/fi";

export type StepStatus = "completed" | "current" | "locked";

export interface WorkflowStep {
  key: string;
  label: string;
  status: StepStatus;
}

interface StepProgressNavProps {
  steps: WorkflowStep[];
  onStepClick: (key: string) => void;
}

const StepProgressNav: React.FC<StepProgressNavProps> = ({
  steps,
  onStepClick,
}) => {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="border border-border bg-surface-white p-6 mb-6">
      {/* Step Indicators */}
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";
          const isLocked = step.status === "locked";
          const isClickable = isCompleted || isCurrent;

          return (
            <React.Fragment key={step.key}>
              {/* Step Node */}
              <div
                className="flex flex-col items-center relative z-10"
                style={{ flex: "0 0 auto" }}
              >
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.key)}
                  disabled={isLocked}
                  className={`
                    w-10 h-10 flex items-center justify-center
                    text-[11px] font-medium uppercase tracking-[0.1em] transition-all duration-300 border
                    ${
                      isCompleted
                        ? "bg-text-primary border-text-primary text-bg-primary cursor-pointer"
                        : isCurrent
                          ? "bg-surface-white border-accent text-accent cursor-pointer step-current-pulse"
                          : "bg-bg-secondary border-border text-[#A0998C] cursor-not-allowed"
                    }
                  `}
                  title={
                    isLocked
                      ? "Complete previous steps to unlock"
                      : isCompleted
                        ? `Revisit ${step.label}`
                        : step.label
                  }
                >
                  {isCompleted ? (
                    <FiCheck className="w-4 h-4" strokeWidth={2.5} />
                  ) : isLocked ? (
                    <FiLock className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </button>

                {/* Label */}
                <span
                  className={`
                    mt-3 text-[10px] uppercase tracking-[0.15em] font-medium text-center whitespace-nowrap
                    ${
                      isCompleted
                        ? "text-text-primary"
                        : isCurrent
                          ? "text-accent"
                          : "text-[#A0998C]"
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div
                  className="flex-1 mx-3 relative"
                  style={{ height: "1px", top: "-10px" }}
                >
                  <div className="absolute inset-0 bg-border" />
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${isCompleted ? "bg-text-primary" : "bg-border"}`}
                    style={{
                      width: isCompleted ? "100%" : "0%",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">
            Preparation Progress
          </span>
          <span className="text-[11px] font-medium text-text-primary">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full h-[2px] bg-border overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out ${progressPercent === 100 ? "bg-text-primary" : "bg-accent"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StepProgressNav;
