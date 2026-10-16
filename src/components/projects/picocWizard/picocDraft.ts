import { generateId } from "../../../utils/uuid";
import type {
  PicocComponent,
  PicocItem,
  PicocSuggestion,
  PicocSuggestionContext,
  PicocSuggestionRequest,
  PicocWizardDraft,
  WizardStep,
} from "./types";

export const COMPONENT_LABELS: Record<PicocComponent, string> = {
  population: "Population",
  intervention: "Intervention",
  comparison: "Comparison",
  outcome: "Outcome",
  context: "Context",
};

export const STEP_LABELS: Record<WizardStep, string> = {
  intent: "Research intent",
  field: "Research field",
  context: "Context",
  population: "Population",
  intervention: "Intervention",
  outcome: "Outcome",
  comparison: "Comparison",
  review: "Review & save",
};

export const COMPONENT_QUESTIONS: Record<PicocComponent, string> = {
  context: "In which setting or conditions do the studies take place?",
  population: "Who or what is being studied?",
  intervention: "Which methods, techniques or approaches are investigated?",
  outcome: "What results or effects are measured?",
  comparison: "What is the intervention compared against?",
};

export const ORIGIN_LABELS = { openalex: "OpenAlex", ai: "AI", storage: "Saved suggestion", default: "Starter term", user: "You added" } as const;

/** Steps that precede each component in wizard order (C→P→I→O→C). */
const UPSTREAM: Record<PicocComponent, PicocComponent[]> = {
  context: [],
  population: ["context"],
  intervention: ["context", "population"],
  outcome: ["context", "population", "intervention"],
  comparison: ["context", "population", "intervention", "outcome"],
};

export const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

export const selectedLabels = (draft: PicocWizardDraft, component: PicocComponent) =>
  draft.picoc[component].filter((item) => item.status === "selected").map((item) => item.label);

const withComponent = (draft: PicocWizardDraft, component: PicocComponent, items: PicocItem[]): PicocWizardDraft => ({
  ...draft,
  picoc: { ...draft.picoc, [component]: items },
});

const findByLabel = (items: PicocItem[], label: string) =>
  items.find((item) => normalizeLabel(item.label) === normalizeLabel(label));

/**
 * Sets a suggestion's state: "selected", "unsure" ("Not sure", stored but not counted as a choice), or
 * null (removed). Choosing a comparator clears Comparison N/A because the two are contradictory.
 */
export function setSuggestionState(
  draft: PicocWizardDraft,
  component: PicocComponent,
  suggestion: PicocSuggestion,
  status: PicocItem["status"] | null,
): PicocWizardDraft {
  const items = draft.picoc[component];
  const existing = findByLabel(items, suggestion.label);
  let next: PicocItem[];
  if (status === null) {
    next = items.filter((item) => item !== existing);
  } else if (existing) {
    next = items.map((item) => (item === existing ? { ...item, status, needsReview: false } : item));
  } else {
    next = [...items, {
      id: generateId(),
      label: suggestion.label,
      synonyms: suggestion.synonyms,
      origin: suggestion.sourceType,
      rationale: suggestion.rationale,
      status,
      needsReview: false,
    }];
  }
  const updated = withComponent(draft, component, next);
  return component === "comparison" && status === "selected" ? { ...updated, comparisonNotApplicable: null } : updated;
}

export function addCustomTerm(draft: PicocWizardDraft, component: PicocComponent, label: string): PicocWizardDraft {
  const clean = label.trim().replace(/\s+/g, " ");
  if (!clean || findByLabel(draft.picoc[component], clean)) return draft;
  const updated = withComponent(draft, component, [
    ...draft.picoc[component],
    { id: generateId(), label: clean.slice(0, 300), synonyms: [], origin: "user", status: "selected", needsReview: false },
  ]);
  return component === "comparison" ? { ...updated, comparisonNotApplicable: null } : updated;
}

export function removeItem(draft: PicocWizardDraft, component: PicocComponent, id: string): PicocWizardDraft {
  return withComponent(draft, component, draft.picoc[component].filter((item) => item.id !== id));
}

export function keepItem(draft: PicocWizardDraft, component: PicocComponent, id: string): PicocWizardDraft {
  return withComponent(draft, component, draft.picoc[component].map((item) => (item.id === id ? { ...item, needsReview: false } : item)));
}

/** Comparison N/A removes selected baselines (the server rejects both together); "Not sure" items stay. */
export function setComparisonNotApplicable(draft: PicocWizardDraft, reason: string | null): PicocWizardDraft {
  if (reason === null) return { ...draft, comparisonNotApplicable: null };
  return {
    ...withComponent(draft, "comparison", draft.picoc.comparison.filter((item) => item.status !== "selected")),
    comparisonNotApplicable: { reason },
  };
}

/** T-08: flags (never deletes) selections that refreshed suggestions no longer contain. */
export function applyReviewFlags(draft: PicocWizardDraft, component: PicocComponent, ids: string[]): PicocWizardDraft {
  if (ids.length === 0) return draft;
  const flagged = new Set(ids);
  return withComponent(draft, component, draft.picoc[component].map((item) => (flagged.has(item.id) ? { ...item, needsReview: true } : item)));
}

/** Inputs that influence a component's suggestions; a change means suggestions should be refreshed. */
export function upstreamSignature(draft: PicocWizardDraft, component: PicocComponent): string {
  return JSON.stringify([
    draft.intent.topic,
    draft.reviewType,
    draft.researchField?.topic.id ?? null,
    draft.keywords.filter((keyword) => keyword.kept).map((keyword) => keyword.label),
    UPSTREAM[component].map((other) => selectedLabels(draft, other)),
  ]);
}

export function buildSuggestionRequest(
  draft: PicocWizardDraft,
  component: PicocComponent,
  mode: "refresh" | "more",
  shownLabels: string[],
): PicocSuggestionRequest {
  const field = draft.researchField;
  return {
    component,
    mode,
    context: {
      topic: draft.intent.topic.trim(),
      description: draft.intent.description,
      reviewType: draft.reviewType,
      researchField: field
        ? { topic: field.topic.label, topicId: field.topic.id, subfield: field.subfield?.label, field: field.field?.label, domain: field.domain?.label }
        : null,
      keywords: draft.keywords.filter((keyword) => keyword.kept).map(({ label, origin }) => ({ label, origin })),
      confirmed: {
        population: selectedLabels(draft, "population"),
        intervention: selectedLabels(draft, "intervention"),
        comparison: selectedLabels(draft, "comparison"),
        outcome: selectedLabels(draft, "outcome"),
        context: selectedLabels(draft, "context"),
      },
    },
    exclude: mode === "more" ? shownLabels.slice(0, 200) : [],
    currentSelections: draft.picoc[component].map(({ id, label, synonyms, origin }) => ({ id, label, synonyms, origin })),
  };
}

/** Shared input for one compact request that seeds every PICOC component. */
export function buildBatchSuggestionContext(draft: PicocWizardDraft): PicocSuggestionContext {
  const field = draft.researchField;
  return {
    topic: draft.intent.topic.trim(),
    description: draft.intent.description,
    reviewType: draft.reviewType,
    researchField: field
      ? { topic: field.topic.label, topicId: field.topic.id, subfield: field.subfield?.label, field: field.field?.label, domain: field.domain?.label }
      : null,
    keywords: draft.keywords.filter((keyword) => keyword.kept).map(({ label, origin }) => ({ label, origin })),
    confirmed: {
      population: selectedLabels(draft, "population"),
      intervention: selectedLabels(draft, "intervention"),
      comparison: selectedLabels(draft, "comparison"),
      outcome: selectedLabels(draft, "outcome"),
      context: selectedLabels(draft, "context"),
    },
  };
}
