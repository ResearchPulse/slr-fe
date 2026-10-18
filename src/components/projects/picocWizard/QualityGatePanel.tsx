import React from "react";
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiMinusCircle } from "react-icons/fi";
import { STEP_LABELS } from "./picocDraft";
import type { GateStatus, QualityGateResult, WizardStep } from "./types";

const STATUS: Record<GateStatus, { label: string; icon: React.ReactNode }> = {
  passed: { label: "Passed", icon: <FiCheckCircle aria-hidden /> },
  needs_review: { label: "Needs Review", icon: <FiAlertTriangle aria-hidden /> },
  blocked: { label: "Blocked", icon: <FiAlertCircle aria-hidden /> },
  not_run: { label: "Not Run", icon: <FiMinusCircle aria-hidden /> },
};

interface QualityGatePanelProps {
  gates: QualityGateResult[];
  onGoToStep?: (step: WizardStep) => void;
}

/** Each gate shows its status as text and icon (never colour alone); there is no overall score. */
const QualityGatePanel: React.FC<QualityGatePanelProps> = ({ gates, onGoToStep }) => (
  <ul aria-label="Quality gate" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-white">
    {gates.map((gate) => (
      <li key={gate.gateId} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">
            {gate.gateId} {"\u00b7"} {gate.name}
          </p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">{gate.reason}</p>
          {gate.remediation && onGoToStep ? (
            <button
              type="button"
              onClick={() => onGoToStep(gate.remediation!.step)}
              className="mt-2 inline-flex min-h-8 items-center rounded-md text-xs font-medium text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {gate.remediation.action} Go to {STEP_LABELS[gate.remediation.step]}
            </button>
          ) : null}
        </div>
        <span className={`inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${gate.status === "passed" ? "border-success/20 bg-success/10 text-success" : gate.status === "needs_review" ? "border-warning/25 bg-warning/10 text-warning" : gate.status === "blocked" ? "border-error/20 bg-error/10 text-error" : "border-border bg-bg-primary text-text-secondary"}`}>
          {STATUS[gate.status].icon} {STATUS[gate.status].label}
        </span>
      </li>
    ))}
  </ul>
);

export default QualityGatePanel;
