import { useEffect, useState } from "react";
import { useDataExtractionWorkspace } from "./useDataExtractionWorkspace";
import type { ExtractionAuditEntryDto } from "../../../../types/dataExtraction";

export interface UseCellAuditLogsParams {
  projectId?: string;
  paperId?: string | null;
  fieldId?: string | null;
  isOpen: boolean;
}

export function useCellAuditLogs({
  projectId,
  paperId,
  fieldId,
  isOpen,
}: UseCellAuditLogsParams) {
  const workspace = useDataExtractionWorkspace();
  const [data, setData] = useState<ExtractionAuditEntryDto[]>([]);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (
      !isOpen ||
      !projectId ||
      workspace.projectId !== projectId ||
      !paperId ||
      !fieldId
    ) {
      setData([]);
      setError(null);
      return;
    }

    let isCurrent = true;
    setError(null);

    void workspace
      .fetchAuditLogs({ paperId, fieldId })
      .then((logs) => {
        if (isCurrent) {
          setData(logs);
        }
      })
      .catch((caughtError: unknown) => {
        if (isCurrent) {
          setError(caughtError);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [
    fieldId,
    isOpen,
    paperId,
    projectId,
    workspace.fetchAuditLogs,
    workspace.isAuditLoading,
    workspace.projectId,
  ]);

  return {
    data,
    error,
    isLoading: workspace.isAuditLoading,
  };
}

export default useCellAuditLogs;
