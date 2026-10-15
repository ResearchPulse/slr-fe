import React from "react";
import { FiAlertTriangle, FiHelpCircle } from "react-icons/fi";
import { COMPONENT_LABELS, ORIGIN_LABELS } from "./picocDraft";
import { PICOC_COMPONENTS, type PicocComponent, type PicocWizardDraft, type WizardStep } from "./types";

interface PicocCanvasProps {
  draft: PicocWizardDraft;
  onSelectStep?: (step: WizardStep) => void;
}

/** Live PICOC canvas in P–I–C–O–C order. Clicking a component jumps to its wizard step. */
const PicocCanvas: React.FC<PicocCanvasProps> = ({ draft, onSelectStep }) => {
  const field = draft.researchField;
  const fieldPath = field
    ? [field.domain?.label, field.field?.label, field.subfield?.label].filter(Boolean).join(" → ")
    : null;

  const heading = (step: WizardStep, label: string) => onSelectStep ? (
    <button
      type="button"
      onClick={() => onSelectStep(step)}
      className="text-left text-[11px] uppercase tracking-[0.2em] text-text-secondary underline-offset-4 hover:text-text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
    >
      {label}
    </button>
  ) : (
    <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">{label}</p>
  );

  const renderComponent = (component: PicocComponent) => {
    const items = draft.picoc[component];
    const notApplicable = component === "comparison" ? draft.comparisonNotApplicable : null;
    return (
      <li key={component} className="border-b border-border px-4 py-3 last:border-b-0" data-testid={`canvas-${component}`}>
        {heading(component, COMPONENT_LABELS[component])}
        {notApplicable ? (
          <p className="mt-1.5 text-sm text-text-primary">N/A — <span className="text-text-secondary">{notApplicable.reason}</span></p>
        ) : null}
        {items.length > 0 ? (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {items.map((item) => (
              <li
                key={item.id}
                className={`inline-flex items-center gap-1 border px-2 py-0.5 text-xs ${
                  item.status === "selected" ? "border-text-primary text-text-primary" : "border-dashed border-border text-text-secondary"
                }`}
              >
                {item.status === "unsure" ? <FiHelpCircle aria-hidden className="h-3 w-3" /> : null}
                {item.needsReview ? <FiAlertTriangle aria-hidden className="h-3 w-3" /> : null}
                <span>{item.label}</span>
                <span className="text-[10px] text-text-muted">· {ORIGIN_LABELS[item.origin]}</span>
                {item.status === "unsure" ? <span className="sr-only">(not sure)</span> : null}
                {item.needsReview ? <span className="text-[10px] text-text-secondary">· needs review</span> : null}
              </li>
            ))}
          </ul>
        ) : !notApplicable ? (
          <p className="mt-1.5 text-xs italic text-text-muted">Not set</p>
        ) : null}
      </li>
    );
  };

  return (
    <aside aria-label="PICOC canvas" className="border border-border bg-surface-white">
      <div className="border-b border-border bg-bg-primary px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.25em] text-text-secondary">PICOC canvas · Draft</p>
      </div>
      <div className="border-b border-border px-4 py-3">
        {heading("field", "Research field")}
        {field ? (
          <div className="mt-1.5">
            <p className="text-sm font-medium text-text-primary">{field.topic.label}</p>
            {fieldPath ? <p className="text-xs text-text-secondary">{fieldPath}</p> : null}
            <p className="mt-0.5 text-[10px] text-text-muted">
              {field.source === "openalex_suggestion" ? `OpenAlex suggestion · classifier v${field.classifierVersion}` : "Chosen manually from OpenAlex taxonomy"}
            </p>
          </div>
        ) : (
          <p className="mt-1.5 text-xs italic text-text-muted">Not confirmed</p>
        )}
      </div>
      <ul>{PICOC_COMPONENTS.map(renderComponent)}</ul>
    </aside>
  );
};

export default PicocCanvas;
