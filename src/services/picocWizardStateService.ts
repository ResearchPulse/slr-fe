import api from "../config/axios";
import type {
  FieldClassification,
  PicocSuggestionRequest,
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

/** Version of the OpenAlex disclosure text shown next to the consent checkbox. */
export const OPENALEX_DISCLOSURE_VERSION = "openalex-text-2026-10";

export const picocWizardStateService = {
  async getState(projectId: string): Promise<PicocWizardRecord> {
    const response = await api.get<ApiResponse<PicocWizardRecord>>(`${base(projectId)}/state`);
    return response.data.data;
  },

  async saveState(projectId: string, expectedRevision: number, state: PicocWizardDraft): Promise<PicocWizardRecord> {
    const response = await api.put<ApiResponse<PicocWizardRecord>>(`${base(projectId)}/state`, { expectedRevision, state });
    return response.data.data;
  },

  async suggest(projectId: string, request: PicocSuggestionRequest): Promise<PicocSuggestionResponse> {
    const response = await api.post<ApiResponse<PicocSuggestionResponse>>(`${base(projectId)}/suggestions`, request, { timeout: 60000 });
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
      params: { level, ...(parentId ? { parentId } : {}), ...(search ? { search } : {}), limit: 50 },
    });
    return response.data.data;
  },

  async exportFile(projectId: string, format: "json" | "md"): Promise<Blob> {
    const response = await api.get(`${base(projectId)}/state/export`, { params: { format }, responseType: "blob" });
    return response.data as Blob;
  },
};
