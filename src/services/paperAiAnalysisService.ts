import api from "../config/axios";
import type { ApiResponse } from "../types/project";

export type PaperAiAnalysisStatus = "QUEUED" | "PROCESSING" | "WAITING_FOR_SOURCE" | "COMPLETED" | "FAILED" | "NOT_STARTED";
export type PaperAiContentLevel = "FULL_TEXT" | "PARTIAL_FULL_TEXT" | "ABSTRACT";
export type HumanReviewDecision = "UNREVIEWED" | "IN_REVIEW" | "VERIFIED" | "CHANGES_REQUESTED";

export interface HumanReviewAudit {
  reviewed_by?: string;
  reviewed_at?: string;
  note?: string;
}

export interface EvidenceHumanReview extends HumanReviewAudit {
  decision: "VERIFIED" | "CORRECTED" | "REJECTED";
  corrected_quote?: string;
  source_location?: string;
}

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
  human_review_status?: HumanReviewDecision;
  evidence_reviewed_count?: number;
  evidence_count?: number;
  edge_reviewed_count?: number;
  edge_count?: number;
}

export interface LocatedAiEvidence {
  text: string;
  quote: string;
  section: string | null;
  quote_is_exact: boolean;
  quote_match_method?: "EXACT" | "NORMALIZED" | "ELLIPSIS_EXPANDED" | "UNVERIFIED";
  source_location: { section: string | null; paragraph: number | null; page?: number; char_start?: number; char_end?: number };
  human_review?: EvidenceHumanReview;
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
  craftOfResearch?: unknown;
  craft_of_research?: unknown;
  aif_graph: { artifact_id: string; artifact_type: "A3"; schema_version: string; title: string; nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>>; extensions: Record<string, unknown> };
  limitations: string[];
  human_review?: HumanReviewAudit & { decision: HumanReviewDecision; evidence_reviewed_count: number; evidence_count: number; edge_reviewed_count: number; edge_count: number };
  validation: { status: "VALID" | "NEEDS_REVIEW"; issues: Array<{ code: string; message: string; path?: string }> };
}

export interface CrossPaperRelation {
  relation_id?: string;
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
  effective_relation?: "supports" | "contradicts" | "qualifies";
  effective_rationale?: string;
  human_review?: HumanReviewAudit & { decision: "VERIFIED" | "CORRECTED" | "REJECTED"; corrected_relation?: "supports" | "contradicts" | "qualifies"; corrected_rationale?: string };
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
  human_review?: { reviewed_count: number; relation_count: number };
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
  async getPaper(projectId: string, paperId: string): Promise<{ paper_id: string; title: string; status: PaperAiAnalysisStatus; source_revision: string | null; updated_at: string | null; pdf_url?: string | null; error: { code?: string; message?: string } | null; result: PaperAiAnalysisResult | null }> {
    return unwrap((await api.get<ApiResponse<{ paper_id: string; title: string; status: PaperAiAnalysisStatus; source_revision: string | null; updated_at: string | null; pdf_url?: string | null; error: { code?: string; message?: string } | null; result: PaperAiAnalysisResult | null }>>(`${path(projectId)}/papers/${encodeURIComponent(paperId)}`)).data);
  },
  async reviewEvidence(projectId: string, paperId: string, input: { analysis_id: string; evidence_path: string; decision: EvidenceHumanReview["decision"]; corrected_quote?: string; source_location?: string; note?: string }): Promise<PaperAiAnalysisResult> {
    return unwrap((await api.post<ApiResponse<PaperAiAnalysisResult>>(`${path(projectId)}/papers/${encodeURIComponent(paperId)}/evidence-review`, input)).data);
  },
  async reviewAifEdge(projectId: string, paperId: string, input: { analysis_id: string; edge_id: string; decision: "VERIFIED" | "REJECTED"; note?: string }): Promise<PaperAiAnalysisResult> {
    return unwrap((await api.post<ApiResponse<PaperAiAnalysisResult>>(`${path(projectId)}/papers/${encodeURIComponent(paperId)}/edge-review`, input)).data);
  },
  async reviewPaper(projectId: string, paperId: string, input: { analysis_id: string; decision: "VERIFIED" | "CHANGES_REQUESTED"; note?: string }): Promise<PaperAiAnalysisResult> {
    return unwrap((await api.post<ApiResponse<PaperAiAnalysisResult>>(`${path(projectId)}/papers/${encodeURIComponent(paperId)}/review`, input)).data);
  },
  async getCrossPaper(projectId: string): Promise<{ status: string; result: CrossPaperAnalysisResult | null; error?: { message?: string } | null }> {
    return unwrap((await api.get<ApiResponse<{ status: string; result: CrossPaperAnalysisResult | null; error?: { message?: string } | null }>>(`${path(projectId)}/cross-paper`)).data);
  },
  async generateCrossPaper(projectId: string): Promise<CrossPaperAnalysisResult> {
    return unwrap((await api.post<ApiResponse<CrossPaperAnalysisResult>>(`${path(projectId)}/cross-paper/generate`, {}, { timeout: 150_000 })).data);
  },
  async reviewCrossPaperRelation(projectId: string, relationId: string, input: { generated_at: string; decision: "VERIFIED" | "CORRECTED" | "REJECTED"; corrected_relation?: CrossPaperRelation["relation"]; corrected_rationale?: string; note?: string }): Promise<CrossPaperAnalysisResult> {
    return unwrap((await api.post<ApiResponse<CrossPaperAnalysisResult>>(`${path(projectId)}/cross-paper/relations/${encodeURIComponent(relationId)}/review`, input)).data);
  },
};
