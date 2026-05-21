import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { paperImportService } from "../services/paperImportService";
import { QUERY_KEYS } from "../constants/queryKeys";
import { getErrorMessage } from "../utils/errorUtils";
import type {
  RisFileImportRequest,
  BibTexFileImportRequest,
  DoiImportRequest,
  CrossrefImportRequest,
} from "../types/paper";

export function usePaperImport(projectId?: string) {
  const queryClient = useQueryClient();

  // ---- Mutation: Import RIS File ----
  const importRisMutation = useMutation({
    mutationFn: (request: RisFileImportRequest) => paperImportService.importRisFile(request),
    onSuccess: (response) => {
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: ["paper-pool", projectId],
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.paperPool.metadata(projectId),
        });
      }
      toast.success(response.message || "Papers imported successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to import RIS file"));
    },
  });

  // ---- Mutation: Import BibTeX File ----
  const importBibTexMutation = useMutation({
    mutationFn: (request: BibTexFileImportRequest) => paperImportService.importBibTexFile(request),
    onSuccess: (response) => {
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: ["paper-pool", projectId],
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.paperPool.metadata(projectId),
        });
      }
      toast.success(response.message || "Papers imported successfully from BibTeX");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to import BibTeX file"));
    },
  });

  // ---- Mutation: Import by DOI ----
  const importByDoiMutation = useMutation({
    mutationFn: (request: DoiImportRequest) => paperImportService.importByDoi(request),
    onSuccess: (response) => {
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: ["paper-pool", projectId],
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.paperPool.metadata(projectId),
        });
      }
      toast.success(response.message || "Paper imported successfully by DOI");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to import paper by DOI"));
    },
  });

  // ---- Mutation: Import from Crossref ----
  const importFromCrossrefMutation = useMutation({
    mutationFn: (request: CrossrefImportRequest) => paperImportService.importFromCrossref(request),
    onSuccess: (response) => {
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: ["paper-pool", projectId],
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.paperPool.metadata(projectId),
        });
      }
      toast.success(response.message || "Papers imported successfully from Crossref");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to import papers from Crossref"));
    },
  });

  return {
    // RIS
    importRis: importRisMutation.mutateAsync,
    isImportingRis: importRisMutation.isPending,

    // BibTeX
    importBibTex: importBibTexMutation.mutateAsync,
    isImportingBibTex: importBibTexMutation.isPending,

    // DOI
    importByDoi: importByDoiMutation.mutateAsync,
    isImportingByDoi: importByDoiMutation.isPending,

    // Crossref
    importFromCrossref: importFromCrossrefMutation.mutateAsync,
    isImportingFromCrossref: importFromCrossrefMutation.isPending,
  };
}
