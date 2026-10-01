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
  AiDecisionRequest,
  AutomateQualityAssessmentResponse,
  LeaderQADashboardResponse,
  QAMemberDashboardResponse,
  QADashboardParams,
  QualityAssessmentChecklist,
  QualityAssessmentCriterion,
  QualityAssessmentProcessResponse
} from "../types/qualityAssessment";

export const qualityAssessmentService = {
  projectIdFromProcessId(id: string): string {
    return id.replace(/^(?:qa_|rp_)/, "");
  },

  async getProcess(id: string): Promise<ApiResponse<QualityAssessmentProcessResponse>> {
    const response = await api.get<ApiResponse<QualityAssessmentProcessResponse>>(`/quality-assessment/${id}`);
    return response.data;
  },

  async start(id: string): Promise<ApiResponse<QualityAssessmentProcessResponse>> {
    const response = await api.post<ApiResponse<QualityAssessmentProcessResponse>>(`/quality-assessment/${id}/start`);
    return response.data;
  },

  async complete(id: string): Promise<ApiResponse<QualityAssessmentProcessResponse>> {
    const response = await api.post<ApiResponse<QualityAssessmentProcessResponse>>(`/quality-assessment/${id}/complete`);
    return response.data;
  },

  async assignReviewers(data: QualityAssessmentAssignmentRequest): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(data.qualityAssessmentProcessId)}/quality/assignments`,
      { paperIds: data.paperIds, reviewerIds: data.userIds, phase: "QUALITY_ASSESSMENT" },
    );
    return response.data;
  },

  async autoResolve(data: AutoResolveQualityAssessmentRequest): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(`/quality-assessment/auto-resolve`, data);
    return response.data;
  },

  async getPapers(qaProcessId: string, params?: QADashboardParams): Promise<ApiResponse<LeaderQADashboardResponse>> {
    const response = await api.get<ApiResponse<LeaderQADashboardResponse>>(
      `/projects/${this.projectIdFromProcessId(qaProcessId)}/quality/papers`,
      { params },
    );
    return response.data;
  },

  async getMyAssignedPapers(qaProcessId: string, params?: QADashboardParams): Promise<ApiResponse<QAMemberDashboardResponse>> {
    const response = await api.get<ApiResponse<QAMemberDashboardResponse>>(
      `/projects/${this.projectIdFromProcessId(qaProcessId)}/quality/papers/my`,
      { params },
    );
    return response.data;
  },

  async getProcessStrategies(qaProcessId: string): Promise<ApiResponse<QualityAssessmentStrategy[]>> {
    const response = await api.get<ApiResponse<QualityAssessmentStrategy[]>>(`/quality-assessment/${qaProcessId}/strategies`);
    return response.data;
  },

  async submitDecisions(request: CreateQualityAssessmentDecisionRequest): Promise<ApiResponse<null>> {
    const scores = Object.fromEntries(request.decisionItems.map((item) => [
      item.qualityCriterionId,
      { score: item.value, comment: item.comment || undefined },
    ]));
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(request.qualityAssessmentProcessId)}/quality/papers/${request.paperId}/assessment`,
      { scores, totalScore: Object.values(scores).reduce((total, item) => total + item.score, 0) },
    );
    return response.data;
  },

  async updateDecisions(request: UpdateQualityAssessmentDecisionRequest): Promise<ApiResponse<null>> {
    const response = await api.put<ApiResponse<null>>(`/quality/assessments/${request.id}`, request);
    return response.data;
  },

  async submitResolution(data: QualityAssessmentResolutionRequest): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(data.qualityAssessmentProcessId)}/quality/papers/${data.paperId}/resolve`,
      { scores: { final: { score: data.finalScore, comment: data.resolutionNotes || undefined } }, totalScore: data.finalScore, comment: data.resolutionNotes || undefined },
    );
    return response.data;
  },

  async updateResolution(data: UpdateQualityAssessmentResolutionRequest): Promise<ApiResponse<null>> {
    const response = await api.put<ApiResponse<null>>(`/quality-assessment/resolutions/${data.id}`, data);
    return response.data;
  },

  async getAiDecision(data: AiDecisionRequest): Promise<ApiResponse<AutomateQualityAssessmentResponse>> {
    const response = await api.post<ApiResponse<AutomateQualityAssessmentResponse>>(`/quality-assessment/decisions/ai`, data);
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

  async exportExcel(qaProcessId: string): Promise<Blob> {
    const response = await api.get(`/projects/${this.projectIdFromProcessId(qaProcessId)}/quality/export`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
