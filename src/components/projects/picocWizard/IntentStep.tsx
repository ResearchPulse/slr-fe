import React from "react";
import type { PicocWizardDraft, ReviewType } from "./types";

interface IntentStepProps {
  draft: PicocWizardDraft;
  update: (change: (current: PicocWizardDraft) => PicocWizardDraft) => void;
}

const REVIEW_TYPES: Array<{ value: ReviewType; label: string; hint: string }> = [
  { value: "mapping", label: "Mapping", hint: "Map what has been studied; a comparator is often not applicable." },
  { value: "comparative", label: "Comparative", hint: "Compare an intervention against alternatives or baselines." },
  { value: "exploratory", label: "Exploratory", hint: "Explore an emerging topic and its open questions." },
];

const IntentStep: React.FC<IntentStepProps> = ({ draft, update }) => (
  <section aria-labelledby="picoc-step-intent" className="space-y-6">
    <header>
      <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary">Research intent</p>
      <h3 id="picoc-step-intent" className="mt-1 font-cormorant text-[28px] text-text-primary">What will this review be about?</h3>
    </header>

    <div>
      <label htmlFor="picoc-topic" className="text-sm font-medium text-text-primary">Research topic</label>
      <input
        id="picoc-topic"
        value={draft.intent.topic}
        maxLength={200}
        onChange={(event) => update((value) => ({ ...value, intent: { ...value.intent, topic: event.target.value } }))}
        className="mt-1 w-full border border-border bg-surface-white px-3 py-2 text-sm"
        placeholder="e.g. Byzantine-robust asynchronous federated learning at the edge"
      />
    </div>

    <div>
      <label htmlFor="picoc-description" className="text-sm font-medium text-text-primary">Short description</label>
      <textarea
        id="picoc-description"
        value={draft.intent.description}
        maxLength={4000}
        rows={4}
        onChange={(event) => update((value) => ({ ...value, intent: { ...value.intent, description: event.target.value } }))}
        className="mt-1 w-full border border-border bg-surface-white px-3 py-2 text-sm"
        placeholder="One or two sentences on the problem, setting and what you want to learn. More detail gives better field and term suggestions."
      />
    </div>

    <fieldset>
      <legend className="text-sm font-medium text-text-primary">Review type</legend>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        {REVIEW_TYPES.map((type) => (
          <label
            key={type.value}
            className={`flex cursor-pointer gap-2 border p-3 text-sm ${draft.reviewType === type.value ? "border-text-primary" : "border-border"}`}
          >
            <input
              type="radio"
              name="picoc-review-type"
              value={type.value}
              checked={draft.reviewType === type.value}
              onChange={() => update((value) => ({ ...value, reviewType: type.value }))}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-text-primary">{type.label}</span>
              <span className="block text-xs text-text-secondary">{type.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  </section>
);

export default IntentStep;
