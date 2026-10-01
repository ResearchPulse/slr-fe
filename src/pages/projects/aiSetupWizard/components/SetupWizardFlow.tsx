import type { PicoCForm, ScopeForm, Step } from "../types";
import { AISkeleton, FieldLabel, StepBadge } from "./Common";

interface SetupWizardFlowProps {
  currentStep: Step;
  completionMap: Record<number, boolean>;
  isAnalyzingIdea: boolean;
  isGeneratingPicoc: boolean;
  isGeneratingRQ: boolean;
  isSavingSetup: boolean;
  topic: string;
  scopeForm: ScopeForm;
  picocForm: PicoCForm;
  rqOptions: string[];
  selectedRqIndexes: number[];
  customRQInput: string;
  customRQs: string[];
  finalizedWizardRQs: string[];
  isStep2Valid: boolean;
  isStep3Valid: boolean;
  onSetCurrentStep: (step: Step) => void;
  onTopicChange: (value: string) => void;
  onScopeChange: (field: keyof ScopeForm, value: string) => void;
  onPicocChange: (field: keyof PicoCForm, value: string) => void;
  onCustomRQInputChange: (value: string) => void;
  onAnalyzeIdea: () => void;
  onGeneratePicoc: () => void;
  onGenerateRQ: () => void;
  onToggleSuggestedRQ: (index: number) => void;
  onAddCustomRQ: () => void;
  onRemoveCustomRQ: (index: number) => void;
  onConfirmAndReview: () => void;
  onSaveWizardSetup: () => void;
}

export default function SetupWizardFlow({
  currentStep,
  completionMap,
  isAnalyzingIdea,
  isGeneratingPicoc,
  isGeneratingRQ,
  isSavingSetup,
  topic,
  scopeForm,
  picocForm,
  rqOptions,
  selectedRqIndexes,
  customRQInput,
  customRQs,
  finalizedWizardRQs,
  isStep2Valid,
  isStep3Valid,
  onSetCurrentStep,
  onTopicChange,
  onScopeChange,
  onPicocChange,
  onCustomRQInputChange,
  onAnalyzeIdea,
  onGeneratePicoc,
  onGenerateRQ,
  onToggleSuggestedRQ,
  onAddCustomRQ,
  onRemoveCustomRQ,
  onConfirmAndReview,
  onSaveWizardSetup,
}: SetupWizardFlowProps) {
  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-4 border-b border-border pb-4 sm:grid-cols-3 lg:grid-cols-5">
        <StepBadge
          step={1}
          currentStep={currentStep}
          label="Research idea"
          complete={completionMap[1]}
        />
        <StepBadge
          step={2}
          currentStep={currentStep}
          label="Scope"
          complete={completionMap[2]}
        />
        <StepBadge
          step={3}
          currentStep={currentStep}
          label="PICO-C"
          complete={completionMap[3]}
        />
        <StepBadge
          step={4}
          currentStep={currentStep}
          label="Research questions"
          complete={completionMap[4]}
        />
        <StepBadge
          step={5}
          currentStep={currentStep}
          label="Summary"
          complete={completionMap[5]}
        />
      </div>

      <div className="bg-surface-white py-2">
        {isAnalyzingIdea && (
          <AISkeleton title="Preparing objective and domain suggestions…" />
        )}

        {!isAnalyzingIdea && currentStep === 1 && (
          <section>
            <h2 className="mb-1 text-xl font-bold text-text-primary">
              Step 1: Research idea
            </h2>
            <p className="mb-6 text-sm text-text-secondary">
              Start with the research idea, then refine its scope in the next
              steps.
            </p>

            <FieldLabel title="Research Topic / Raw Idea" />
            <textarea
              rows={7}
              className="w-full rounded-[4px] border border-slate-300 bg-bg-secondary px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
              placeholder="Describe your idea..."
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
            />

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => onSetCurrentStep(2)}
                disabled={!topic.trim()}
                className="rounded-[4px] bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-none transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {!isGeneratingPicoc && !isAnalyzingIdea && currentStep === 2 && (
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="mb-1 text-xl font-bold text-text-primary">
                  Step 2: Scope Definition
                </h2>
                <p className="text-sm text-text-secondary">
                  Set the objective and domain that will guide the PICO-C
                  framework.
                </p>
              </div>
              <button
                type="button"
                onClick={onAnalyzeIdea}
                className="inline-flex items-center gap-2 rounded-[4px] border border-border bg-surface-white px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-bg-primary"
              >
                Generate suggestions
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[4px] border border-border bg-surface-white p-4">
                <FieldLabel title="Objectives (Goal)" />
                <textarea
                  rows={3}
                  value={scopeForm.objectives}
                  onChange={(e) => onScopeChange("objectives", e.target.value)}
                  className="w-full rounded-[4px] border border-slate-300 bg-surface-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>
              <div className="rounded-[4px] border border-border bg-surface-white p-4">
                <FieldLabel title="Domain" />
                <textarea
                  rows={3}
                  value={scopeForm.domain}
                  onChange={(e) => onScopeChange("domain", e.target.value)}
                  className="w-full rounded-[4px] border border-slate-300 bg-surface-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => onSetCurrentStep(1)}
                className="rounded-[4px] border border-slate-300 px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-bg-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => onSetCurrentStep(3)}
                disabled={!isStep2Valid}
                className="rounded-[4px] bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-none transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {isGeneratingPicoc && (
          <AISkeleton title="Preparing PICO-C suggestions…" />
        )}

        {!isGeneratingRQ && !isGeneratingPicoc && currentStep === 3 && (
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="mb-1 text-xl font-bold text-text-primary">
                  Step 3: PICO-C Breakdown
                </h2>
                <p className="text-sm text-text-secondary">
                  Review suggested fields. Accept, refine, or clear each
                  element.
                </p>
              </div>
              <button
                type="button"
                onClick={onGeneratePicoc}
                disabled={!isStep2Valid}
                className="inline-flex items-center gap-2 rounded-[4px] border border-border bg-surface-white px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-bg-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate suggestions
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  [
                    "population",
                    "Population (P)",
                    3,
                    "The study subjects (people, groups, or issues).",
                  ],
                  [
                    "intervention",
                    "Intervention (I)",
                    3,
                    "The method, technique, or tool being studied.",
                  ],
                  [
                    "comparator",
                    "Comparator (C)",
                    3,
                    "The comparison method (another intervention, placebo, or no intervention).",
                  ],
                  [
                    "outcome",
                    "Outcome (O)",
                    3,
                    "The desired or measured results.",
                  ],
                  [
                    "context",
                    "Context (C)",
                    3,
                    "The setting, environment, or scope of the study (e.g., company context, social domain).",
                  ],
                ] as const
              ).map(([key, label, rows, description]) => (
                <div
                  key={key}
                  className={[
                    "rounded-[4px] border border-border bg-surface-white p-4",
                    key === "context" ? "sm:col-span-2" : "",
                  ].join(" ")}
                >
                  <FieldLabel title={label} />
                  <p className="mb-2 text-xs text-text-secondary italic leading-relaxed">
                    {description}
                  </p>
                  <textarea
                    rows={rows}
                    value={picocForm[key]}
                    onChange={(e) => onPicocChange(key, e.target.value)}
                    className="w-full rounded-[4px] border border-slate-300 bg-surface-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                  />
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => onPicocChange(key, "")}
                      className="text-xs font-medium text-text-secondary transition hover:text-text-primary"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => onSetCurrentStep(2)}
                className="rounded-[4px] border border-slate-300 px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-bg-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => onSetCurrentStep(4)}
                disabled={!isStep3Valid}
                className="rounded-[4px] bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-none transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {isGeneratingRQ && (
          <AISkeleton title="Generating candidate research questions..." />
        )}

        {!isGeneratingRQ && currentStep === 4 && (
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="mb-1 text-xl font-bold text-text-primary">
                  Step 4: Research Question Formulation
                </h2>
                <p className="text-sm text-text-secondary">
                  Select suggested options and/or add custom research questions.
                </p>
              </div>
              <button
                type="button"
                onClick={onGenerateRQ}
                disabled={!isStep3Valid}
                className="inline-flex items-center gap-2 rounded-[4px] border border-border bg-surface-white px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-bg-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate suggestions
              </button>
            </div>

            {/* PICO-C Reference Section */}
            <div className="mb-8 rounded-[4px] border border-border bg-bg-primary p-5">
              <div className="mb-3 flex items-center gap-2 text-accent">
                <p className="text-xs font-bold uppercase tracking-wider">
                  PICO-C Reference
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-text-secondary">
                    Population
                  </p>
                  <p className="text-xs leading-relaxed text-text-primary line-clamp-3">
                    {picocForm.population || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-text-secondary">
                    Intervention
                  </p>
                  <p className="text-xs leading-relaxed text-text-primary line-clamp-3">
                    {picocForm.intervention || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-text-secondary">
                    Comparator
                  </p>
                  <p className="text-xs leading-relaxed text-text-primary line-clamp-3">
                    {picocForm.comparator || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-text-secondary">
                    Outcome
                  </p>
                  <p className="text-xs leading-relaxed text-text-primary line-clamp-3">
                    {picocForm.outcome || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-text-secondary">
                    Context
                  </p>
                  <p className="text-xs leading-relaxed text-text-primary line-clamp-3">
                    {picocForm.context || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {rqOptions.length === 0 && (
                <div className="rounded-[4px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  No suggestions were returned. Please add custom research
                  questions manually.
                </div>
              )}

              {rqOptions.map((option, index) => {
                const selected = selectedRqIndexes.includes(index);
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => onToggleSuggestedRQ(index)}
                    className={[
                      "w-full rounded-[4px] border p-4 text-left transition",
                      selected
                        ? "border-accent bg-bg-secondary"
                        : "border-border bg-surface-white hover:border-slate-300",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                      Option {String.fromCharCode(65 + index)}
                    </span>
                    <p className="text-sm leading-relaxed text-text-primary">
                      {option}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[4px] border border-border bg-bg-secondary p-4">
              <FieldLabel title="Custom RQ (Optional, multiple allowed)" />
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={customRQInput}
                  onChange={(e) => onCustomRQInputChange(e.target.value)}
                  placeholder="Write a custom research question, then click Add"
                  className="w-full rounded-[4px] border border-slate-300 bg-surface-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onAddCustomRQ}
                    disabled={!customRQInput.trim()}
                    className="rounded-[4px] border border-slate-300 bg-surface-white px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add Custom RQ
                  </button>
                </div>

                {customRQs.length > 0 && (
                  <div className="space-y-2">
                    {customRQs.map((rq, index) => (
                      <div
                        key={`${rq}-${index}`}
                        className="flex items-start justify-between gap-3 rounded-[4px] border border-border bg-surface-white p-3"
                      >
                        <p className="text-sm text-text-primary">{rq}</p>
                        <button
                          type="button"
                          onClick={() => onRemoveCustomRQ(index)}
                          className="shrink-0 text-xs font-medium text-text-secondary transition hover:text-text-primary"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => onSetCurrentStep(3)}
                className="rounded-[4px] border border-slate-300 px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-bg-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onConfirmAndReview}
                className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-none transition hover:bg-primary-hover"
              >
                Confirm & Review
              </button>
            </div>
          </section>
        )}

        {currentStep === 5 && (
          <section>
            <h2 className="mb-1 text-xl font-bold text-text-primary">
              Step 5: Summary & Finalization
            </h2>
            <p className="mb-6 text-sm text-text-secondary">
              Review setup details before saving them to this project.
            </p>

            <div className="space-y-5">
              <div className="rounded-[4px] border border-border bg-surface-white p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Finalized Topic
                </p>
                <p className="text-sm leading-relaxed text-slate-800">
                  {topic}
                </p>
              </div>

              <div className="rounded-[4px] border border-border bg-surface-white p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Scope Definition
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-text-secondary">
                      Objectives
                    </p>
                    <p className="text-sm text-slate-800">
                      {scopeForm.objectives}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-secondary">
                      Domain
                    </p>
                    <p className="text-sm text-slate-800">{scopeForm.domain}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[4px] border border-border bg-surface-white p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  PICO-C Structure
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-text-secondary">
                      Population (P)
                    </p>
                    <p className="text-sm text-slate-800">
                      {picocForm.population}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-secondary">
                      Intervention (I)
                    </p>
                    <p className="text-sm text-slate-800">
                      {picocForm.intervention}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-secondary">
                      Comparator (C)
                    </p>
                    <p className="text-sm text-slate-800">
                      {picocForm.comparator}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-secondary">
                      Outcome (O)
                    </p>
                    <p className="text-sm text-slate-800">
                      {picocForm.outcome}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-text-secondary">
                      Context (C)
                    </p>
                    <p className="text-sm text-slate-800">
                      {picocForm.context}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[4px] border border-border bg-bg-primary p-5">
                <div className="mb-2 border-b border-border pb-2 text-sm font-semibold text-text-primary">
                  Final Research Questions
                </div>
                <div className="space-y-2">
                  {finalizedWizardRQs.length === 0 && (
                    <p className="text-sm text-text-primary">
                      No research questions added yet.
                    </p>
                  )}
                  {finalizedWizardRQs.map((rq, index) => (
                    <div
                      key={`${rq}-${index}`}
                      className="rounded-[4px] border border-border bg-surface-white p-3"
                    >
                      <p className="text-xs font-semibold text-accent">
                        RQ {index + 1}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-800">
                        {rq}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => onSetCurrentStep(4)}
                className="rounded-[4px] border border-slate-300 px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-bg-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onSaveWizardSetup}
                disabled={isSavingSetup}
                className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-none transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingSetup ? "Saving..." : "Save Details"}
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
