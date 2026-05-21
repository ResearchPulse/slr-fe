import api from "../config/axios";
import type { ApiResponse } from "../types/masterSource";
import type { SearchSourceDto } from "../types/searchSource";

export interface PicocAnalysisRequest {
  searchSourceId?: string;
  population: string;
  intervention: string;
  comparator: string;
  outcome: string;
  context: string;
}

export interface PicocAnalysisResponse {
  population: string[];
  intervention: string[];
  comparison: string[];
  outcome: string[];
  context: string[];
  generatedQuery: string;
}

export const searchSourceService = {
  getByProjectId: async (projectId: string): Promise<ApiResponse<SearchSourceDto[]>> => {
    const response = await api.get<ApiResponse<SearchSourceDto[]>>(
      `/projects/${projectId}/sources`,
    );
    return response.data;
  },

  bulkUpsert: async (sources: SearchSourceDto[]): Promise<ApiResponse<SearchSourceDto[]>> => {
    const response = await api.post<ApiResponse<SearchSourceDto[]>>(
      "/search-sources/bulk",
      sources,
    );
    return response.data;
  },

  upsertSource: async (source: SearchSourceDto): Promise<ApiResponse<SearchSourceDto>> => {
    const response = await api.post<ApiResponse<SearchSourceDto>>(
      "/search-sources",
      source
    );
    return response.data;
  },

  updateStrategies: async (sourceId: string, strategies: any[]): Promise<ApiResponse<SearchSourceDto>> => {
    const response = await api.put<ApiResponse<SearchSourceDto>>(
      `/search-sources/${sourceId}/strategies`,
      strategies
    );
    return response.data;
  },

  analyzePicoc: async (projectId: string, data: PicocAnalysisRequest): Promise<ApiResponse<PicocAnalysisResponse>> => {
    const response = await api.post<ApiResponse<PicocAnalysisResponse>>(
      `/ai/projects/${projectId}/analyze-picoc`,
      data
    );
    return response.data;
  },
};
