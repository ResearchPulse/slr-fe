import api from "../config/axios";
import type { ApiResponse } from "../types/project";
import type {
  PaperOverviewDto,
  YearCountDto,
  CountItemDto,
  StatusCountItemDto,
  DataQualityDto,
  PaperStatisticsFilter,
} from "../types/paperStatistics";

function unwrapResponse<T>(response: ApiResponse<T>, fallbackMessage: string): T {
  if (!response.isSuccess) {
    throw new Error(response.message || fallbackMessage);
  }
  return response.data;
}

function cleanQueryParams(params: PaperStatisticsFilter & { top?: number }): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ) as Record<string, string | number | boolean>;
}

class PaperStatisticsService {
  private getBaseUrl(projectId: string) {
    // Following user's doc: /api/project/{projectId}/papers
    // axios baseURL handles /api, so we use /project/{projectId}/papers
    return `/project/${projectId}/papers`;
  }

  async getOverview(projectId: string, filter: PaperStatisticsFilter): Promise<PaperOverviewDto> {
    const response = await api.get<ApiResponse<PaperOverviewDto>>(
      `${this.getBaseUrl(projectId)}/overview`,
      { params: cleanQueryParams(filter) }
    );
    return unwrapResponse(response.data, "Failed to load overview statistics");
  }

  async getByYear(projectId: string, filter: PaperStatisticsFilter): Promise<YearCountDto[]> {
    const response = await api.get<ApiResponse<YearCountDto[]>>(
      `${this.getBaseUrl(projectId)}/by-year`,
      { params: cleanQueryParams(filter) }
    );
    return unwrapResponse(response.data, "Failed to load papers by year");
  }

  async getPublicationTypes(projectId: string, filter: PaperStatisticsFilter): Promise<CountItemDto[]> {
    const response = await api.get<ApiResponse<CountItemDto[]>>(
      `${this.getBaseUrl(projectId)}/publication-types`,
      { params: cleanQueryParams(filter) }
    );
    return unwrapResponse(response.data, "Failed to load publication types");
  }

  async getTopJournals(projectId: string, filter: PaperStatisticsFilter, top: number = 10): Promise<CountItemDto[]> {
    const response = await api.get<ApiResponse<CountItemDto[]>>(
      `${this.getBaseUrl(projectId)}/top-journals`,
      { params: cleanQueryParams({ ...filter, top }) }
    );
    return unwrapResponse(response.data, "Failed to load top journals");
  }

  async getTopConferences(projectId: string, filter: PaperStatisticsFilter, top: number = 10): Promise<CountItemDto[]> {
    const response = await api.get<ApiResponse<CountItemDto[]>>(
      `${this.getBaseUrl(projectId)}/top-conferences`,
      { params: cleanQueryParams({ ...filter, top }) }
    );
    return unwrapResponse(response.data, "Failed to load top conferences");
  }

  async getTopPublishers(projectId: string, filter: PaperStatisticsFilter, top: number = 10): Promise<CountItemDto[]> {
    const response = await api.get<ApiResponse<CountItemDto[]>>(
      `${this.getBaseUrl(projectId)}/top-publishers`,
      { params: cleanQueryParams({ ...filter, top }) }
    );
    return unwrapResponse(response.data, "Failed to load top publishers");
  }

  async getLanguages(projectId: string, filter: PaperStatisticsFilter): Promise<CountItemDto[]> {
    const response = await api.get<ApiResponse<CountItemDto[]>>(
      `${this.getBaseUrl(projectId)}/languages`,
      { params: cleanQueryParams(filter) }
    );
    return unwrapResponse(response.data, "Failed to load language distribution");
  }

  async getFulltextStatus(projectId: string, filter: PaperStatisticsFilter): Promise<StatusCountItemDto[]> {
    const response = await api.get<ApiResponse<StatusCountItemDto[]>>(
      `${this.getBaseUrl(projectId)}/fulltext-status`,
      { params: cleanQueryParams(filter) }
    );
    return unwrapResponse(response.data, "Failed to load fulltext status distribution");
  }

  async getTopKeywords(projectId: string, filter: PaperStatisticsFilter, top: number = 20): Promise<CountItemDto[]> {
    const response = await api.get<ApiResponse<CountItemDto[]>>(
      `${this.getBaseUrl(projectId)}/top-keywords`,
      { params: cleanQueryParams({ ...filter, top }) }
    );
    return unwrapResponse(response.data, "Failed to load top keywords");
  }

  async getDataQuality(projectId: string, filter: PaperStatisticsFilter): Promise<DataQualityDto> {
    const response = await api.get<ApiResponse<DataQualityDto>>(
      `${this.getBaseUrl(projectId)}/data-quality`,
      { params: cleanQueryParams(filter) }
    );
    return unwrapResponse(response.data, "Failed to load data quality metrics");
  }
}

const paperStatisticsService = new PaperStatisticsService();
export default paperStatisticsService;
