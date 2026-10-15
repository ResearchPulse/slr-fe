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
  <ul aria-label="Quality gate" className="divide-y divide-border border border-border bg-surface-white">
    {gates.map((gate) => (
      <li key={gate.gateId} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">
            {gate.gateId} · {gate.name}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-text-secondary">{gate.reason}</p>
          {gate.remediation && onGoToStep ? (
            <button
              type="button"
              onClick={() => onGoToStep(gate.remediation!.step)}
              className="mt-1 text-xs text-text-primary underline underline-offset-4"
            >
              {gate.remediation.action} Go to {STEP_LABELS[gate.remediation.step]}
            </button>
          ) : null}
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 border px-2 py-0.5 text-xs ${gate.status === "blocked" ? "border-text-primary bg-text-primary text-surface-white" : "border-border text-text-primary"}`}>
          {STATUS[gate.status].icon} {STATUS[gate.status].label}
        </span>
      </li>
    ))}
  </ul>
);

export default QualityGatePanel;
