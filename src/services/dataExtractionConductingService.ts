import api from "../config/axios";
import type {
  ExtractionAiDraftRequestDto,
  ExtractionAiDraftResponseDto,
  ExtractionApiResponse,
  ExtractionAssignmentRequestDto,
  ExtractionAuditLogsResponseDto,
  ExtractionCommentDto,
  ExtractionCommentRequestDto,
  ExtractionConsensusDraftDto,
  ExtractionDashboardFilterDto,
  ExtractionDashboardResponseDto,
  ExtractionEditableGridDto,
  ExtractionExportProjectionDto,
  ExtractionPhaseStateDto,
  ExtractionPreviewDto,
  ReopenExtractionRequestDto,
  ExtractionWorkflowMutationDto,
  ExtractionWorkloadSummaryDto,
  UpdateGridCellRequestDto,
  ReviewerWorkspaceDto,
  ConsensusWorkspaceDto,
} from "../types/dataExtraction";

function unwrap<T>(envelope: ExtractionApiResponse<T>): T {
  if (!envelope.success) {
    throw new Error("Extraction API request failed");
  }
  return envelope.data;
}

function asBlob(data: unknown, contentType: string): Blob {
  return data instanceof Blob
    ? data
    : new Blob([typeof data === "string" ? data : JSON.stringify(data) ?? ""], { type: contentType });
}

interface CanonicalExtractionCommentDto {
  id: string;
  fieldId: string;
  reviewerId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export const dataExtractionConductingService = {
  async getDashboard(
    projectId: string,
    filters: ExtractionDashboardFilterDto
  ): Promise<ExtractionDashboardResponseDto> {
    const response = await api.get<ExtractionApiResponse<ExtractionDashboardResponseDto>>(
      `/projects/${projectId}/extraction/dashboard`,
      {
        params: {
          pageNumber: filters.pageNumber,
          pageSize: filters.pageSize,
          search: filters.search ?? filters.searchQuery,
          status: filters.statusFilter,
        },
      },
    );
    return unwrap(response.data);
  },


  async assignReviewers(
    projectId: string,
    paperId: string,
    payload: ExtractionAssignmentRequestDto
  ): Promise<unknown> {
    const response = await api.put<ExtractionApiResponse<unknown>>(
      `/projects/${projectId}/extraction/papers/${paperId}/assignment`, payload
    );
    return unwrap(response.data);
  },

  async submitExtraction(
    projectId: string,
    paperId: string,
    payload: ExtractionWorkflowMutationDto
  ): Promise<unknown> {
    const response = await api.post<ExtractionApiResponse<unknown>>(
      `/projects/${projectId}/extraction/papers/${paperId}/reviewer/submit`, payload
    );
    return unwrap(response.data);
  },

  async saveExtractionDraft(
    projectId: string,
    paperId: string,
    payload: ExtractionWorkflowMutationDto
  ): Promise<unknown> {
    const response = await api.put<ExtractionApiResponse<unknown>>(
      `/projects/${projectId}/extraction/papers/${paperId}/reviewer/draft`, payload
    );
    return unwrap(response.data);
  },

  async autoExtractWithAI(
    projectId: string,
    paperId: string,
    fieldIds?: string[],
  ): Promise<ExtractionAiDraftResponseDto> {
    const payload: ExtractionAiDraftRequestDto = fieldIds ? { fieldIds } : {};
    const response = await api.post<ExtractionApiResponse<ExtractionAiDraftResponseDto>>(
      `/projects/${projectId}/extraction/papers/${paperId}/ai-draft`, payload
    );
    return unwrap(response.data);
  },

  async askAiSingleField(
    projectId: string,
    paperId: string,
    fieldId: string,
  ): Promise<ExtractionAiDraftResponseDto> {
    const response = await api.post<ExtractionApiResponse<ExtractionAiDraftResponseDto>>(
      `/projects/${projectId}/extraction/papers/${paperId}/fields/${fieldId}/ai-draft`, {}
    );
    return unwrap(response.data);
  },

  async getConsensusWorkspace(projectId: string, paperId: string): Promise<ConsensusWorkspaceDto> {
    const response = await api.get<ExtractionApiResponse<ConsensusWorkspaceDto>>(
      `/projects/${projectId}/extraction/papers/${paperId}/consensus`
    );
    return unwrap(response.data);
  },

  async getReviewerWorkspace(projectId: string, paperId: string): Promise<ReviewerWorkspaceDto> {
    const response = await api.get<ExtractionApiResponse<ReviewerWorkspaceDto>>(
      `/projects/${projectId}/extraction/papers/${paperId}/reviewer`
    );
    return unwrap(response.data);
  },

  async addFieldComment(
    projectId: string,
    paperId: string,
    fieldId: string,
    payload: ExtractionCommentRequestDto
  ): Promise<unknown> {
    const response = await api.post<ExtractionApiResponse<unknown>>(
      `/projects/${projectId}/extraction/papers/${paperId}/fields/${fieldId}/comments`,
      payload
    );
    return unwrap(response.data);
  },

  async getFieldComments(projectId: string, paperId: string, fieldId: string): Promise<ExtractionCommentDto[]> {
    const response = await api.get<ExtractionApiResponse<{ comments: CanonicalExtractionCommentDto[] }>>(
      `/projects/${projectId}/extraction/papers/${paperId}/fields/${fieldId}/comments`
    );
    return unwrap(response.data).comments.map((comment) => ({
      id: comment.id,
      fieldId: comment.fieldId,
      threadOwnerId: comment.reviewerId,
      userId: comment.userId,
      userName: comment.userId,
      content: comment.text,
      createdAt: comment.createdAt,
    }));
  },

  async checkConsensus(
    projectId: string,
    paperId: string,
    submissionVersions: Record<string, number>
  ): Promise<unknown> {
    const response = await api.post<ExtractionApiResponse<unknown>>(
      `/projects/${projectId}/extraction/papers/${paperId}/consensus/check`, { submissionVersions }
    );
    return unwrap(response.data);
  },

  async saveConsensusDraft(
    projectId: string,
    paperId: string,
    payload: ExtractionConsensusDraftDto
  ): Promise<unknown> {
    const response = await api.put<ExtractionApiResponse<unknown>>(
      `/projects/${projectId}/extraction/papers/${paperId}/consensus/draft`, payload
    );
    return unwrap(response.data);
  },

  async finalizeConsensus(projectId: string, paperId: string, expectedVersion: number): Promise<unknown> {
    const response = await api.post<ExtractionApiResponse<unknown>>(
      `/projects/${projectId}/extraction/papers/${paperId}/consensus/finalize`, { expectedVersion }
    );
    return unwrap(response.data);
  },

  async exportExtractedData(
    projectId: string,
    format: "json" | "markdown" | "csv" = "markdown",
    search?: string
  ): Promise<Blob> {
    if (format === "json") {
      const response = await api.get<ExtractionApiResponse<ExtractionExportProjectionDto>>(
        `/projects/${projectId}/extraction/export`, { params: { format, search } }
      );
      return asBlob(unwrap(response.data), "application/json");
    }
    const response = await api.get<Blob>(`/projects/${projectId}/extraction/export`, {
      params: { format, search }, responseType: "blob"
    });
    return asBlob(response.data, format === "markdown" ? "text/markdown" : "text/csv");
  },

  async exportExtractedDataCsv(projectId: string, search?: string): Promise<Blob> {
    return this.exportExtractedData(projectId, "csv", search);
  },

  async getExtractionPreview(projectId: string, search?: string): Promise<ExtractionPreviewDto> {
    const response = await api.get<ExtractionApiResponse<ExtractionPreviewDto>>(
      `/projects/${projectId}/extraction/export/preview`, { params: { search } }
    );
    return unwrap(response.data);
  },

  async getEditableGrid(projectId: string): Promise<ExtractionEditableGridDto> {
    const response = await api.get<ExtractionApiResponse<ExtractionEditableGridDto>>(
      `/projects/${projectId}/extraction/grid`
    );
    return unwrap(response.data);
  },

  async updateGridCell(projectId: string, payload: UpdateGridCellRequestDto): Promise<unknown> {
    const response = await api.put<ExtractionApiResponse<unknown>>(
      `/projects/${projectId}/extraction/grid/cells`, payload
    );
    return unwrap(response.data);
  },

  async getCellAuditLogs(
    projectId: string,
    paperId?: string,
    fieldId?: string,
    pageSize = 50
  ): Promise<ExtractionAuditLogsResponseDto> {
    const response = await api.get<ExtractionApiResponse<ExtractionAuditLogsResponseDto>>(
      `/projects/${projectId}/extraction/audit-logs`, { params: { paperId, fieldId, pageSize } }
    );
    return unwrap(response.data);
  },

  async getWorkloadSummary(projectId: string): Promise<ExtractionWorkloadSummaryDto> {
    const response = await api.get<ExtractionApiResponse<ExtractionWorkloadSummaryDto>>(
      `/projects/${projectId}/extraction/workload`
    );
    return unwrap(response.data);
  },

  async reopenExtraction(
    projectId: string,
    paperId: string,
    payload: ReopenExtractionRequestDto
  ): Promise<unknown> {
    const response = await api.post<ExtractionApiResponse<unknown>>(
      `/projects/${projectId}/extraction/papers/${paperId}/reopen`, payload
    );
    return unwrap(response.data);
  },

  async startPhase(projectId: string, expectedVersion?: number): Promise<ExtractionPhaseStateDto> {
    const response = await api.post<ExtractionApiResponse<ExtractionPhaseStateDto>>(
      `/projects/${projectId}/extraction/phase/start`, { expectedVersion }
    );
    return unwrap(response.data);
  },

  async completePhase(projectId: string, expectedVersion?: number): Promise<ExtractionPhaseStateDto> {
    const response = await api.post<ExtractionApiResponse<ExtractionPhaseStateDto>>(
      `/projects/${projectId}/extraction/phase/complete`, { expectedVersion }
    );
    return unwrap(response.data);
  },
};
