import { useMutation, useQuery } from "@tanstack/react-query";
import { selectionCriteriaService } from "../services/selectionCriteriaService";
import type { AICriteriaResponse, SaveAiResultRequest, StudySelectionCriteriaDto } from "../types/selectionCriteria";

export const useGenerateAiCriteria = () => {
  return useMutation<AICriteriaResponse, Error, string>({
    mutationFn: async (projectId: string) => {
      const response = await selectionCriteriaService.generateAi(projectId);
      if (!response.isSuccess) {
        throw new Error(response.message || "Failed to generate AI criteria");
      }
      return response.data;
    },
  });
};

export const useSaveAiCriteria = () => {
  return useMutation<void, Error, { projectId: string; data: SaveAiResultRequest }>({
    mutationFn: async ({ projectId, data }) => {
      const response = await selectionCriteriaService.saveAiResult(projectId, data);
      if (!response.isSuccess) {
        throw new Error(response.message || "Failed to save selection criteria");
      }
    },
  });
};

export const useSelectionCriteria = (projectId: string | undefined) => {
  return useQuery<StudySelectionCriteriaDto[]>({
    queryKey: ["selection-criteria", projectId],
    queryFn: async () => {
      const response = await selectionCriteriaService.getByProjectId(projectId!);
      if (!response.isSuccess) {
        throw new Error(response.message || "Failed to fetch selection criteria");
      }
      return response.data;
    },
    enabled: !!projectId,
  });
};
