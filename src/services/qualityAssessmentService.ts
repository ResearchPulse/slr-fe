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

const toQualityProcess = (data: any, id: string): QualityAssessmentProcessResponse => ({
  id,
  reviewProcessId: data.projectId ? `rp_${data.projectId}` : id,
  status: data.status === "COMPLETED" ? 2 : data.status === "ACTIVE" || data.status === "REOPENED" ? 1 : 0,
  statusText: data.status === "COMPLETED" ? "Completed" : data.status === "ACTIVE" || data.status === "REOPENED" ? "InProgress" : "NotStarted",
  isHaveCriteria: true,
});

const toQualityDashboard = (data: any): LeaderQADashboardResponse => {
  if (data?.papers) return data as LeaderQADashboardResponse;

  const items = Array.isArray(data) ? data : [];
  const papers = items.map((item) => ({
    id: item.paperId,
    paperId: item.paperId,
    title: item.title,
    status: item.status,
    reviewers: [],
    decisions: [],
    resolution: null,
    completionPercentage: item.assigned ? 0 : 100,
  }));
  const completedPapers = papers.filter((paper) => paper.completionPercentage >= 100).length;
  return {
    papers: {
      items: papers,
      pageNumber: 1,
      pageSize: Math.max(items.length, 1),
      totalCount: items.length,
      totalPages: 1,
    },
    reviewerProgresses: [],
    completionPercentage: papers.length ? Math.round((completedPapers / papers.length) * 100) : 0,
    totalPapers: papers.length,
    completedPapers,
    inProgressPapers: Math.max(papers.length - completedPapers, 0),
    notStartedPapers: 0,
  } as unknown as LeaderQADashboardResponse;
};

export const qualityAssessmentService = {
  projectIdFromProcessId(id: string): string {
    return id.replace(/^(?:qa_|rp_)/, "");
  },

  async getProcess(id: string): Promise<ApiResponse<QualityAssessmentProcessResponse>> {
    const response = await api.get<ApiResponse<any>>(
      `/projects/${this.projectIdFromProcessId(id)}/review-processes`,
    );
    return { ...response.data, data: toQualityProcess(response.data.data, id) };
  },

  async start(id: string): Promise<ApiResponse<QualityAssessmentProcessResponse>> {
    const response = await api.post<ApiResponse<any>>(
      `/projects/${this.projectIdFromProcessId(id)}/review-processes/start`,
    );
    return { ...response.data, data: toQualityProcess(response.data.data, id) };
  },

  async complete(id: string): Promise<ApiResponse<QualityAssessmentProcessResponse>> {
    const response = await api.post<ApiResponse<any>>(
      `/projects/${this.projectIdFromProcessId(id)}/review-processes/complete`,
    );
    return { ...response.data, data: toQualityProcess(response.data.data, id) };
  },

  async assignReviewers(data: QualityAssessmentAssignmentRequest): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(data.qualityAssessmentProcessId)}/quality/assignments`,
      { paperIds: data.paperIds, reviewerIds: data.userIds, phase: "QUALITY_ASSESSMENT" },
    );
    return response.data;
  },

  async autoResolve(data: AutoResolveQualityAssessmentRequest): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(data.qualityAssessmentProcessId)}/quality/auto-resolve`,
      data,
    );
    return response.data;
  },

  async getPapers(qaProcessId: string, params?: QADashboardParams): Promise<ApiResponse<LeaderQADashboardResponse>> {
    const response = await api.get<ApiResponse<any>>(
      `/projects/${this.projectIdFromProcessId(qaProcessId)}/quality/papers`,
      { params },
    );
    return { ...response.data, data: toQualityDashboard(response.data.data) };
  },

  async getMyAssignedPapers(qaProcessId: string, params?: QADashboardParams): Promise<ApiResponse<QAMemberDashboardResponse>> {
    const response = await api.get<ApiResponse<any>>(
      `/projects/${this.projectIdFromProcessId(qaProcessId)}/quality/papers/my`,
      { params },
    );
    return { ...response.data, data: toQualityDashboard(response.data.data) as QAMemberDashboardResponse };
  },

  async getProcessStrategies(qaProcessId: string): Promise<ApiResponse<QualityAssessmentStrategy[]>> {
    const response = await api.get<ApiResponse<any[]>>(
      `/projects/${this.projectIdFromProcessId(qaProcessId)}/quality/templates`,
    );
    const templates = Array.isArray(response.data.data) ? response.data.data : [];
    return {
      ...response.data,
      data: templates.map((template) => ({
        qaStrategyId: template.id,
        qualityAssessmentProcessId: qaProcessId,
        description: template.name,
        checklists: template.checklists ?? [{
          checklistId: template.id,
          qaStrategyId: template.id,
          name: template.name,
          criteria: (template.criteria ?? []).map((criterion: any) => ({
            criterionId: criterion.id,
            checklistId: template.id,
            question: criterion.question,
          })),
        }],
      })),
    };
  },

  async submitDecisions(request: CreateQualityAssessmentDecisionRequest): Promise<ApiResponse<null>> {
    const scores: Record<string, { score: number; comment?: string }> = Object.fromEntries(request.decisionItems.map((item) => [
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
    if (!request.paperId || !request.qualityAssessmentProcessId) {
      throw new Error("Paper and quality assessment process are required to update a decision");
    }
    const scores: Record<string, { score: number; comment?: string }> = Object.fromEntries(request.decisionItems.map((item) => [
      item.qualityCriterionId,
      { score: item.value, comment: item.comment || undefined },
    ]));
    const response = await api.put<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(request.qualityAssessmentProcessId)}/quality/papers/${request.paperId}/assessment`,
      { scores, totalScore: Object.values(scores).reduce((total, item) => total + item.score, 0) },
    );
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
    if (!data.paperId || !data.qualityAssessmentProcessId) {
      throw new Error("Paper and quality assessment process are required to update a resolution");
    }
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(data.qualityAssessmentProcessId)}/quality/papers/${data.paperId}/resolve`,
      { scores: { final: { score: data.finalScore, comment: data.resolutionNotes || undefined } }, totalScore: data.finalScore, comment: data.resolutionNotes || undefined },
    );
    return response.data;
  },

  async getAiDecision(data: AiDecisionRequest): Promise<ApiResponse<AutomateQualityAssessmentResponse>> {
    const response = await api.post<ApiResponse<AutomateQualityAssessmentResponse>>(
      `/projects/${this.projectIdFromProcessId(data.qualityAssessmentProcessId)}/quality/papers/${data.paperId}/ai-decision`,
      data,
    );
    return response.data;
  },

  async upsertStrategy(data: QualityAssessmentStrategy): Promise<ApiResponse<QualityAssessmentStrategy>> {
    const projectId = this.projectIdFromProcessId(data.qualityAssessmentProcessId);
    const response = await api.post<ApiResponse<any>>(`/projects/${projectId}/quality/templates`, {
      name: data.description,
      criteria: data.checklists.flatMap((checklist) => checklist.criteria).map((criterion) => ({
        id: criterion.criterionId || `${Date.now()}`,
        question: criterion.question,
      })),
    });
    const template = response.data.data;
    return {
      ...response.data,
      data: {
        qaStrategyId: template.id,
        qualityAssessmentProcessId: data.qualityAssessmentProcessId,
        description: template.name,
        checklists: [],
      },
    };
  },

  async bulkChecklists(qualityAssessmentProcessId: string, data: QualityAssessmentChecklist[]): Promise<ApiResponse<QualityAssessmentChecklist[]>> {
    const templateId = data[0]?.qaStrategyId;
    if (!templateId) throw new Error("A quality strategy is required before saving checklists");
    const response = await api.post<ApiResponse<QualityAssessmentChecklist[]>>(
      `/projects/${this.projectIdFromProcessId(qualityAssessmentProcessId)}/quality/templates/${templateId}/checklists`,
      { checklists: data },
    );
    return response.data;
  },

  async bulkCriteria(qualityAssessmentProcessId: string, data: QualityAssessmentCriterion[]): Promise<ApiResponse<QualityAssessmentCriterion[]>> {
    const templateId = data[0]?.checklistId;
    if (!templateId) throw new Error("A checklist is required before saving criteria");
    const response = await api.post<ApiResponse<QualityAssessmentCriterion[]>>(
      `/projects/${this.projectIdFromProcessId(qualityAssessmentProcessId)}/quality/templates/${templateId}/criteria`,
      { criteria: data },
    );
    return response.data;
  },

  async exportExcel(qaProcessId: string): Promise<Blob> {
    const response = await api.get(`/projects/${this.projectIdFromProcessId(qaProcessId)}/quality/export`, {
      responseType: 'blob',
      params: { format: 'csv' },
    });
    return response.data;
  }
};
