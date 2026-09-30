import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { projectService } from "../services/projectService";
import { QUERY_KEYS } from "../constants/queryKeys";
import { setProjectMember } from "../redux/slices/projectSlice";
import type { RootState } from "../redux/store";

/**
 * Hook to manage and sync the current project member state with Redux.
 * Ensures the membership information is fetched if missing and kept up to date.
 */
export const useProjectMember = (projectId: string | undefined) => {
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const currentProjectMember = useSelector((state: RootState) => state.project.currentProjectMember);

  const query = useQuery({
    queryKey: QUERY_KEYS.projects.myMembership(projectId || ""),
    queryFn: () => (projectId ? projectService.getMyMembership(projectId) : Promise.reject("No project ID")),
    enabled: !!projectId && isAuthenticated && isInitialized,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data?.isSuccess && query.data.data) {
      const { role, roleNumber, roleText } = query.data.data;
      const roleNames: Record<string, number> = {
        OWNER: 1,
        ADMIN: 2,
        REVIEWER: 3,
        VIEWER: 4,
      };
      const normalizedRole =
        typeof roleNumber === "number"
          ? roleNumber
          : typeof role === "number"
            ? role
            : roleNames[String(roleText || role).toUpperCase()] || 3;
      
      // Update Redux if the data is different or missing
      if (
        !currentProjectMember ||
        currentProjectMember.role !== normalizedRole ||
        currentProjectMember.roleText !== roleText
      ) {
      const isLeader = normalizedRole === 1 || normalizedRole === 2;

      dispatch(
        setProjectMember({
          role: normalizedRole,
          roleText,
          isLeader,
        })
      );

      }
    }
  }, [query.data, dispatch, currentProjectMember]);

  return {
    member: currentProjectMember,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to fetch all members of a project.
 */
export const useProjectMembers = (projectId: string | undefined) => {
  const query = useQuery({
    queryKey: QUERY_KEYS.projects.members(projectId || ""),
    queryFn: () => (projectId ? projectService.getProjectMembers(projectId) : Promise.reject("No project ID")),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    members: query.data?.isSuccess ? query.data.data?.items : [],
    totalCount: query.data?.isSuccess ? query.data.data?.totalCount : 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};
