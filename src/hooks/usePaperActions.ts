import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toastError, toastInfo, toastSuccess } from "../utils/toast";
import { studySelectionService } from "../services/studySelectionService";
import { paperService } from "../services/paperService";
import { QUERY_KEYS } from "../constants/queryKeys";
import { getErrorMessage } from "../utils/errorUtils";
import type { UploadPdfOptions } from "../pages/reviewProcess/studySelection/uploadTypes";
import type { ScreeningDecision } from "../pages/reviewProcess/studySelection/titleAbstractScreening/types";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { PaperPhase } from "../types/studySelection";

export function usePaperActions(
  studySelectionProcessId?: string,
  phase: PaperPhase = PaperPhase.TitleAbstract,
) {
  const queryClient = useQueryClient();
  const {
    projectId: routeProjectId,
    id: urlProjectId,
    screeningProcessId: urlScreeningId,
  } = useParams<{
    projectId: string;
    id: string;
    screeningProcessId: string;
  }>();

  const finalProjectId = routeProjectId || urlProjectId;

  const finalProcessId = studySelectionProcessId || urlScreeningId;
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // ---- Mutation: Upload Full-Text PDF ----
  const uploadPaperPdfMutation = useMutation({
    mutationFn: async (vars: { paperId: string; file: File; options?: UploadPdfOptions }) => {
      if (!finalProjectId) {
        throw new Error("Cannot upload PDF: missing project.");
      }

      return studySelectionService.uploadPaperFullText({
        file: vars.file,
        projectId: finalProjectId,
        paperId: vars.paperId,
        extractWithGrobid: vars.options?.extractWithGrobid,
      });
    },
    onSuccess: (_response, variables) => {
      if (finalProcessId) {
        queryClient.invalidateQueries({
          queryKey: ["study-selection", finalProcessId, "papers"],
        });
      }

      if (finalProjectId) {
        queryClient.invalidateQueries({
          queryKey: ["paper-pool", finalProjectId],
        });
      }

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.papers.all,
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.papers.detail(variables.paperId),
      });

      if (variables.options?.extractWithGrobid) {
        toastSuccess(
          "PDF uploaded successfully. AI metadata extraction is running in the background.",
          undefined,
          { duration: 5000 },
        );
        return;
      }

      toastSuccess("PDF uploaded successfully.");
    },
    onError: (error) => {
      toastError(getErrorMessage(error, "Failed to upload PDF"));
    },
  });

  const uploadPaperPdf = useCallback(
    async (paperId: string, file: File, options?: UploadPdfOptions) => {
      const response = await uploadPaperPdfMutation.mutateAsync({ paperId, file, options });
      return response.data;
    },
    [uploadPaperPdfMutation],
  );

  // ---- Mutation: Apply Metadata Suggestion ----
  const applyMetadataSuggestionMutation = useMutation({
    mutationFn: async (vars: { paperId: string; sourceMetadataId: string; fields: string[] }) => {
      return studySelectionService.applyMetadata(vars.paperId, {
        sourceMetadataId: vars.sourceMetadataId,
        fields: vars.fields,
      });
    },
    onSuccess: (_response, variables) => {
      if (finalProcessId) {
        queryClient.invalidateQueries({
          queryKey: ["study-selection", finalProcessId, "papers"],
        });
      }

      if (finalProjectId) {
        queryClient.invalidateQueries({
          queryKey: ["paper-pool", finalProjectId],
        });
      }

      if (finalProjectId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.papers.detail(variables.paperId),
        });
      }

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.papers.all,
      });

      toastSuccess("Selected metadata applied successfully.");
    },
    onError: () => {
      toastError("Failed to apply metadata. Please try again.");
    },
  });

  const applyMetadataSuggestion = useCallback(
    async (paperId: string, sourceMetadataId: string, fields: string[]) => {
      await applyMetadataSuggestionMutation.mutateAsync({ paperId, sourceMetadataId, fields });
    },
    [applyMetadataSuggestionMutation],
  );

  // ---- Mutation: Retry Metadata Extraction ----
  const retryMetadataExtractionMutation = useMutation({
    mutationFn: async (paperId: string) => {
      return studySelectionService.retryExtraction(paperId, { provider: "GROBID" });
    },
    onSuccess: (response, paperId) => {
      if (finalProcessId) {
        queryClient.invalidateQueries({
          queryKey: ["study-selection", finalProcessId, "papers"],
        });
      }

      if (finalProjectId) {
        queryClient.invalidateQueries({
          queryKey: ["paper-pool", finalProjectId],
        });
      }

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.papers.detail(paperId),
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.papers.all,
      });

      const extraction = response.data.extraction;
      if (extraction?.status === "failed") {
        toastError(extraction.message ?? "Metadata extraction failed.");
        return;
      }

      if (extraction?.status === "partial") {
        toastInfo("Metadata extraction partially completed.");
        return;
      }

      toastSuccess("Metadata extraction completed successfully.");
    },
    onError: (error) => {
      toastError(getErrorMessage(error, "Failed to retry metadata extraction"));
    },
  });

  const retryMetadataExtraction = useCallback(
    async (paperId: string) => {
      await retryMetadataExtractionMutation.mutateAsync(paperId);
    },
    [retryMetadataExtractionMutation],
  );

  // ---- Mutation: Resolve Conflict ----
  const conflictMutation = useMutation({
    mutationFn: async (vars: { paperId: string; decision: ScreeningDecision; notes?: string }) => {
      if (!currentUser?.id) {
        throw new Error("Cannot resolve conflict: user is not authenticated.");
      }
      return studySelectionService.resolveConflict(finalProcessId!, vars.paperId, {
        finalDecision: vars.decision === "included" ? 0 : 1,
        phase,
        resolvedBy: currentUser.id,
        resolutionNotes: vars.notes ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["study-selection", finalProcessId, "papers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["study-selection", finalProcessId, "statistics"],
      });
      toastSuccess("Conflict resolved");
    },
    onError: (error) => {
      toastError(getErrorMessage(error, "Failed to resolve conflict"));
    },
  });

  const resolveConflict = useCallback(
    (paperId: string, decision: ScreeningDecision, notes?: string) => {
      conflictMutation.mutate({ paperId, decision, notes });
    },
    [conflictMutation],
  );

  // ---- Mutation: Remove Paper PDF ----
  const removePaperPdfMutation = useMutation({
    mutationFn: async (paperId: string) => {
      return paperService.removePdf(paperId);
    },
    onSuccess: (_response, paperId) => {
      if (finalProcessId) {
        queryClient.invalidateQueries({
          queryKey: ["study-selection", finalProcessId, "papers"],
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.studySelection.fullTextAssignmentPapers(finalProcessId),
        });
      }
      if (finalProjectId) {
        queryClient.invalidateQueries({
          queryKey: ["paper-pool", finalProjectId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.papers.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.papers.detail(paperId),
      });
      toastSuccess("PDF removed successfully");
    },
    onError: (error) => {
      toastError(getErrorMessage(error, "Failed to remove PDF"));
    },
  });

  const removePaperPdf = useCallback(
    async (paperId: string) => {
      await removePaperPdfMutation.mutateAsync(paperId);
    },
    [removePaperPdfMutation],
  );

  // ---- Mutation: Delete Paper (Soft Delete) ----
  const deletePaperMutation = useMutation({
    mutationFn: async (vars: { paperId: string; reason: string }) => {
      return paperService.deletePaper(vars.paperId, vars.reason);
    },
    onSuccess: () => {
      if (finalProjectId) {
        // Invalidate both the papers list and metadata
        queryClient.invalidateQueries({
          queryKey: ["paper-pool", finalProjectId],
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.paperPool.metadata(finalProjectId),
        });
      }

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.papers.all,
      });

      toastSuccess("Paper deleted successfully.");
    },
    onError: (error) => {
      toastError(getErrorMessage(error, "Failed to delete paper"));
    },
  });

  const deletePaper = useCallback(
    async (paperId: string, reason: string) => {
      await deletePaperMutation.mutateAsync({ paperId, reason });
    },
    [deletePaperMutation],
  );

  return {
    uploadPaperPdf,
    isUploadingPdf: uploadPaperPdfMutation.isPending,
    applyMetadataSuggestion,
    isApplyingMetadataSuggestion: applyMetadataSuggestionMutation.isPending,
    retryMetadataExtraction,
    isRetryingExtraction: retryMetadataExtractionMutation.isPending,
    resolveConflict,
    isResolving: conflictMutation.isPending,
    removePaperPdf,
    isRemovingPdf: removePaperPdfMutation.isPending,
    deletePaper,
    isDeletingPaper: deletePaperMutation.isPending,
    paperIdBeingDeleted: deletePaperMutation.isPending
      ? deletePaperMutation.variables?.paperId
      : null,
  };
}
