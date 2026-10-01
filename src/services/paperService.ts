// Paper Service - API Integration Layer
// Handles paper-related read endpoints
// Source: UniquePapersAPI.md

import api from "../config/axios";

import type {
  GetUniquePapersParams,
  GetUniquePapersResponse,
  GetDataExtractionUniquePapersParams,
  GetDataExtractionUniquePapersResponse,
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
   * Get unique papers for a data extraction process.
   * GET /api/data-extraction-processes/{dataExtractionProcessId}/unique-papers
   */
  async getDataExtractionUniquePapers(
    params: GetDataExtractionUniquePapersParams,
  ): Promise<GetDataExtractionUniquePapersResponse> {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.set("search", params.search);
    if (params.year) queryParams.set("year", params.year.toString());
    if (params.pageNumber) queryParams.set("pageNumber", params.pageNumber.toString());
    if (params.pageSize) queryParams.set("pageSize", params.pageSize.toString());

    const queryString = queryParams.toString();
    const projectId = params.dataExtractionProcessId.replace(/^(?:de_|rp_)/, "");
    const response = await api.get<ApiResponse<any[]>>(
      `/projects/${projectId}/extraction/papers${queryString ? `?${queryString}` : ""}`,
    );
    const items = Array.isArray(response.data.data)
      ? response.data.data.map((item) => ({
          paperId: item.paperId,
          title: item.title,
          authors: item.authors ?? null,
          publicationYear: item.publicationYear ?? null,
          doi: item.doi ?? null,
          abstract: item.abstract ?? null,
          pdfUrl: item.pdfUrl ?? null,
        }))
      : [];
    const pageNumber = Number(params.pageNumber) || 1;
    const pageSize = Number(params.pageSize) || Math.max(items.length, 1);
    return {
      ...response.data,
      data: {
        items,
        totalCount: items.length,
        pageNumber,
        pageSize,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
        hasPreviousPage: pageNumber > 1,
        hasNextPage: pageNumber < Math.max(1, Math.ceil(items.length / pageSize)),
        currentPhase: 4,
        currentPhaseText: "Data Extraction",
      },
    } as unknown as GetDataExtractionUniquePapersResponse;
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
