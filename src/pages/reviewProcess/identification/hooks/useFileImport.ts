import { useState } from "react";
import { paperImportService } from "../../../../services/paperImportService";
import { toastSuccess, toastError, toastWarning } from "../../../../utils/toast";
import { AxiosError } from "axios";

interface UseFileImportOptions {
  projectId: string | undefined;
  identificationPhaseId: string | undefined;
  onImportSuccess?: () => Promise<void> | void;
}

export const useFileImport = ({ projectId, identificationPhaseId, onImportSuccess }: UseFileImportOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  /**
   * Core import logic shared between quick import and modal import
   */
  const executeImport = async (
    file: File,
    searchSourceId: string,
    searchExecutionId?: string,
  ): Promise<boolean> => {
    if (!projectId || !identificationPhaseId) {
      toastError("Error", "Project or Identification module not found");
      return false;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await paperImportService.quickImport(
        file,
        projectId,
        searchSourceId || undefined,
        (progress) => setUploadProgress(progress),
        searchExecutionId,
      );

      if (result.data) {
        const { importedRecords, duplicateRecords, skippedRecords, errors } = result.data;

        if (importedRecords > 0) {
          toastSuccess(
            "Import Successful",
            `Successfully imported ${importedRecords} paper${importedRecords !== 1 ? "s" : ""}` +
              (duplicateRecords > 0
                ? ` (${duplicateRecords} duplicate${duplicateRecords !== 1 ? "s" : ""} , new duplicated pairs will be added to the list)`
                : ""),
          );
        }

        if (skippedRecords > 0) {
          toastWarning(
            "Records Skipped",
            `${skippedRecords} record${skippedRecords !== 1 ? "s" : ""} skipped due to validation errors`,
          );
        }

        if (errors.length > 0) {
          console.error("Import errors:", errors);
          toastError(
            "Import Errors",
            `Errors: ${errors.slice(0, 2).join("; ")}${errors.length > 2 ? "..." : ""}`,
          );
        }

        if (onImportSuccess) {
          await onImportSuccess();
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("RIS import failed:", error);

      let errorMessage = "Failed to import RIS file";

      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toastError("Import Failed", errorMessage);
      return false;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Quick import (from strategies tab card)
   */
  const handleQuickImport = async (file: File, source: string, searchExecutionId?: string) => {
    await executeImport(file, source, searchExecutionId);
  };

  /**
   * Modal import (from ImportRISModal)
   */
  const handleImportSubmit = async (
    file: File,
    source?: string,
    searchExecutionId?: string,
  ): Promise<boolean> => {
    return executeImport(file, source || "", searchExecutionId);
  };

  return {
    isUploading,
    uploadProgress,
    handleQuickImport,
    handleImportSubmit,
  };
};
