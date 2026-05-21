import api from "../config/axios";
import type { ApiResponse, UserSearchResult } from "../types/project";
import type { GetUsersParams, GetUsersResponse, UpdateUserProfileRequest, UpdateUserProfileResponse, UserProgressOverviewParams, UserProgressOverviewResponse, User, ChangePasswordRequest, UserExportRequest } from "../types/user";

/**
 * User Service - For user search and management
 */
class UserService {
  private readonly endpoint = "/users";

  /**
   * Search users by keyword and project ID
   * GET /api/users/search
   */
  searchUsers = async (keyword: string, projectId?: string): Promise<ApiResponse<UserSearchResult[]>> => {
    const response = await api.get<ApiResponse<UserSearchResult[]>>(`${this.endpoint}/search`, {
      params: { keyword, projectId }
    });
    return response.data;
  };

  /**
   * Get all users with filtering and pagination
   * GET /api/users
   */
  getUsers = async (params?: GetUsersParams): Promise<GetUsersResponse> => {
    const response = await api.get<GetUsersResponse>(this.endpoint, {
      params
    });
    return response.data;
  };

  /**
   * Update user profile information
   * PUT /api/users/{userId}/profile
   */
  updateUserProfile = async (data: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> => {
    const { id, ...body } = data;
    const response = await api.put<UpdateUserProfileResponse>(`${this.endpoint}/${id}/profile`, body);
    return response.data;
  };

  /**
   * Toggle user active/inactive status
   * PATCH /api/users/{userId}/status
   */
  toggleUserStatus = async (userId: string): Promise<UpdateUserProfileResponse> => {
    const response = await api.patch<UpdateUserProfileResponse>(`${this.endpoint}/${userId}/status`);
    return response.data;
  };

  /**
   * Get user progress overview for a project
   * GET /api/users/progress-overview
   */
  getProgressOverview = async (params: UserProgressOverviewParams): Promise<UserProgressOverviewResponse> => {
    const response = await api.get<UserProgressOverviewResponse>(`${this.endpoint}/progress-overview`, {
      params
    });
    return response.data;
  };

  /**
   * Get current user profile
   * GET /api/users/me
   */
  getMe = async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>(`${this.endpoint}/me`);
    return response.data;
  };

  /**
   * Change current user password
   * POST /api/users/change-password
   */
  changePassword = async (data: ChangePasswordRequest): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`${this.endpoint}/change-password`, data);
    return response.data;
  };

  /**
   * Export all users to Excel file
   * GET /api/users/export/excel
   */
  exportUsers = async (params?: UserExportRequest): Promise<Blob> => {
    const response = await api.get(`${this.endpoint}/export/excel`, {
      params,
      responseType: "blob"
    });
    return response.data;
  };
}

export const userService = new UserService();
