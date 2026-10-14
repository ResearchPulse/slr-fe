import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qualityAssessmentService } from "../../../../services/qualityAssessmentService";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { toastError, toastSuccess } from "../../../../utils/toast";
import { getErrorMessage } from "../../../../utils/errorUtils";
import type { SaveQualityCriteriaTemplateRequest } from "../../../../types/qualityAssessment";

/** Library of criteria templates: the system ones plus the signed-in user's own. */
export function useQualityCriteriaTemplates(enabled = true) {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.qualityAssessment.criteriaTemplates();
  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const templatesQuery = useQuery({
    queryKey,
    queryFn: () => qualityAssessmentService.listCriteriaTemplates(),
    enabled,
  });

  const createMutation = useMutation({
    mutationFn: (data: SaveQualityCriteriaTemplateRequest) =>
      qualityAssessmentService.createCriteriaTemplate(data),
    onSuccess: () => {
      toastSuccess("Template saved");
      refresh();
    },
    onError: (error) => toastError(getErrorMessage(error, "Failed to save the template")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<SaveQualityCriteriaTemplateRequest, "scope"> }) =>
      qualityAssessmentService.updateCriteriaTemplate(id, data),
    onSuccess: () => {
      toastSuccess("Template updated");
      refresh();
    },
    onError: (error) => toastError(getErrorMessage(error, "Failed to update the template")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => qualityAssessmentService.deleteCriteriaTemplate(id),
    onSuccess: () => {
      toastSuccess("Template deleted");
      refresh();
    },
    onError: (error) => toastError(getErrorMessage(error, "Failed to delete the template")),
  });

  return {
    templates: templatesQuery.data?.data ?? [],
    isLoadingTemplates: templatesQuery.isLoading,
    createTemplate: createMutation.mutateAsync,
    isSavingTemplate: createMutation.isPending,
    updateTemplate: updateMutation.mutateAsync,
    isUpdatingTemplate: updateMutation.isPending,
    deleteTemplate: deleteMutation.mutateAsync,
    isDeletingTemplate: deleteMutation.isPending,
  };
}
