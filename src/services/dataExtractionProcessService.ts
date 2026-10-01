import api from "../config/axios";
import type { ApiResponse } from "../types/project";
import type { DataExtractionProcess } from "../types/reviewProcess";

type DataExtractionProcessResponse = ApiResponse<DataExtractionProcess>;

export const dataExtractionProcessService = {
  async getById(id: string): Promise<DataExtractionProcess> {
    const response = await api.get<DataExtractionProcessResponse>(
      `/projects/${this.projectIdFromProcessId(id)}/review-processes`,
    );
    const data = response.data;
    if (!data.isSuccess || !data.data) {
      throw new Error(data.message || "Failed to get data extraction process");
    }
    return this.toProcess(data.data, id);
  },

  async start(id: string): Promise<DataExtractionProcessResponse> {
    const response = await api.post<DataExtractionProcessResponse>(
      `/projects/${this.projectIdFromProcessId(id)}/review-processes/start`,
    );
    const data = response.data;
    if (!data.isSuccess) {
      throw new Error(data.message || "Failed to start data extraction");
    }
    return { ...data, data: this.toProcess(data.data, id) };
  },

  async completeProcess(id: string): Promise<DataExtractionProcessResponse> {
    const response = await api.post<DataExtractionProcessResponse>(
      `/projects/${this.projectIdFromProcessId(id)}/review-processes/complete`,
    );
    const data = response.data;
    if (!data.isSuccess) {
      throw new Error(data.message || "Failed to complete data extraction");
    }
    return { ...data, data: this.toProcess(data.data, id) };
  },

  projectIdFromProcessId(id: string): string {
    return id.replace(/^(?:de_|rp_)/, "");
  },

  toProcess(data: any, id: string): DataExtractionProcess {
    const statusText = data?.status === "COMPLETED"
      ? "Completed"
      : data?.status === "ACTIVE" || data?.status === "REOPENED"
        ? "InProgress"
        : "NotStarted";
    return {
      id,
      reviewProcessId: `rp_${this.projectIdFromProcessId(id)}`,
      status: statusText === "Completed" ? 2 : statusText === "InProgress" ? 1 : 0,
      statusText,
      startedAt: data?.lastTransitionAt ?? null,
      completedAt: data?.completedAt ?? null,
      notes: data?.notes ?? null,
      createdAt: data?.createdAt ?? new Date(0).toISOString(),
      modifiedAt: data?.updatedAt ?? new Date(0).toISOString(),
    };
  },
};
