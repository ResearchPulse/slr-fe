import React from "react";
import { FiArrowRight } from "react-icons/fi";
import type { PicocWizardDraft, ReviewType } from "./types";

interface IntentStepProps {
  draft: PicocWizardDraft;
  update: (change: (current: PicocWizardDraft) => PicocWizardDraft) => void;
  onChooseResearchField: () => void;
}

const REVIEW_TYPES: Array<{ value: ReviewType; label: string; hint: string }> = [
  { value: "mapping", label: "Mapping", hint: "Map what has been studied; a comparator is often not applicable." },
  { value: "comparative", label: "Comparative", hint: "Compare an intervention against alternatives or baselines." },
  { value: "exploratory", label: "Exploratory", hint: "Explore an emerging topic and its open questions." },
];

const IntentStep: React.FC<IntentStepProps> = ({ draft, update, onChooseResearchField }) => (
  <section aria-labelledby="picoc-step-intent" className="space-y-7">
    <header>
      <p className="text-xs font-semibold text-primary">Research intent</p>
      <h3 id="picoc-step-intent" className="mt-1 text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">What will this review be about?</h3>
      <p className="mt-2 text-sm leading-6 text-text-secondary">Start with the topic and choose the kind of review you are planning.</p>
    </header>

    <div>
      <label htmlFor="picoc-topic" className="text-sm font-semibold text-text-primary">Research topic</label>
      <input
        id="picoc-topic"
        value={draft.intent.topic}
        maxLength={200}
        onChange={(event) => update((value) => ({ ...value, intent: { ...value.intent, topic: event.target.value } }))}
        className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface-white px-3.5 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        placeholder="e.g. Byzantine-robust asynchronous federated learning at the edge"
      />
    </div>

    <div>
      <label htmlFor="picoc-description" className="text-sm font-semibold text-text-primary">Short description</label>
      <textarea
        id="picoc-description"
        value={draft.intent.description}
        maxLength={4000}
        rows={4}
        onChange={(event) => update((value) => ({ ...value, intent: { ...value.intent, description: event.target.value } }))}
        className="mt-2 w-full resize-y rounded-lg border border-border bg-surface-white px-3.5 py-3 text-sm leading-6 text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        placeholder="One or two sentences on the problem, setting and what you want to learn. More detail gives better field and term suggestions."
      />
    </div>

    <section aria-labelledby="picoc-intent-field-title" className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${draft.researchField ? "border-primary/20 bg-primary-light/40" : "border-border bg-bg-primary/60"}`}>
      <div className="min-w-0">
        <p id="picoc-intent-field-title" className="text-sm font-semibold text-text-primary">Research field</p>
        {draft.researchField ? (
          <>
            <p className="mt-1 text-sm font-medium text-primary">{draft.researchField.topic.label}</p>
            <p className="mt-0.5 text-xs text-text-secondary">{[draft.researchField.domain?.label, draft.researchField.field?.label, draft.researchField.subfield?.label].filter(Boolean).join(" → ")}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-text-secondary">Not selected yet. Choose a topic from the OpenAlex research taxonomy.</p>
        )}
      </div>
      <button type="button" onClick={onChooseResearchField} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/25 bg-surface-white px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
        {draft.researchField ? "Change research field" : "Choose research field"} <FiArrowRight aria-hidden />
      </button>
    </section>

    <fieldset>
      <legend className="text-sm font-semibold text-text-primary">Review type</legend>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {REVIEW_TYPES.map((type) => (
          <label
            key={type.value}
            className={`flex min-h-32 cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary/20 ${draft.reviewType === type.value ? "border-primary bg-primary-light/60" : "border-border bg-surface-white hover:bg-bg-primary"}`}
          >
            <input
              type="radio"
              name="picoc-review-type"
              value={type.value}
              checked={draft.reviewType === type.value}
              onChange={() => update((value) => ({ ...value, reviewType: type.value }))}
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
            />
            <span>
              <span className="block font-semibold text-text-primary">{type.label}</span>
              <span className="mt-1 block text-xs leading-5 text-text-secondary">{type.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  </section>
);

export default IntentStep;
