import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys";
import type { ResearchQuestion } from "../types/coreAndGovernance";
import { coreAndGovernanceService } from "../services/coreAndGovernanceService";
/**
 * Hook to fetch planning data (Research Questions) for a project.
 */
interface UsePlanningDataOptions {
  projectId?: string;
}

export const usePlanningData = ({ projectId }: UsePlanningDataOptions) => {
  const rqQuery = useQuery({
    queryKey: QUERY_KEYS.projects.researchQuestions(projectId || ""),
    queryFn: () => {
      if (!projectId) throw new Error("Project ID is required");
      return coreAndGovernanceService.getResearchQuestions(projectId);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    select: (response) => response.data || [],
  });

  return {
    researchQuestions: rqQuery.data || [],
    picocElementsByQuestion: {},
    isLoading: rqQuery.isLoading,
    error: rqQuery.error ? String(rqQuery.error) : null,
    projectId,
  };
};

/**
 * Format RQ text for display in dropdown
 */
export const formatResearchQuestion = (rq: ResearchQuestion): string => {
  const questionText = rq.questionText || "Untitled";
  return questionText.length > 60 ? `${questionText.substring(0, 57)}...` : questionText;
};

