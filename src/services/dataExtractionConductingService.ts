import api from "../config/axios";
import type {
  AddCommentRequestDto,
  AskAiFieldRequestDto,
  AssignReviewersDto,
  ExtractedValueDto,
  ExtractionDashboardFilterDto,
  ExtractionDashboardResponseDto,
  ExtractedDataAuditLogDto,
  ExtractionEditableGridDto,
  ExtractionPreviewDto,
  ExtractionWorkloadSummaryDto,
  ReopenExtractionRequestDto,
  ReviewerWorkspaceDto,
  SubmitExtractionRequestDto,
  ConsensusWorkspaceDto,
  SubmitConsensusRequestDto,
  UpdateGridCellRequestDto,
} from "../types/dataExtraction";
import type { ApiResponse } from "../types/project";

const toExtractionDashboard = (data: any): ExtractionDashboardResponseDto => {
  if (data?.tasks && data?.summary) return data as ExtractionDashboardResponseDto;

  const items = Array.isArray(data) ? data : [];
  const tasks = items.map((item) => ({
    taskId: item.paperId,
    paperId: item.paperId,
    title: item.title,
    status: item.assigned ? "in-progress" : "todo",
  }));
  const completed = tasks.filter((task) => task.status === "completed").length;
  const awaitingConsensus = tasks.filter((task) => task.status === "awaiting-consensus").length;
  const inProgress = tasks.filter((task) => task.status === "in-progress").length;
  return {
    summary: {
      totalIncluded: tasks.length,
      inProgress,
      awaitingConsensus,
      completed,
    },
    tasks: {
      items: tasks,
      totalCount: tasks.length,
      pageNumber: 1,
      pageSize: Math.max(tasks.length, 1),
      totalPages: 1,
    },
  };
};

const valuesArrayToRecord = (values: ExtractedValueDto[]) =>
  Object.fromEntries(values.map((value) => [value.fieldId, value]));

const consensusValuesToRecord = (values: SubmitConsensusRequestDto["values"]) =>
  Object.fromEntries(values.map((value) => [value.fieldId, value]));

export const dataExtractionConductingService = {
  projectIdFromProcessId(extractionProcessId: string): string {
    return extractionProcessId.replace(/^(?:de_|rp_)/, "");
  },

  async getDashboard(
    extractionProcessId: string,
    filters: ExtractionDashboardFilterDto
  ): Promise<ApiResponse<ExtractionDashboardResponseDto>> {
    const response = await api.get<ApiResponse<ExtractionDashboardResponseDto>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers`,
      {
        params: filters,
      }
    );

    return { ...response.data, data: toExtractionDashboard(response.data.data) };
  },

  async assignReviewers(
    extractionProcessId: string,
    paperId: string,
    payload: AssignReviewersDto
  ): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/assignments`,
      { paperIds: [paperId], reviewerIds: [payload.reviewer1Id, payload.reviewer2Id].filter(Boolean), phase: "DATA_EXTRACTION" },
    );

    return response.data;
  },

  async submitExtraction(
    extractionProcessId: string,
    paperId: string,
    payload: SubmitExtractionRequestDto
  ): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${paperId}/submit`,
      { values: valuesArrayToRecord(payload.values) }
    );

    return response.data;
  },

  async directExtractByLeader(
    extractionProcessId: string,
    paperId: string,
    payload: SubmitExtractionRequestDto
  ): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${paperId}/submit`,
      { values: valuesArrayToRecord(payload.values) }
    );

    return response.data;
  },

  async autoExtractWithAI(
    extractionProcessId: string,
    paperId: string,
    templateId: string
  ): Promise<ApiResponse<ExtractedValueDto[]>> {
    const response = await api.post<ApiResponse<ExtractedValueDto[]>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${paperId}/auto-extract`,
      { templateId }
    );

    return response.data;
  },

  async askAiSingleField(
    extractionProcessId: string,
    payload: AskAiFieldRequestDto
  ): Promise<ApiResponse<ExtractedValueDto>> {
    const response = await api.post<ApiResponse<ExtractedValueDto>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${payload.paperId}/ask-ai-field`,
      payload
    );

    return response.data;
  },

  async getConsensusWorkspace(
    extractionProcessId: string,
    paperId: string
  ): Promise<ApiResponse<ConsensusWorkspaceDto>> {
    const response = await api.get<ApiResponse<ConsensusWorkspaceDto>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${paperId}/consensus`
    );

    return response.data;
  },

  async getReviewerWorkspace(
    extractionProcessId: string,
    paperId: string
  ): Promise<ApiResponse<ReviewerWorkspaceDto>> {
    const response = await api.get<ApiResponse<ReviewerWorkspaceDto>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${paperId}/workspace`
    );

    return response.data;
  },

  async addFieldComment(
    extractionProcessId: string,
    paperId: string,
    fieldId: string,
    payload: AddCommentRequestDto
  ): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${paperId}/comments`,
      { text: payload.content, fieldId },
    );

    return response.data;
  },

  async submitConsensus(
    extractionProcessId: string,
    paperId: string,
    payload: SubmitConsensusRequestDto
  ): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${paperId}/consensus`,
      { values: consensusValuesToRecord(payload.values) }
    );

    return response.data;
  },

  async exportExtractedData(extractionProcessId: string): Promise<Blob> {
    const response = await api.get<Blob>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/export`,
      { responseType: "blob", params: { format: "csv" } }
    );

    return response.data;
  },

  async exportExtractedDataCsv(extractionProcessId: string): Promise<Blob> {
    const response = await api.get<Blob>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/export`,
      { responseType: "blob", params: { format: "csv" } }
    );

    return response.data;
  },

  async getExtractionPreview(
    extractionProcessId: string
  ): Promise<ApiResponse<ExtractionPreviewDto>> {
    const response = await api.get<ApiResponse<ExtractionPreviewDto>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/export`
    );

    return response.data;
  },

  async getEditableGrid(
    extractionProcessId: string
  ): Promise<ApiResponse<ExtractionEditableGridDto>> {
    const response = await api.get<ApiResponse<ExtractionEditableGridDto>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/grid`
    );

    return response.data;
  },

  async updateGridCell(
    extractionProcessId: string,
    payload: UpdateGridCellRequestDto
  ): Promise<ApiResponse<null>> {
    const response = await api.put<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${payload.paperId}/draft`,
      { values: { [payload.fieldId]: payload.newValue } }
    );

    return response.data;
  },

  async getCellAuditLogs(
    extractionProcessId: string,
    paperId: string,
    fieldId: string,
    matrixColumnId: string | null,
    matrixRowIndex: number | null
  ): Promise<ApiResponse<ExtractedDataAuditLogDto[]>> {
    const response = await api.get<ApiResponse<ExtractedDataAuditLogDto[]>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${paperId}/audit`,
      {
        params: {
          paperId,
          fieldId,
          matrixColumnId,
          matrixRowIndex,
        },
      }
    );

    return response.data;
  },

  async getWorkloadSummary(
    extractionProcessId: string
  ): Promise<ApiResponse<ExtractionWorkloadSummaryDto>> {
    const response = await api.get<ApiResponse<ExtractionWorkloadSummaryDto>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/progress`
    );

    return response.data;
  },

  async reopenExtraction(
    extractionProcessId: string,
    paperId: string,
    payload: ReopenExtractionRequestDto
  ): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      `/projects/${this.projectIdFromProcessId(extractionProcessId)}/extraction/papers/${paperId}/reopen`,
      payload
    );

    return response.data;
  },
};
