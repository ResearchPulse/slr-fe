import React from "react";
import { FiAlertCircle, FiArrowRight, FiCheck, FiClock, FiSettings, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required?: boolean;
  onConfigure: () => void;
}

interface ActivateProjectStepProps {
  projectId: string;
  isActive: boolean;
  checklist: ChecklistItem[];
  onActivate: () => Promise<void>;
  isActivating: boolean;
  isCheckingReadiness: boolean;
}

const ActivateProjectStep: React.FC<ActivateProjectStepProps> = ({
  projectId,
  isActive,
  checklist,
  onActivate,
  isActivating,
  isCheckingReadiness,
}) => {
  const navigate = useNavigate();
  const requiredItems = checklist.filter((item) => item.required !== false);
  const missingRequiredItems = requiredItems.filter((item) => !item.completed);
  const completedRequiredCount = requiredItems.length - missingRequiredItems.length;
  const allReady = missingRequiredItems.length === 0 && !isCheckingReadiness;

  if (isActive) {
    return (
      <section className="mx-auto max-w-5xl py-8 sm:py-10" aria-labelledby="activation-title">
        <div className="flex flex-col items-start gap-5 rounded-xl border border-success/20 bg-success/5 p-5 sm:flex-row sm:items-center sm:p-7">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success" aria-hidden="true">
            <FiCheck className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-success">Phase A complete</p>
            <h2 id="activation-title" className="mt-1 text-xl font-semibold text-text-primary sm:text-2xl">
              Review workspace ready
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-text-secondary">
              Your project is active. Invite reviewers and create the review process from the project workspace.
            </p>
          </div>
          <Button onClick={() => navigate(`/projects/${projectId}`)} className="w-full shrink-0 gap-2 sm:w-auto">
            Go to project overview <FiArrowRight aria-hidden="true" />
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl py-7 sm:py-9" aria-labelledby="activation-title">
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary" aria-hidden="true">
            <FiZap className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Phase A · Final step</p>
            <h2 id="activation-title" className="mt-1 text-xl font-semibold text-text-primary sm:text-2xl">
              Ready to start your review?
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-text-secondary">
              Review your project setup and activate your systematic review workspace.
            </p>
          </div>
        </div>
        <div
          role="status"
          className={`inline-flex min-h-10 shrink-0 items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-semibold sm:self-center ${
            isCheckingReadiness ? "bg-bg-secondary text-text-secondary" : allReady ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          }`}
        >
          {isCheckingReadiness ? <FiClock aria-hidden="true" /> : allReady ? <FiCheck aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
          {isCheckingReadiness ? "Checking readiness" : allReady ? "Ready to activate" : "Action required"}
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-surface-white shadow-[0_1px_2px_rgba(18,35,49,0.04)]">
        <div className="flex flex-col gap-1 border-b border-border px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Readiness checklist</h3>
            <p className="mt-0.5 text-xs text-text-secondary">
              {isCheckingReadiness ? "Checking project requirements…" : `${completedRequiredCount} of ${requiredItems.length} required checks complete`}
            </p>
          </div>
        </div>

        <ul className="divide-y divide-border/80" aria-label="Project activation requirements">
          {checklist.map((item) => {
            const required = item.required !== false;
            const displayLabel = item.label.replace(/\s+\((Required|Optional)\)$/i, "");
            return (
              <li key={item.id} className="group flex flex-col gap-3 px-4 py-4 transition-colors duration-200 hover:bg-bg-primary/70 sm:flex-row sm:items-center sm:px-6">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isCheckingReadiness
                      ? "bg-bg-secondary text-text-secondary"
                      : item.completed
                      ? "bg-success/10 text-success"
                      : required
                        ? "bg-warning/10 text-warning"
                        : "bg-bg-secondary text-text-secondary"
                  }`}
                  aria-hidden="true"
                >
                  {isCheckingReadiness ? <FiClock className="h-4 w-4" /> : item.completed ? <FiCheck className="h-4 w-4" strokeWidth={2.5} /> : required ? <FiAlertCircle className="h-4 w-4" /> : <FiSettings className="h-4 w-4" />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h4 className="text-sm font-semibold text-text-primary">{displayLabel}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${required ? "bg-primary-light text-primary" : "bg-bg-secondary text-text-secondary"}`}>
                      {required ? "Required" : "Optional"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">{item.description}</p>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <span className={`text-xs font-medium ${isCheckingReadiness ? "text-text-secondary" : item.completed ? "text-success" : required ? "text-warning" : "text-text-secondary"}`}>
                    {isCheckingReadiness ? "Checking…" : item.completed ? "Complete" : required ? "Needs attention" : "Not set"}
                  </span>
                  {!isCheckingReadiness && !item.completed && (
                    <button
                      type="button"
                      onClick={item.onConfigure}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-white px-3 text-xs font-semibold text-text-primary transition-colors hover:border-primary/40 hover:bg-primary-light/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      Configure <FiArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className={`flex flex-col gap-4 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${allReady ? "bg-success/5" : "bg-bg-primary/70"}`}>
          <div className="flex min-w-0 items-start gap-3">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${allReady ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`} aria-hidden="true">
              {isCheckingReadiness ? <FiClock className="h-4 w-4" /> : allReady ? <FiCheck className="h-4 w-4" /> : <FiAlertCircle className="h-4 w-4" />}
            </span>
            <div>
              <p className="text-sm font-semibold text-text-primary">{isCheckingReadiness ? "Checking project readiness" : allReady ? "Your workspace is ready" : "Complete the required items to continue"}</p>
              <p className="mt-0.5 text-xs leading-5 text-text-secondary">
                {isCheckingReadiness
                  ? "The activation action will be available when the check is complete."
                  : allReady
                  ? "Activation unlocks Phase B, reviewer invitations and review-process setup."
                  : `Still required: ${missingRequiredItems.map((item) => item.label.replace(/\s+\((Required|Optional)\)$/i, "")).join(", ")}. Use Configure above to finish.`}
              </p>
            </div>
          </div>
          <Button
            size="md"
            onClick={onActivate}
            disabled={!allReady || isActivating || isCheckingReadiness}
            aria-busy={isActivating}
            className="w-full shrink-0 gap-2 sm:w-auto"
          >
            <FiZap className="h-4 w-4" aria-hidden="true" />
            {isActivating ? "Activating…" : isCheckingReadiness ? "Checking…" : "Activate Project"}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ActivateProjectStep;
