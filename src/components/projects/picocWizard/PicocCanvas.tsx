import React from "react";
import { FiAlertTriangle, FiCheck, FiHelpCircle, FiLayers } from "react-icons/fi";
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
      className="inline-flex min-h-11 items-center rounded-sm px-1 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {label}
    </button>
  ) : (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">{label}</p>
  );

  const renderComponent = (component: PicocComponent) => {
    const items = draft.picoc[component];
    const selectedCount = items.filter((item) => item.status === "selected").length;
    const notApplicable = component === "comparison" ? draft.comparisonNotApplicable : null;
    return (
      <li key={component} className="border-b border-border px-4 py-3 last:border-b-0" data-testid={`canvas-${component}`}>
        <div className="flex items-center justify-between gap-2">
          {heading(component, COMPONENT_LABELS[component])}
          {selectedCount > 0 ? <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium text-primary">{selectedCount} selected</span> : null}
        </div>
        {notApplicable ? (
          <p className="mt-2 rounded-lg bg-bg-secondary px-2.5 py-2 text-xs leading-5 text-text-primary">N/A — <span className="text-text-secondary">{notApplicable.reason}</span></p>
        ) : null}
        {items.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex min-w-0 items-start gap-2 rounded-lg border px-2.5 py-2 text-xs leading-5 ${
                  item.status === "selected" ? "border-primary/20 bg-primary-light/60 text-text-primary" : "border-border bg-surface-white text-text-secondary"
                }`}
              >
                <span className="mt-0.5 shrink-0 text-primary" aria-hidden="true">
                  {item.status === "unsure" ? <FiHelpCircle className="h-3.5 w-3.5 text-text-secondary" /> : <FiCheck className="h-3.5 w-3.5" />}
                </span>
                {item.needsReview ? <FiAlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" /> : null}
                <span className="min-w-0 flex-1 break-words">{item.label}</span>
                <span className="shrink-0 text-[10px] text-text-secondary">· {ORIGIN_LABELS[item.origin]}</span>
                {item.status === "unsure" ? <span className="sr-only">(not sure)</span> : null}
                {item.needsReview ? <span className="shrink-0 text-[10px] font-medium text-warning">· needs review</span> : null}
              </li>
            ))}
          </ul>
        ) : !notApplicable ? (
          <p className="mt-1.5 text-xs italic text-text-secondary">Not set</p>
        ) : null}
      </li>
    );
  };

  return (
    <aside aria-label="PICOC canvas" className="overflow-hidden rounded-xl border border-border bg-surface-white lg:sticky lg:top-4">
      <div className="flex items-center justify-between border-b border-border bg-bg-primary px-4 py-3">
        <div className="flex items-center gap-2 text-primary">
          <FiLayers aria-hidden className="h-4 w-4" />
          <p className="text-xs font-semibold text-text-primary">PICOC canvas</p>
        </div>
        <span className="rounded-full border border-border bg-surface-white px-2 py-0.5 text-[10px] font-medium text-text-secondary">Draft</span>
      </div>
      <div className="max-h-[min(70vh,680px)] overflow-y-auto">
        <div className="border-b border-border px-4 py-3">
          {heading("field", "Research field")}
          {field ? (
            <div className="mt-2">
              <p className="text-sm font-semibold leading-5 text-text-primary">{field.topic.label}</p>
              {fieldPath ? <p className="mt-0.5 text-xs leading-5 text-text-secondary">{fieldPath}</p> : null}
              <p className="mt-1 text-[10px] text-text-secondary">
                {field.source === "openalex_suggestion" ? `OpenAlex suggestion · classifier v${field.classifierVersion}` : "Chosen manually from OpenAlex taxonomy"}
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-xs italic text-text-secondary">Not confirmed</p>
          )}
        </div>
        <ul>{PICOC_COMPONENTS.map(renderComponent)}</ul>
      </div>
    </aside>
  );
};

export default PicocCanvas;
