import type { PicocItem, PicocSuggestion, PicocWizardDraft, PicocWizardRecord } from "./types";

export const emptyDraft = (overrides: Partial<PicocWizardDraft> = {}): PicocWizardDraft => ({
  reviewType: "mapping",
  currentStep: "intent",
  intent: { topic: "Byzantine-robust asynchronous FL", description: "Edge systems" },
  researchField: null,
  keywords: [{ label: "Edge computing", origin: "openalex", kept: true }],
  picoc: { population: [], intervention: [], comparison: [], outcome: [], context: [] },
  comparisonNotApplicable: null,
  ...overrides,
});

export const item = (id: string, label: string, overrides: Partial<PicocItem> = {}): PicocItem => ({
  id, label, synonyms: [], origin: "ai", status: "selected", needsReview: false, ...overrides,
});

export const suggestion = (label: string, overrides: Partial<PicocSuggestion> = {}): PicocSuggestion => ({
  conceptId: `intervention:${label.toLowerCase().replace(/\s+/g, "-")}`,
  label,
  component: "intervention",
  synonyms: [],
  rationale: `Rationale for ${label}`,
  sourceType: "ai",
  evidenceRefs: [],
  selectionStatus: "suggested",
  confidence: "medium",
  ...overrides,
});

export const record = (draft: PicocWizardDraft, overrides: Partial<PicocWizardRecord> = {}): PicocWizardRecord => ({
  ...draft,
  schemaVersion: 2,
  revision: 1,
  status: "draft",
  initializedFrom: "wizard",
  qualityGate: [
    { gateId: "G1", name: "Research intent", status: "needs_review", reason: "The research field has not been confirmed.", remediation: { step: "field", action: "Confirm a topic." } },
    { gateId: "G2", name: "Core completeness", status: "blocked", reason: "No confirmed term for: Context.", remediation: { step: "context", action: "Select a Context term." } },
    { gateId: "G7", name: "Search feasibility", status: "not_run", reason: "Not run does not mean passed.", remediation: null },
  ],
  qualityGateEvaluatedAt: "2026-10-15T00:00:00.000Z",
  createdAt: "2026-10-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
  updatedBy: "owner-1",
  ...overrides,
});
