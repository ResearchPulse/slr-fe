import api from "../config/axios";
import type { ApiResponse } from "../types/project";

export const SLR_ARTIFACT_TYPES = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"] as const;
export type SlrArtifactType = (typeof SLR_ARTIFACT_TYPES)[number];
export type SlrStoredPayloadKey = SlrArtifactType | "corpus";

export const SLR_FIELD_ROLES = [
  "finding",
  "conclusion",
  "outcome",
  "limitation",
  "population_context",
  "intervention",
  "comparator",
  "context",
  "study_design",
  "publication_year",
  "implementation_condition",
  "mechanism",
  "moderator",
  "effect_direction",
  "topic",
] as const;
export type SlrFieldRole = (typeof SLR_FIELD_ROLES)[number];

export type SlrDimensionRef = { field_id: string } | { role: SlrFieldRole };
export type SlrContextGroupBy = "outcome" | "intervention" | "population_context" | "context";

/** Generation options; every key is optional and the server applies its defaults for the rest. */
export interface SlrGenerateOptions {
  a3Mode?: "deterministic" | "ai";
  researchQuestionId?: string;
  contextGroupBy?: SlrContextGroupBy;
  gapMap?: { rows: SlrDimensionRef; columns: SlrDimensionRef };
  sparseThreshold?: number;
  /** Field id -> role; `null` leaves a field out of the synthesis. */
  fieldRoles?: Record<string, SlrFieldRole | null>;
}

export interface SlrArtifactReview {
  artifact_type: SlrArtifactType;
  decision: "APPROVED" | "REJECTED";
  note: string | null;
  reviewer_id: string;
  at: string;
}

export interface SlrArtifactRun {
  run_id: string;
  project_id: string;
  generated_at: string;
  generated_by: string | null;
  corpus_hash: string;
  corpus_version: string;
  artifacts: Array<{
    artifact_type: SlrArtifactType;
    artifact_id: string;
    review_status: string;
    validation_status: string;
  }>;
  a3?: { validation_status: string };
  reviews?: SlrArtifactReview[];
}

/** The part of the live corpus the generate form needs to offer valid choices. */
export interface SlrCorpusOptions {
  research_questions: Array<{ rq_id: string; code: string | null; question: string }>;
  field_roles: Array<{
    field_id: string;
    field_name: string;
    section_name: string;
    role: SlrFieldRole | null;
  }>;
}

export interface SlrValidationIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  path?: string;
  node_id?: string;
  edge_id?: string;
}

export interface SlrValidationReport {
  status: "valid" | "invalid";
  layer_a: { valid: boolean; issues: SlrValidationIssue[] };
  layer_b: { valid: boolean; skipped: boolean; issues: SlrValidationIssue[] };
  needs_human_review: boolean;
  error_count: number;
  warning_count: number;
}

const path = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/synthesis/artifacts`;

/** The artifacts API sends `isSuccess` like the rest of the API and keeps the older `success` flag. */
function unwrap<T>(response: ApiResponse<T> & { success?: boolean }): T {
  if (!(response.isSuccess ?? response.success)) throw new Error(response.message || "Request failed");
  return response.data;
}

/** Drops unset keys: the server rejects unknown keys and an empty `researchQuestionId`. */
function pruneOptions(options: SlrGenerateOptions): SlrGenerateOptions {
  const body: SlrGenerateOptions = {};
  if (options.a3Mode) body.a3Mode = options.a3Mode;
  if (options.researchQuestionId) body.researchQuestionId = options.researchQuestionId;
  if (options.contextGroupBy) body.contextGroupBy = options.contextGroupBy;
  if (options.gapMap) body.gapMap = options.gapMap;
  if (options.sparseThreshold !== undefined) body.sparseThreshold = options.sparseThreshold;
  if (options.fieldRoles && Object.keys(options.fieldRoles).length > 0) body.fieldRoles = options.fieldRoles;
  return body;
}

export const slrArtifactsService = {
  async listRuns(projectId: string): Promise<SlrArtifactRun[]> {
    return unwrap((await api.get<ApiResponse<SlrArtifactRun[]>>(`${path(projectId)}/runs`)).data);
  },
  async generateRun(projectId: string, options: SlrGenerateOptions = {}): Promise<SlrArtifactRun> {
    const body = { a3Mode: "deterministic" as const, ...pruneOptions(options) };
    // The server answers `{ run, artifacts }`; callers only need the run record.
    return unwrap((await api.post<ApiResponse<{ run: SlrArtifactRun }>>(`${path(projectId)}/runs`, body)).data).run;
  },
  async getArtifact(projectId: string, runId: string, artifactType: SlrStoredPayloadKey): Promise<unknown> {
    return unwrap((await api.get<ApiResponse<unknown>>(`${path(projectId)}/runs/${encodeURIComponent(runId)}/artifacts/${artifactType}`)).data);
  },
  async reviewArtifact(
    projectId: string,
    runId: string,
    artifactType: SlrArtifactType,
    decision: "APPROVED" | "REJECTED",
    note?: string,
  ): Promise<SlrArtifactRun> {
    const trimmed = note?.trim();
    const body = trimmed ? { decision, note: trimmed } : { decision };
    return unwrap((await api.post<ApiResponse<SlrArtifactRun>>(`${path(projectId)}/runs/${encodeURIComponent(runId)}/artifacts/${artifactType}/review`, body)).data);
  },
  /** The live corpus (recomputed on every call), used to offer valid generation options. */
  async getCorpusOptions(projectId: string): Promise<SlrCorpusOptions> {
    return unwrap((await api.get<ApiResponse<SlrCorpusOptions>>(`${path(projectId)}/corpus`)).data);
  },
  async getA3Schema(projectId: string): Promise<unknown> {
    return unwrap((await api.get<ApiResponse<unknown>>(`${path(projectId)}/schemas/a3`)).data);
  },
  /** Checks a graph against a run's corpus. The server does not store the graph. */
  async validateA3(projectId: string, graph: unknown, runId?: string): Promise<SlrValidationReport> {
    const body = runId ? { graph, runId } : { graph };
    return unwrap((await api.post<ApiResponse<SlrValidationReport>>(`${path(projectId)}/a3/validate`, body)).data);
  },
};
