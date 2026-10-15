import React, { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiDownload } from "react-icons/fi";
import { picocWizardStateService } from "../../../services/picocWizardStateService";
import ComponentStep, { type SuggestionCacheEntry } from "./ComponentStep";
import FieldStep from "./FieldStep";
import IntentStep from "./IntentStep";
import PicocCanvas from "./PicocCanvas";
import QualityGatePanel from "./QualityGatePanel";
import { STEP_LABELS } from "./picocDraft";
import { usePicocWizard, type SaveStatus } from "./usePicocWizard";
import { WIZARD_STEPS, type PicocComponent, type WizardStep } from "./types";

interface PicocWizardProps {
  projectId: string;
  /** Only the project OWNER edits; other members see the canvas and gate read-only. */
  canEdit: boolean;
}

const SAVE_TEXT: Record<SaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Draft saved",
  error: "Not saved — will retry on your next change",
  conflict: "",
};

async function download(projectId: string, format: "json" | "md") {
  const blob = await picocWizardStateService.exportFile(projectId, format);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `picoc-${projectId}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

const PicocWizard: React.FC<PicocWizardProps> = ({ projectId, canEdit }) => {
  const { record, draft, loadError, saveStatus, update, saveNow, reload, runSemanticCheck } = usePicocWizard(projectId, canEdit);
  const [semanticState, setSemanticState] = useState<"idle" | "running" | "failed">("idle");
  // Mutable per-session cache shared by the component steps; never rendered directly.
  const [suggestionCache] = useState<Partial<Record<PicocComponent, SuggestionCacheEntry>>>(() => ({}));
  const startedTracked = useRef(false);
  const activeStep = draft?.currentStep;
  const revision = record?.revision;

  useEffect(() => {
    if (canEdit && revision === 0 && !startedTracked.current) {
      startedTracked.current = true;
      picocWizardStateService.track(projectId, "wizard_started");
    }
  }, [canEdit, projectId, revision]);

  // Gate results are reported when the user reviews them, one event per unresolved gate.
  useEffect(() => {
    if (!canEdit || activeStep !== "review" || !record) return;
    for (const gate of record.qualityGate) {
      if (gate.status === "blocked" || gate.status === "needs_review") {
        picocWizardStateService.track(projectId, "quality_gate_triggered", { gateId: gate.gateId, gateStatus: gate.status });
      }
    }
    // Fires on entering the review step and whenever a new revision is evaluated there.
  }, [canEdit, projectId, activeStep, revision, record]);

  if (loadError) {
    return (
      <div role="alert" className="border border-border bg-surface-white p-6 text-sm">
        {loadError}{" "}
        <button type="button" onClick={() => void reload()} className="underline underline-offset-4">Retry</button>
      </div>
    );
  }
  if (!draft || !record) return <p role="status" className="p-6 text-sm text-text-secondary">Loading PICOC…</p>;

  if (!canEdit) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">The project leader defines the PICOC. You are viewing the current draft.</p>
          <QualityGatePanel gates={record.qualityGate} />
        </div>
        <PicocCanvas draft={draft} />
      </div>
    );
  }

  const step = draft.currentStep;
  const stepIndex = WIZARD_STEPS.indexOf(step);
  // Moving between steps is saved, so reopening the project resumes at the same step.
  const goTo = (next: WizardStep) => update((value) => ({ ...value, currentStep: next }));

  const renderStep = () => {
    switch (step) {
      case "intent":
        return <IntentStep draft={draft} update={update} />;
      case "field":
        return <FieldStep projectId={projectId} draft={draft} update={update} />;
      case "review":
        return (
          <section aria-labelledby="picoc-step-review" className="space-y-4">
            <header>
              <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary">Review & save</p>
              <h3 id="picoc-step-review" className="mt-1 font-cormorant text-[28px] text-text-primary">Check the PICOC before moving on</h3>
              <p className="mt-1 text-sm text-text-secondary">Gates are recalculated on every save. The draft can be saved even when a gate is not passed.</p>
            </header>
            <QualityGatePanel gates={record.qualityGate} onGoToStep={goTo} />
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              <button
                type="button"
                disabled={semanticState === "running"}
                onClick={async () => {
                  setSemanticState("running");
                  try {
                    setSemanticState((await runSemanticCheck()) ? "idle" : "failed");
                  } catch {
                    setSemanticState("failed");
                  }
                }}
                className="border border-text-primary px-3 py-2 text-xs text-text-primary disabled:opacity-40"
              >
                {semanticState === "running" ? "Checking…" : "Run AI consistency check (G3, G5)"}
              </button>
              <span>AI suggestions only — they can flag terms for review but never block saving.</span>
              {semanticState === "failed" ? <span role="alert" className="text-text-primary">The AI check could not run. Try again later.</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void saveNow(true)} className="border border-text-primary bg-text-primary px-4 py-2 text-xs text-surface-white">Save draft</button>
              <button type="button" onClick={() => void download(projectId, "md")} className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs"><FiDownload aria-hidden /> Markdown</button>
              <button type="button" onClick={() => void download(projectId, "json")} className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs"><FiDownload aria-hidden /> JSON</button>
            </div>
          </section>
        );
      default:
        return <ComponentStep key={step} projectId={projectId} component={step} draft={draft} update={update} cache={suggestionCache} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary">PICOC · Step {stepIndex + 1}/{WIZARD_STEPS.length}</p>
          <p className="text-xs text-text-muted">You can leave at any time — progress is saved and you will resume here.</p>
        </div>
        <p aria-live="polite" className="text-xs text-text-secondary">{SAVE_TEXT[saveStatus]}</p>
      </div>

      {saveStatus === "conflict" ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-text-primary bg-bg-secondary p-3 text-sm">
          <span>Someone else saved this PICOC. Your latest changes were not saved. Reload to continue from their version.</span>
          <button type="button" onClick={() => void reload()} className="border border-text-primary px-3 py-1 text-xs">Reload</button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)_300px]">
        <nav aria-label="PICOC steps">
          <ol className="flex gap-1 overflow-x-auto lg:flex-col">
            {WIZARD_STEPS.map((item, index) => (
              <li key={item}>
                <button
                  type="button"
                  aria-current={item === step ? "step" : undefined}
                  onClick={() => goTo(item)}
                  className={`w-full whitespace-nowrap px-3 py-2 text-left text-xs ${item === step ? "bg-text-primary text-surface-white" : "text-text-secondary hover:text-text-primary"}`}
                >
                  {index + 1}. {STEP_LABELS[item]}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-6">
          {renderStep()}
          <div className="flex justify-between border-t border-border pt-4">
            <button type="button" disabled={stepIndex === 0} onClick={() => goTo(WIZARD_STEPS[stepIndex - 1])} className="inline-flex items-center gap-1 border border-border px-4 py-2 text-xs disabled:opacity-40">
              <FiArrowLeft aria-hidden /> Back
            </button>
            {stepIndex < WIZARD_STEPS.length - 1 ? (
              <button type="button" onClick={() => goTo(WIZARD_STEPS[stepIndex + 1])} className="inline-flex items-center gap-1 border border-text-primary bg-text-primary px-4 py-2 text-xs text-surface-white">
                Continue <FiArrowRight aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        <PicocCanvas draft={draft} onSelectStep={goTo} />
      </div>
    </div>
  );
};

export default PicocWizard;
