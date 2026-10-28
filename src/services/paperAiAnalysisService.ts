import api from "../config/axios";
import type { ApiResponse } from "../types/project";

export type PaperAiAnalysisStatus = "QUEUED" | "PROCESSING" | "WAITING_FOR_SOURCE" | "COMPLETED" | "FAILED" | "NOT_STARTED";
export type PaperAiContentLevel = "FULL_TEXT" | "PARTIAL_FULL_TEXT" | "ABSTRACT";

export interface PaperAiAnalysisListItem {
  paper_id: string;
  title: string;
  status: PaperAiAnalysisStatus;
  paper_status: string;
  is_duplicate: boolean;
  source_level: PaperAiContentLevel | null;
  source_revision: string | null;
  analysis_updated_at: string | null;
  error: { code: string; message: string } | null;
  argument_count: number;
}

export interface LocatedAiEvidence {
  text: string;
  quote: string;
  section: string | null;
  quote_is_exact: boolean;
  quote_match_method?: "EXACT" | "NORMALIZED" | "ELLIPSIS_EXPANDED" | "UNVERIFIED";
  source_location: { section: string | null; paragraph: number | null; char_start?: number; char_end?: number };
}

export interface AiComponent {
  text: string;
  evidence: LocatedAiEvidence[];
}

export interface PaperAiAnalysisResult {
  schema_version: string;
  project_id: string;
  paper_id: string;
  paper_title: string;
  source: {
    level: PaperAiContentLevel;
    source_asset_id: string | null;
    source_revision: string;
    source_hash: string;
    analyzed_at: string;
    provider: string;
    model: string | null;
    coverage: "COMPLETE" | "TRUNCATED";
  };
  imrad: Record<"introduction" | "methods" | "results" | "discussion", { summary: string; evidence: LocatedAiEvidence[] }>;
  toulmin_arguments: Array<{
    argument_id: string;
    claim: AiComponent;
    grounds: AiComponent[];
    warrant: AiComponent | null;
    backing: AiComponent | null;
    qualifier: string | null;
    rebuttal: AiComponent | null;
  }>;
  aif_graph: { artifact_id: string; artifact_type: "A3"; schema_version: string; title: string; nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>>; extensions: Record<string, unknown> };
  limitations: string[];
  validation: { status: "VALID" | "NEEDS_REVIEW"; issues: Array<{ code: string; message: string; path?: string }> };
}

export interface CrossPaperRelation {
  source_paper_id: string;
  source_paper_title: string;
  source_node_id: string;
  target_paper_id: string;
  target_paper_title: string;
  target_node_id: string;
  relation: "supports" | "contradicts" | "qualifies";
  rationale: string;
  source_evidence?: Array<{ evidence_id: string; component: string; section: string | null; quote: string }>;
  target_evidence?: Array<{ evidence_id: string; component: string; section: string | null; quote: string }>;
}

export interface CrossPaperAnalysisResult {
  schema_version: string;
  project_id: string;
  generated_at: string;
  provider: string;
  model: string | null;
  analyzed_paper_count: number;
  project_paper_count: number;
  relations: CrossPaperRelation[];
  aif_graph: PaperAiAnalysisResult["aif_graph"];
  limitations: string[];
  validation: { status: "VALID" | "NEEDS_REVIEW"; issues: Array<{ code: string; message: string }> };
}

const path = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/paper-ai-analysis`;

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.isSuccess) throw new Error(response.message || "Request failed");
  return response.data;
}

export const paperAiAnalysisService = {
  async listPapers(projectId: string): Promise<PaperAiAnalysisListItem[]> {
    return unwrap((await api.get<ApiResponse<PaperAiAnalysisListItem[]>>(`${path(projectId)}/papers`)).data);
  },
  async generateAll(projectId: string, force = false): Promise<{ total: number; queued: number; waiting_for_source: number; already_current: number }> {
    return unwrap((await api.post<ApiResponse<{ total: number; queued: number; waiting_for_source: number; already_current: number }>>(`${path(projectId)}/generate`, { force })).data);
  },
  async getPaper(projectId: string, paperId: string): Promise<{ paper_id: string; title: string; status: PaperAiAnalysisStatus; source_revision: string | null; updated_at: string | null; error: { code?: string; message?: string } | null; result: PaperAiAnalysisResult | null }> {
    return unwrap((await api.get<ApiResponse<{ paper_id: string; title: string; status: PaperAiAnalysisStatus; source_revision: string | null; updated_at: string | null; error: { code?: string; message?: string } | null; result: PaperAiAnalysisResult | null }>>(`${path(projectId)}/papers/${encodeURIComponent(paperId)}`)).data);
  },
  async getCrossPaper(projectId: string): Promise<{ status: string; result: CrossPaperAnalysisResult | null; error?: { message?: string } | null }> {
    return unwrap((await api.get<ApiResponse<{ status: string; result: CrossPaperAnalysisResult | null; error?: { message?: string } | null }>>(`${path(projectId)}/cross-paper`)).data);
  },
  async generateCrossPaper(projectId: string): Promise<CrossPaperAnalysisResult> {
    return unwrap((await api.post<ApiResponse<CrossPaperAnalysisResult>>(`${path(projectId)}/cross-paper/generate`, {}, { timeout: 150_000 })).data);
  },
};
