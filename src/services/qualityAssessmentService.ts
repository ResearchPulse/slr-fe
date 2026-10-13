import api from "../config/axios";
import type {
  ApiResponse,
  QualityAssessmentAssignmentRequest,
  CreateQualityAssessmentDecisionRequest,
  QualityAssessmentResolutionRequest,
  AutoResolveQualityAssessmentRequest,
  QualityAssessmentStrategy,
  UpdateQualityAssessmentDecisionRequest,
  UpdateQualityAssessmentResolutionRequest,
  LeaderQADashboardResponse,
  QAMemberDashboardResponse,
  QADashboardParams,
  QualityAssessmentChecklist,
  QualityAssessmentCriterion,
  QualityAssessmentProcessResponse,
  QualityCriteriaTemplate,
  SaveQualityCriteriaTemplateRequest
} from "../types/qualityAssessment";

export const qualityAssessmentService = {
  async getProcess(id: string): Promise<ApiResponse<QualityAssessmentProcessResponse>> {
    const response = await api.get<ApiResponse<QualityAssessmentProcessResponse>>(`/quality-assessment/${id}`);
    return response.data;
  },

  async start(id: string): Promise<ApiResponse<QualityAssessmentProcessResponse>> {
    const response = await api.post<ApiResponse<QualityAssessmentProcessResponse>>(`/quality-assessment/${id}/start`);
    return response.data;
  },

  /** `force` completes the phase even though some included papers have no final verdict yet. */
  async complete(id: string, options?: { force?: boolean }): Promise<ApiResponse<QualityAssessmentProcessResponse>> {
    const response = await api.post<ApiResponse<QualityAssessmentProcessResponse>>(
      `/quality-assessment/${id}/complete`,
      undefined,
      { params: options?.force ? { force: true } : undefined },
    );
    return response.data;
  },

  async assignReviewers(data: QualityAssessmentAssignmentRequest): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(`/quality-assessment/assignments`, data);
    return response.data;
  },

  async autoResolve(data: AutoResolveQualityAssessmentRequest): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(`/quality-assessment/auto-resolve`, data);
    return response.data;
  },

  async getPapers(qaProcessId: string, params?: QADashboardParams): Promise<ApiResponse<LeaderQADashboardResponse>> {
    const response = await api.get<ApiResponse<LeaderQADashboardResponse>>(`/quality-assessment/${qaProcessId}/leader`, { params });
    return response.data;
  },

  async getMyAssignedPapers(qaProcessId: string, params?: QADashboardParams): Promise<ApiResponse<QAMemberDashboardResponse>> {
    const response = await api.get<ApiResponse<QAMemberDashboardResponse>>(`/quality-assessment/${qaProcessId}/assignments/my`, { params });
    return response.data;
  },

  async getProcessStrategies(qaProcessId: string): Promise<ApiResponse<QualityAssessmentStrategy[]>> {
    const response = await api.get<ApiResponse<QualityAssessmentStrategy[]>>(`/quality-assessment/${qaProcessId}/strategies`);
    return response.data;
  },

  async submitDecisions(request: CreateQualityAssessmentDecisionRequest): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(`/quality-assessment/decisions`, request);
    return response.data;
  },

  async updateDecisions(request: UpdateQualityAssessmentDecisionRequest): Promise<ApiResponse<null>> {
    const response = await api.put<ApiResponse<null>>(`/quality-assessment/decisions/${request.id}`, request);
    return response.data;
  },

  async submitResolution(data: QualityAssessmentResolutionRequest): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(`/quality-assessment/resolutions/`, data);
    return response.data;
  },

  async updateResolution(data: UpdateQualityAssessmentResolutionRequest): Promise<ApiResponse<null>> {
    const response = await api.put<ApiResponse<null>>(`/quality-assessment/resolutions/${data.id}`, data);
    return response.data;
  },

  async upsertStrategy(data: QualityAssessmentStrategy): Promise<ApiResponse<QualityAssessmentStrategy>> {
    const response = await api.post<ApiResponse<QualityAssessmentStrategy>>(`/quality-assessment/strategies/upsert`, data);
    return response.data;
  },

  async bulkChecklists(data: QualityAssessmentChecklist[]): Promise<ApiResponse<QualityAssessmentChecklist[]>> {
    const response = await api.post<ApiResponse<QualityAssessmentChecklist[]>>(`/quality-assessment/checklists/bulk`, data);
    return response.data;
  },

  async bulkCriteria(data: QualityAssessmentCriterion[]): Promise<ApiResponse<QualityAssessmentCriterion[]>> {
    const response = await api.post<ApiResponse<QualityAssessmentCriterion[]>>(`/quality-assessment/criteria/bulk`, data);
    return response.data;
  },

  async listCriteriaTemplates(): Promise<ApiResponse<QualityCriteriaTemplate[]>> {
    const response = await api.get<ApiResponse<QualityCriteriaTemplate[]>>(`/quality-assessment/criteria-templates`);
    return response.data;
  },

  async createCriteriaTemplate(data: SaveQualityCriteriaTemplateRequest): Promise<ApiResponse<QualityCriteriaTemplate>> {
    const response = await api.post<ApiResponse<QualityCriteriaTemplate>>(`/quality-assessment/criteria-templates`, data);
    return response.data;
  },

  async updateCriteriaTemplate(
    id: string,
    data: Omit<SaveQualityCriteriaTemplateRequest, "scope">,
  ): Promise<ApiResponse<QualityCriteriaTemplate>> {
    const response = await api.put<ApiResponse<QualityCriteriaTemplate>>(`/quality-assessment/criteria-templates/${id}`, data);
    return response.data;
  },

  async deleteCriteriaTemplate(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/quality-assessment/criteria-templates/${id}`);
    return response.data;
  },

  async exportCsv(qaProcessId: string): Promise<Blob> {
    const response = await api.get(`/quality-assessment/${qaProcessId}/export/csv`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
