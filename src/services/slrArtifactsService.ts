import api from "../config/axios";
import type { ApiResponse } from "../types/project";

export const SLR_ARTIFACT_TYPES = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"] as const;
export type SlrArtifactType = (typeof SLR_ARTIFACT_TYPES)[number];
export type SlrStoredPayloadKey = SlrArtifactType | "corpus";

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
}

const path = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/synthesis/artifacts`;

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.isSuccess) throw new Error(response.message || "Request failed");
  return response.data;
}

export const slrArtifactsService = {
  async listRuns(projectId: string): Promise<SlrArtifactRun[]> {
    return unwrap((await api.get<ApiResponse<SlrArtifactRun[]>>(`${path(projectId)}/runs`)).data);
  },
  async generateRun(projectId: string): Promise<SlrArtifactRun> {
    return unwrap((await api.post<ApiResponse<SlrArtifactRun>>(`${path(projectId)}/runs`, { a3Mode: "deterministic" })).data);
  },
  async getArtifact(projectId: string, runId: string, artifactType: SlrStoredPayloadKey): Promise<unknown> {
    return unwrap((await api.get<ApiResponse<unknown>>(`${path(projectId)}/runs/${encodeURIComponent(runId)}/artifacts/${artifactType}`)).data);
  },
  async reviewArtifact(projectId: string, runId: string, artifactType: SlrArtifactType, decision: "APPROVED" | "REJECTED"): Promise<SlrArtifactRun> {
    return unwrap((await api.post<ApiResponse<SlrArtifactRun>>(`${path(projectId)}/runs/${encodeURIComponent(runId)}/artifacts/${artifactType}/review`, { decision })).data);
  },
};
