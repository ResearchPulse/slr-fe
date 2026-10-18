import React, { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiCheck, FiDownload, FiRefreshCw } from "react-icons/fi";
import { picocWizardStateService } from "../../../services/picocWizardStateService";
import ComponentStep, { type SuggestionCacheEntry } from "./ComponentStep";
import FieldStep from "./FieldStep";
import IntentStep from "./IntentStep";
import PicocCanvas from "./PicocCanvas";
import QualityGatePanel from "./QualityGatePanel";
import { buildBatchSuggestionContext, STEP_LABELS, upstreamSignature } from "./picocDraft";
import { usePicocWizard, type SaveStatus } from "./usePicocWizard";
import { PICOC_COMPONENTS, WIZARD_STEPS, type PicocComponent, type WizardStep } from "./types";
import { toastError, toastSuccess, toastWarning } from "../../../utils/toast";

interface PicocWizardProps {
  projectId: string;
  /** Only the project OWNER edits; other members see the canvas and gate read-only. */
  canEdit: boolean;
  onScopeCompletionChange?: (complete: boolean) => void;
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

const PicocWizard: React.FC<PicocWizardProps> = ({ projectId, canEdit, onScopeCompletionChange }) => {
  const { record, draft, loadError, saveStatus, update, saveNow, reload, runSemanticCheck } = usePicocWizard(projectId, canEdit);
  const [semanticState, setSemanticState] = useState<"idle" | "running" | "failed">("idle");
  // Mutable per-session cache shared by the component steps; never rendered directly.
  const [suggestionCache, setSuggestionCache] = useState<Partial<Record<PicocComponent, SuggestionCacheEntry>>>(() => ({}));
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const startedTracked = useRef(false);
  const activeStep = draft?.currentStep;
  const revision = record?.revision;

  useEffect(() => {
    const requiredGates = record?.qualityGate.filter((gate) => gate.gateId === "G1" || gate.gateId === "G2") ?? [];
    const scopeComplete = record?.currentStep === "review"
      && requiredGates.length === 2
      && requiredGates.every((gate) => gate.status === "passed");
    onScopeCompletionChange?.(scopeComplete);
  }, [record, onScopeCompletionChange]);

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
      <div role="alert" className="rounded-xl border border-error/30 bg-surface-white p-5 text-sm text-text-primary sm:p-6">
        {loadError}{" "}
        <button type="button" onClick={() => void reload()} className="ml-1 inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4"><FiRefreshCw aria-hidden /> Retry</button>
      </div>
    );
  }
  if (!draft || !record) return <p role="status" className="p-6 text-sm text-text-secondary">Loading PICOC…</p>;

  if (!canEdit) {
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-xl border border-border bg-surface-white p-5 sm:p-6">
          <p className="text-sm leading-6 text-text-secondary">The project leader defines the PICOC. You are viewing the current draft.</p>
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

  const handleSaveDraft = async () => {
    const result = await saveNow(true);
    if (result === "saved") toastSuccess("Draft saved", "Your PICOC changes are saved.");
    else if (result === "conflict") toastWarning("Draft conflict", "Reload the latest version before saving again.");
    else if (result === "error") toastError("Draft not saved", "Check your connection and try again.");
  };

  const generateAllSuggestions = async (navigateToContext = false) => {
    if (!draft.intent.topic.trim() || batchLoading) return;
    setBatchLoading(true);
    setBatchError(null);
    try {
      const result = await picocWizardStateService.suggestBatch(projectId, buildBatchSuggestionContext(draft));
      const nextCache: Partial<Record<PicocComponent, SuggestionCacheEntry>> = {};
      for (const component of PICOC_COMPONENTS) {
        const entry = result.components[component];
        nextCache[component] = {
          signature: upstreamSignature(draft, component),
          suggestions: entry.suggestions,
          source: entry.source,
          fallbackReason: entry.fallbackReason,
        };
        picocWizardStateService.track(projectId, "suggestion_viewed", {
          component,
          source: entry.source,
          count: entry.suggestions.length,
        });
      }
      setSuggestionCache(nextCache);
      if (navigateToContext) goTo("context");
    } catch {
      setBatchError("Could not generate PICOC suggestions. Check the AI quota or try again later; you can still add terms manually.");
    } finally {
      setBatchLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "intent":
        return <IntentStep draft={draft} update={update} onChooseResearchField={() => goTo("field")} />;
      case "field":
        return (
          <div className="space-y-4">
            <FieldStep projectId={projectId} draft={draft} update={update} />
            <div className="rounded-xl border border-border bg-bg-primary/60 p-4">
              <p className="text-sm font-semibold text-text-primary">Ready to set up the PICOC?</p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">Generate a small set of suggestions for all five components in one AI request, then review them one step at a time.</p>
              <button type="button" disabled={!draft.researchField || batchLoading} onClick={() => void generateAllSuggestions(true)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
                <FiRefreshCw aria-hidden className={batchLoading ? "motion-safe:animate-spin motion-reduce:animate-none" : undefined} /> {batchLoading ? "Generating all five steps…" : "Generate PICOC suggestions"}
              </button>
            </div>
          </div>
        );
      case "review":
        return (
          <section aria-labelledby="picoc-step-review" className="space-y-4">
            <header>
              <p className="text-xs font-semibold text-primary">Review &amp; save</p>
              <h3 id="picoc-step-review" className="mt-1 text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">Check the PICOC before moving on</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Gates are recalculated on every save. The draft can be saved even when a gate is not passed.</p>
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
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface-white px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {semanticState === "running" ? "Checking…" : "Run AI consistency check (G3, G5)"}
              </button>
              <span>AI suggestions only — they can flag terms for review but never block saving.</span>
              {semanticState === "failed" ? <span role="alert" className="text-text-primary">The AI check could not run. Try again later.</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saveStatus === "saving"} onClick={() => void handleSaveDraft()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70">
                {saveStatus === "saving" ? <FiRefreshCw aria-hidden className="motion-safe:animate-spin motion-reduce:animate-none" /> : <FiCheck aria-hidden />}
                {saveStatus === "saving" ? "Saving…" : "Save draft"}
              </button>
              <button type="button" onClick={() => void download(projectId, "md")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface-white px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-secondary"><FiDownload aria-hidden /> Markdown</button>
              <button type="button" onClick={() => void download(projectId, "json")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface-white px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-secondary"><FiDownload aria-hidden /> JSON</button>
            </div>
          </section>
        );
      default:
        return <ComponentStep key={step} projectId={projectId} component={step} draft={draft} update={update} cache={suggestionCache} onGenerateAll={() => void generateAllSuggestions()} batchLoading={batchLoading} />;
    }
  };

  const progress = Math.round(((stepIndex + 1) / WIZARD_STEPS.length) * 100);
  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="rounded-xl border border-border bg-surface-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-primary">PICOC protocol</p>
            <p className="mt-1 text-xs text-text-secondary">You can leave at any time — progress is saved and you will resume here.</p>
          </div>
          <p aria-live="polite" className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium ${saveStatus === "error" || saveStatus === "conflict" ? "border-warning/30 bg-warning/10 text-warning" : "border-border bg-bg-primary text-text-secondary"}`}>
            {saveStatus === "saved" ? <FiCheck aria-hidden /> : saveStatus === "saving" ? <FiRefreshCw className="animate-spin" aria-hidden /> : null}
            {SAVE_TEXT[saveStatus] || "Autosave on"}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-secondary" role="progressbar" aria-label="PICOC progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="shrink-0 text-xs font-medium text-text-secondary">PICOC {"\u00b7"} Step {stepIndex + 1}/{WIZARD_STEPS.length}</span>
        </div>
      </header>

      {saveStatus === "conflict" ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-text-primary">
          <span>Someone else saved this PICOC. Your latest changes were not saved. Reload to continue from their version.</span>
          <button type="button" onClick={() => void reload()} className="min-h-9 rounded-lg border border-border bg-surface-white px-3 text-xs font-semibold text-text-primary hover:bg-bg-secondary">Reload</button>
        </div>
      ) : null}

      {batchError ? (
        <div role="status" className="flex justify-end rounded-xl border border-border bg-bg-primary/60 p-3">
          <button type="button" disabled={batchLoading} onClick={() => void generateAllSuggestions()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface-white px-3 text-xs font-semibold hover:bg-bg-secondary disabled:opacity-50">
            <FiRefreshCw aria-hidden className={batchLoading ? "motion-safe:animate-spin motion-reduce:animate-none" : undefined} />
            {batchLoading ? "Retrying…" : "Retry"}
          </button>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[208px_minmax(0,1fr)_300px] xl:gap-5">
        <nav aria-label="PICOC steps" className="rounded-xl border border-border bg-surface-white p-2 lg:sticky lg:top-4">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold text-text-secondary">YOUR QUESTION</p>
          <ol className="flex gap-1 overflow-x-auto lg:flex-col">
            {WIZARD_STEPS.map((item, index) => (
              <li key={item} className="min-w-max lg:min-w-0">
                <button
                  type="button"
                  aria-current={item === step ? "step" : undefined}
                  onClick={() => goTo(item)}
                  className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${item === step ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-bg-primary hover:text-text-primary"}`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] ${item === step ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary"}`}>{index + 1}</span>
                  <span>{STEP_LABELS[item]}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0 rounded-xl border border-border bg-surface-white p-4 sm:p-6">
          {renderStep()}
          <div className="mt-6 flex justify-between border-t border-border pt-4">
            <button type="button" disabled={stepIndex === 0} onClick={() => goTo(WIZARD_STEPS[stepIndex - 1])} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface-white px-4 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50">
              <FiArrowLeft aria-hidden /> Back
            </button>
            {stepIndex < WIZARD_STEPS.length - 1 ? (
              <button type="button" onClick={() => goTo(WIZARD_STEPS[stepIndex + 1])} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2">
                Continue <FiArrowRight aria-hidden />
              </button>
            ) : null}
          </div>
        </main>

        <PicocCanvas draft={draft} onSelectStep={goTo} />
      </div>
    </div>
  );
};

export default PicocWizard;
