import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastError, toastSuccess } from "../utils/toast";
import { paperImportService } from "../services/paperImportService";
import { QUERY_KEYS } from "../constants/queryKeys";
import { getErrorMessage } from "../utils/errorUtils";
import type {
  RisFileImportRequest,
  BibTexFileImportRequest,
  PdfFileImportRequest,
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
      toastSuccess(response.message || "Papers imported successfully");
    },
    onError: (error) => {
      toastError(getErrorMessage(error, "Failed to import RIS file"));
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
      toastSuccess(response.message || "Papers imported successfully from BibTeX");
    },
    onError: (error) => {
      toastError(getErrorMessage(error, "Failed to import BibTeX file"));
    },
  });

  const pdfImportMutation = useMutation({
    mutationFn: (request: PdfFileImportRequest) => paperImportService.importPdfFile(request),
    onSuccess: (response) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["paper-pool", projectId] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paperPool.metadata(projectId) });
      }
      toastSuccess(response.message || "PDF imported successfully");
    },
    onError: (error) => toastError(getErrorMessage(error, "Failed to import PDF file")),
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
      toastSuccess(response.message || "Paper imported successfully by DOI");
    },
    onError: (error) => {
      toastError(getErrorMessage(error, "Failed to import paper by DOI"));
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
      toastSuccess(response.message || "Papers imported successfully from Crossref");
    },
    onError: (error) => {
      toastError(getErrorMessage(error, "Failed to import papers from Crossref"));
    },
  });

  return {
    // RIS
    importRis: importRisMutation.mutateAsync,
    isImportingRis: importRisMutation.isPending,

    // BibTeX
    importBibTex: importBibTexMutation.mutateAsync,
    isImportingBibTex: importBibTexMutation.isPending,
    importPdf: pdfImportMutation.mutateAsync,
    isImportingPdf: pdfImportMutation.isPending,

    // DOI
    importByDoi: importByDoiMutation.mutateAsync,
    isImportingByDoi: importByDoiMutation.isPending,

    // Crossref
    importFromCrossref: importFromCrossrefMutation.mutateAsync,
    isImportingFromCrossref: importFromCrossrefMutation.isPending,
  };
}
