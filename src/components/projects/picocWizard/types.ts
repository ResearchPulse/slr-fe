// Mirrors slr-be src/modules/picoc-wizard/picoc-wizard-state.schemas.ts and picoc-suggestion.schemas.ts.

export const PICOC_COMPONENTS = ["population", "intervention", "comparison", "outcome", "context"] as const;
export type PicocComponent = (typeof PICOC_COMPONENTS)[number];

/** Wizard order C→P→I→O→C; storage/canvas order is P–I–C–O–C. */
export const WIZARD_STEPS = ["intent", "field", "context", "population", "intervention", "outcome", "comparison", "review"] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export type ReviewType = "mapping" | "comparative" | "exploratory";
export type PicocOrigin = "openalex" | "ai" | "user";

export interface PicocItem {
  id: string;
  label: string;
  synonyms: string[];
  origin: PicocOrigin;
  rationale?: string;
  status: "selected" | "unsure";
  needsReview: boolean;
  selectedBy?: string;
  selectedAt?: string;
}

export interface Taxon {
  id: string;
  label: string;
}

export interface ResearchField {
  topic: Taxon;
  subfield?: Taxon;
  field?: Taxon;
  domain?: Taxon;
  source: "openalex_suggestion" | "manual_browse";
  classifierVersion: string | null;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface PicocKeyword {
  id?: string;
  label: string;
  origin: "openalex" | "user";
  kept: boolean;
}

export interface PicocWizardDraft {
  reviewType: ReviewType | null;
  currentStep: WizardStep;
  intent: { topic: string; description: string };
  researchField: ResearchField | null;
  keywords: PicocKeyword[];
  picoc: Record<PicocComponent, PicocItem[]>;
  comparisonNotApplicable: { reason: string; setBy?: string; setAt?: string } | null;
}

export type GateStatus = "passed" | "needs_review" | "blocked" | "not_run";

export interface QualityGateResult {
  gateId: "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7";
  name: string;
  status: GateStatus;
  reason: string;
  remediation: { step: WizardStep; action: string } | null;
}

export interface PicocWizardRecord extends PicocWizardDraft {
  schemaVersion: 2;
  revision: number;
  status: "draft";
  initializedFrom: "empty" | "legacy" | "wizard";
  qualityGate: QualityGateResult[];
  qualityGateEvaluatedAt: string;
  createdAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface PicocSuggestion {
  conceptId: string;
  label: string;
  component: PicocComponent;
  synonyms: string[];
  rationale: string;
  sourceType: "ai" | "openalex";
  evidenceRefs: never[];
  selectionStatus: "suggested";
  confidence: "high" | "medium" | "low";
}

export interface PicocSuggestionResponse {
  component: PicocComponent;
  source: "ai" | "openalex_fallback";
  fallbackReason: string | null;
  suggestions: PicocSuggestion[];
  selectionsToReview: string[];
  model: string | null;
  promptVersion: string;
}

export interface PicocSuggestionRequest {
  component: PicocComponent;
  mode: "refresh" | "more";
  context: {
    topic: string;
    description: string;
    reviewType: ReviewType | null;
    researchField: { topic: string; subfield?: string; field?: string; domain?: string } | null;
    keywords: Array<{ label: string; origin: "openalex" | "user" }>;
    confirmed: Record<PicocComponent, string[]>;
  };
  exclude: string[];
  currentSelections: Array<{ id: string; label: string; synonyms: string[]; origin: PicocOrigin }>;
}

// OpenAlex field classification and taxonomy browsing (T-04 endpoints).
export interface ClassifiedTopic extends Taxon {
  subfield?: Taxon;
  field?: Taxon;
  domain?: Taxon;
}

export interface FieldClassification {
  classifierVersion: string;
  primaryTopic: ClassifiedTopic | null;
  alternatives: ClassifiedTopic[];
  keywords: Array<{ id: string; label: string }>;
  providerNote: string | null;
}

export type TaxonomyLevel = "domain" | "field" | "subfield" | "topic";

export interface TaxonomyItem extends Taxon {
  level: TaxonomyLevel;
  parent?: Taxon & { level: TaxonomyLevel };
}

export interface TaxonomyPage {
  items: TaxonomyItem[];
  nextCursor: string | null;
}
