import api from "../config/axios";
import type { ApiResponse } from "../types/project";
import type {
  ArgumentGraph,
  ArgumentGraphSummary,
  ArgumentWeb,
  CreateArgumentWebLinkRequest,
  UpsertArgumentGraphRequest,
} from "../types/synthesisArgument";

const unwrap = <T>(response: ApiResponse<T>): T => {
  if (!response.isSuccess) {
    throw new Error(response.message || "Request failed");
  }

  return response.data;
};

const basePath = (processId: string) => `/synthesis-execution/${processId}`;

const synthesisArgumentService = {
  async listGraphs(processId: string): Promise<ArgumentGraphSummary[]> {
    const response = await api.get<ApiResponse<ArgumentGraphSummary[]>>(`${basePath(processId)}/argument-graphs`);
    return unwrap(response.data);
  },

  async getGraph(processId: string, paperId: string): Promise<ArgumentGraph | null> {
    const response = await api.get<ApiResponse<ArgumentGraph | null>>(`${basePath(processId)}/argument-graphs/${paperId}`);
    return unwrap(response.data);
  },

  async upsertGraph(processId: string, paperId: string, request: UpsertArgumentGraphRequest): Promise<ArgumentGraph> {
    const response = await api.put<ApiResponse<ArgumentGraph>>(`${basePath(processId)}/argument-graphs/${paperId}`, request);
    return unwrap(response.data);
  },

  async submitGraph(processId: string, paperId: string): Promise<ArgumentGraph> {
    const response = await api.post<ApiResponse<ArgumentGraph>>(`${basePath(processId)}/argument-graphs/${paperId}/submit`);
    return unwrap(response.data);
  },

  async approveGraph(processId: string, paperId: string): Promise<ArgumentGraph> {
    const response = await api.post<ApiResponse<ArgumentGraph>>(`${basePath(processId)}/argument-graphs/${paperId}/approve`);
    return unwrap(response.data);
  },

  async getWeb(processId: string): Promise<ArgumentWeb> {
    const response = await api.get<ApiResponse<ArgumentWeb>>(`${basePath(processId)}/argument-web`);
    return unwrap(response.data);
  },

  async createLink(processId: string, request: CreateArgumentWebLinkRequest) {
    const response = await api.post<ApiResponse<ArgumentWeb["links"][number]>>(`${basePath(processId)}/argument-web/links`, request);
    return unwrap(response.data);
  },

  async deleteLink(processId: string, linkId: string): Promise<void> {
    const response = await api.delete<ApiResponse<null>>(`${basePath(processId)}/argument-web/links/${linkId}`);
    unwrap(response.data);
  },
};

export default synthesisArgumentService;
