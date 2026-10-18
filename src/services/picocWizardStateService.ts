import api from "../config/axios";
import type {
  FieldClassification,
  PicocSuggestionRequest,
  PicocSuggestionBatchResponse,
  PicocSuggestionContext,
  PicocSuggestionResponse,
  PicocWizardDraft,
  PicocWizardRecord,
  TaxonomyLevel,
  TaxonomyPage,
} from "../components/projects/picocWizard/types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/picoc-wizard`;

/** Version of the OpenAlex disclosure text shown next to the consent checkbox; the server accepts only this value. */
export const OPENALEX_DISCLOSURE_VERSION = "openalex-2026-10";

export type PicocAnalyticsEvent =
  | "wizard_started"
  | "field_confirmed"
  | "suggestion_viewed"
  | "suggestion_selected"
  | "custom_concept_added"
  | "quality_gate_triggered"
  | "picoc_saved";

/** Structured properties only — never research text (the server rejects anything else). */
export interface PicocAnalyticsProperties {
  component?: "population" | "intervention" | "comparison" | "outcome" | "context";
  source?: "ai" | "openalex" | "storage" | "default" | "user" | "openalex_fallback" | "storage_fallback" | "default_fallback";
  count?: number;
  gateId?: "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7";
  gateStatus?: "passed" | "needs_review" | "blocked" | "not_run";
}

export const picocWizardStateService = {
  async getState(projectId: string): Promise<PicocWizardRecord> {
    const response = await api.get<ApiResponse<PicocWizardRecord>>(`${base(projectId)}/state`);
    return response.data.data;
  },

  async saveState(projectId: string, expectedRevision: number, state: PicocWizardDraft): Promise<PicocWizardRecord> {
    const response = await api.put<ApiResponse<PicocWizardRecord>>(`${base(projectId)}/state`, { expectedRevision, state });
    return response.data.data;
  },

  /** Runs the AI consistency gates (G3/G5) on the saved revision and returns the updated record. */
  async semanticCheck(projectId: string, expectedRevision: number): Promise<PicocWizardRecord> {
    const response = await api.post<ApiResponse<PicocWizardRecord>>(`${base(projectId)}/state/semantic-check`, { expectedRevision }, { timeout: 90000 });
    return response.data.data;
  },

  async suggest(projectId: string, request: PicocSuggestionRequest): Promise<PicocSuggestionResponse> {
    const response = await api.post<ApiResponse<PicocSuggestionResponse>>(`${base(projectId)}/suggestions`, request, { timeout: 60000 });
    return response.data.data;
  },

  async suggestBatch(projectId: string, context: PicocSuggestionContext): Promise<PicocSuggestionBatchResponse> {
    const response = await api.post<ApiResponse<PicocSuggestionBatchResponse>>(`${base(projectId)}/suggestions/batch`, { context }, { timeout: 90000 });
    return response.data.data;
  },

  async classify(projectId: string, title: string, abstract: string): Promise<FieldClassification> {
    const response = await api.post<ApiResponse<FieldClassification>>(`${base(projectId)}/classify`, {
      title,
      abstract,
      consent: { accepted: true, disclosureVersion: OPENALEX_DISCLOSURE_VERSION },
    });
    return response.data.data;
  },

  async browseTaxonomy(projectId: string, level: TaxonomyLevel, parentId?: string, search?: string): Promise<TaxonomyPage> {
    const response = await api.get<ApiResponse<TaxonomyPage>>(`${base(projectId)}/taxonomy`, {
      params: { level, ...(parentId ? { parentId } : {}), ...(search ? { search } : {}), limit: 100 },
    });
    return response.data.data;
  },

  /** Fire-and-forget: analytics failures never affect the wizard. */
  track(projectId: string, event: PicocAnalyticsEvent, properties: PicocAnalyticsProperties = {}): void {
    void api.post(`${base(projectId)}/analytics`, { event, properties }).catch(() => undefined);
  },

  async exportFile(projectId: string, format: "json" | "md"): Promise<Blob> {
    const response = await api.get(`${base(projectId)}/state/export`, { params: { format }, responseType: "blob" });
    return response.data as Blob;
  },
};
