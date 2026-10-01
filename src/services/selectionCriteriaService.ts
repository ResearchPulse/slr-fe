import api from "../config/axios";
import type { GenerateAICriteriaResponse, SaveAiResultRequest, StudySelectionCriteriaDto } from "../types/selectionCriteria";
import type { ApiResponse } from "../types/project";

export const selectionCriteriaService = {
  /**
   * Generate study selection criteria using AI
   * @param projectId The project ID
   */
  async generateAi(projectId: string): Promise<GenerateAICriteriaResponse> {
    const response = await api.post<GenerateAICriteriaResponse>(
      `/projects/${projectId}/screening/criteria/ai-suggest`,
    );
    return response.data;
  },

  /**
   * Save AI suggested and custom criteria result
   * @param data The criteria data to save
   */
  async saveAiResult(projectId: string, data: SaveAiResultRequest): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(
      `/projects/${projectId}/screening/criteria`,
      data,
    );
    return response.data;
  },

  /**
   * Get criteria groups by project ID
   * @param projectId The project ID
   */
  async getByProjectId(projectId: string): Promise<ApiResponse<StudySelectionCriteriaDto[]>> {
    const response = await api.get<ApiResponse<StudySelectionCriteriaDto[]>>(
      `/projects/${projectId}/screening/criteria`,
    );
    return response.data;
  },
};
