import api from '../config/axios';

export type TaxonomyLevel = 'domain' | 'field' | 'subfield' | 'topic';

export interface TaxonomyItem {
  id: string;
  label: string;
  level: TaxonomyLevel;
  parent?: { id: string; label: string; level: TaxonomyLevel };
  description?: string;
}

export interface TaxonomyPage {
  items: TaxonomyItem[];
  nextCursor: string | null;
}

export interface OpenAlexSuggestion {
  id: string;
  label: string;
  score?: number;
  subfield?: { id: string; label: string };
  field?: { id: string; label: string };
  domain?: { id: string; label: string };
}

export interface OpenAlexKeyword {
  id: string;
  label: string;
  score?: number;
  provenance: 'openalex';
}

export interface OpenAlexClassification {
  classifierVersion: '2';
  primaryTopic: OpenAlexSuggestion | null;
  alternatives: OpenAlexSuggestion[];
  keywords: OpenAlexKeyword[];
  providerNote: string | null;
  consentId: string;
}

export interface PicocFieldConfirmationRead {
  state: 'noCurrentConfirmedResult';
  confirmation: null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class PicocWizardService {
  async browseTaxonomy(projectId: string, input: {
    level: TaxonomyLevel;
    parentId?: string;
    search?: string;
    cursor?: string;
    limit?: number;
  }): Promise<TaxonomyPage> {
    const response = await api.get<ApiResponse<TaxonomyPage>>(
      `/projects/${encodeURIComponent(projectId)}/picoc-wizard/taxonomy`,
      { params: input },
    );
    return response.data.data;
  }

  async classify(projectId: string, input: {
    title: string;
    abstract: string;
    consent: { accepted: true; disclosureVersion: string };
  }): Promise<OpenAlexClassification> {
    const response = await api.post<ApiResponse<OpenAlexClassification>>(
      `/projects/${encodeURIComponent(projectId)}/picoc-wizard/classify`,
      input,
    );
    return response.data.data;
  }

  async getConfirmation(projectId: string): Promise<PicocFieldConfirmationRead> {
    const response = await api.get<ApiResponse<PicocFieldConfirmationRead>>(
      `/projects/${encodeURIComponent(projectId)}/picoc-wizard/confirmation`,
    );
    return response.data.data;
  }
}

export const picocWizardService = new PicocWizardService();
