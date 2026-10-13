// Paper Service - API Integration Layer
// Handles paper-related read endpoints
// Source: UniquePapersAPI.md

import api from "../config/axios";

import type {
  GetUniquePapersParams,
  GetUniquePapersResponse,
  PaginatedPaperResponse,
  AssignPapersRequest,
  AssignPapersResponse,
  GetPaperDetailsApiResponse,
  DeletePaperRequest,
} from "../types/paper";
import type { ApiResponse } from "../types/project";

/**
 * Paper Service
 * Paper retrieval endpoints (read-only)
 */
export const paperService = {
  /**
   * Get unique (non-duplicate) papers for an identification process
   * GET /api/identification-processes/{identificationProcessId}/unique-papers
   *
   * Returns paginated results with search and year filter support.
   * Papers are sorted by createdAt descending (newest first).
   *
   * Note: selectionStatus is always null from this endpoint
   * (status lives in ScreeningResolution, not on the paper)
   */
  async getUniquePapers(params: GetUniquePapersParams): Promise<GetUniquePapersResponse> {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.set("search", params.search);
    if (params.year) queryParams.set("year", params.year.toString());
    if (params.pageNumber) queryParams.set("pageNumber", params.pageNumber.toString());
    if (params.pageSize) queryParams.set("pageSize", params.pageSize.toString());

    const queryString = queryParams.toString();
    const url = `/identification-processes/${params.identificationProcessId}/unique-papers${queryString ? `?${queryString}` : ""}`;

    const response = await api.get<GetUniquePapersResponse>(url);
    return response.data;
  },

  /**
   * List extraction-eligible papers for a project.
   * GET /api/projects/:projectId/extraction/papers
   */
  async getExtractionPapers(params: {
    projectId: string;
    search?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PaginatedPaperResponse> {
    const response = await api.get<{ success: boolean; data: PaginatedPaperResponse }>(
      `/projects/${params.projectId}/extraction/papers`,
      {
        params: {
          search: params.search,
          pageNumber: params.pageNumber,
          pageSize: params.pageSize,
        },
      }
    );

    if (!response.data.success) {
      throw new Error("Failed to load extraction papers");
    }

    return response.data.data;
  },

  async assignPapers(request: AssignPapersRequest): Promise<AssignPapersResponse> {
    const response = await api.post<AssignPapersResponse>("/papers/assign", request);
    return response.data;
  },

  /**
   * Get full metadata for a single paper
   * GET /api/papers/{paperId}
   */
  async getPaperDetails(paperId: string): Promise<GetPaperDetailsApiResponse> {
    const response = await api.get<GetPaperDetailsApiResponse>(`/papers/${paperId}`);
    return response.data;
  },

  /**
   * Soft deletes a paper with a given reason
   * DELETE /api/papers/{paperId}
   */
  async deletePaper(paperId: string, reason: string): Promise<ApiResponse<null>> {
    const payload: DeletePaperRequest = { reason };
    const response = await api.delete<ApiResponse<null>>(`/papers/${paperId}`, {
      data: payload,
    });
    return response.data;
  },

  /**
   * Removes a PDF attachment from a paper
   * DELETE /api/papers/{paperId}/pdf
   */
  async removePdf(paperId: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/papers/${paperId}/pdf`);
    return response.data;
  },
};
