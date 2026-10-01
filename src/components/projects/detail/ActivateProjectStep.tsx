import React from "react";
import { FiCheck, FiAlertCircle, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";

interface ChecklistItem {
  label: string;
  completed: boolean;
  required?: boolean;
}

interface ActivateProjectStepProps {
  projectId: string;
  isActive: boolean;
  checklist: ChecklistItem[];
  onActivate: () => Promise<void>;
  isActivating: boolean;
}

const ActivateProjectStep: React.FC<ActivateProjectStepProps> = ({
  projectId,
  isActive,
  checklist,
  onActivate,
  isActivating,
}) => {
  const navigate = useNavigate();
  const allReady = checklist
    .filter((item) => item.required !== false)
    .every((item) => item.completed);

  // ── Post-activation state ────────────────────────────────────────────────
  if (isActive) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-text-primary flex items-center justify-center">
          <FiCheck className="w-8 h-8 text-bg-primary" strokeWidth={2.5} />
        </div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-3">
          All steps complete
        </p>
        <h2 className="font-cormorant text-[36px] font-normal text-text-primary mb-3">
          Review workspace ready
        </h2>
        <p className="text-text-secondary text-sm mb-8 max-w-md mx-auto leading-[1.7]">
          Your project is now active. You can invite reviewers and create review
          processes from the Project Overview.
        </p>
        <Button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="gap-2"
        >
          Go to Project Overview
        </Button>
      </div>
    );
  }

  // ── Pre-activation state ─────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto mb-5 border border-border bg-bg-secondary flex items-center justify-center text-text-secondary">
          <FiZap className="w-5 h-5" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-3">
          Final step
        </p>
        <h2 className="font-cormorant text-[36px] font-normal text-text-primary mb-3">
          Activate Your Project
        </h2>
        <p className="text-text-secondary text-sm max-w-md mx-auto leading-[1.7]">
          Review the checklist below and activate your project when ready. Once
          activated, you'll be able to invite reviewers and create review
          processes.
        </p>
      </div>

      {/* Readiness Checklist */}
      <div className="border border-border bg-surface-white mb-8">
        <div className="px-6 py-3 border-b border-border bg-bg-primary">
          <p className="text-[11px] uppercase tracking-[0.25em] text-text-secondary">
            Readiness Checklist
          </p>
        </div>
        <ul className="divide-y divide-border">
          {checklist.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-center gap-4 p-5 transition-colors ${
                item.completed
                  ? "bg-surface-white"
                  : item.required !== false
                    ? "bg-surface-white"
                    : "bg-bg-primary opacity-75"
              }`}
            >
              {item.completed ? (
                <div className="w-7 h-7 bg-text-primary flex items-center justify-center flex-shrink-0">
                  <FiCheck
                    className="w-3.5 h-3.5 text-bg-primary"
                    strokeWidth={3}
                  />
                </div>
              ) : (
                <div
                  className={`w-7 h-7 border flex items-center justify-center flex-shrink-0 ${
                    item.required !== false
                      ? "border-accent text-accent"
                      : "border-border text-text-muted"
                  }`}
                >
                  <FiAlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
              )}
              <div className="flex-1">
                <span
                  className={`text-sm font-medium block ${
                    item.completed ? "text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {item.label}
                </span>
                {item.required === false && !item.completed && (
                  <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted">
                    Optional
                  </span>
                )}
                {item.required !== false && !item.completed && (
                  <span className="text-[10px] uppercase tracking-[0.15em] text-accent">
                    Required
                  </span>
                )}
              </div>
              {item.completed && (
                <span className="text-[10px] uppercase tracking-[0.15em] text-text-secondary">
                  Done
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Activate Button */}
      <div className="text-center">
        {allReady ? (
          <Button
            size="lg"
            onClick={onActivate}
            disabled={isActivating}
            className="gap-2 px-10"
          >
            <FiZap className="w-4 h-4" />
            {isActivating ? "Activating..." : "Activate Project"}
          </Button>
        ) : (
          <div className="border border-border bg-bg-primary p-4 inline-block">
            <p className="text-sm text-text-secondary">
              Complete all required checklist items above to activate your
              project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivateProjectStep;
