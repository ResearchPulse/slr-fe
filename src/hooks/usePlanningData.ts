import { useQuery } from "@tanstack/react-query";
import type { ResearchQuestion } from "../types/coreAndGovernance";
import { coreAndGovernanceService } from "../services/coreAndGovernanceService";
import { dataExtractionProcessService } from "../services/dataExtractionProcessService";
import reviewProcessService from "../services/reviewProcessService";
import { QUERY_KEYS } from "../constants/queryKeys";

/**
 * Hook to fetch planning data (Research Questions)
 * from a Data Extraction Process context.
 */
interface UsePlanningDataOptions {
  projectId?: string;
  dataExtractionProcessId?: string;
}

export const usePlanningData = ({ projectId: projectIdOverride, dataExtractionProcessId }: UsePlanningDataOptions) => {
  const projectContextQuery = useQuery({
    queryKey: ["planning-project-context", projectIdOverride || dataExtractionProcessId || ""],
    queryFn: async () => {
      if (projectIdOverride) {
        return { projectId: projectIdOverride };
      }

      if (!dataExtractionProcessId) {
        throw new Error("Project ID or Data Extraction Process ID is required");
      }

      const extractionProcess = await dataExtractionProcessService.getById(dataExtractionProcessId);
      const reviewProcessResponse = await reviewProcessService.getReviewProcessById(
        extractionProcess.reviewProcessId
      );

      if (!reviewProcessResponse.isSuccess || !reviewProcessResponse.data?.projectId) {
        throw new Error("Unable to resolve project from data extraction process");
      }

      return { projectId: reviewProcessResponse.data.projectId };
    },
    enabled: !!projectIdOverride || !!dataExtractionProcessId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });

  const projectId = projectContextQuery.data?.projectId;

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

  const isLoading = projectContextQuery.isLoading || rqQuery.isLoading;
  const error = projectContextQuery.error || rqQuery.error;

  return {
    researchQuestions: rqQuery.data || [],
    picocElementsByQuestion: {},
    isLoading,
    error: error ? String(error) : null,
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

