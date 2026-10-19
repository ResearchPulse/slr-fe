import { useMemo } from "react";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import QueryErrorState from "../../../components/ui/QueryErrorState";
import DataExtractionConsensusWorkspace from "./components/DataExtractionConsensusWorkspace.tsx";
import DataExtractionDashboard from "./components/DataExtractionDashboard.tsx";
import DataExtractionReviewerWorkspace from "./components/DataExtractionReviewerWorkspace.tsx";
import { useDataExtractionWorkspace } from "./hooks/useDataExtractionWorkspace.ts";

export default function DataExtractionPhaseWorkspace() {
  const ws = useDataExtractionWorkspace();
  const { studyId } = useParams<{ studyId?: string }>();

  const dashboardPath = useMemo(() => {
    if (!ws.projectId) {
      return "/projects";
    }

    return `/projects/${ws.projectId}/extraction`;
  }, [ws.projectId]);

  if (ws.isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (ws.error) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl items-center px-4 py-8 sm:px-6">
        <QueryErrorState
          title="Data Extraction unavailable"
          message={ws.error}
          onRetry={() => void ws.refetch()}
          retryLabel="Retry"
          onBack={ws.handleBack}
          backLabel="Back to workflow"
        />
      </div>
    );
  }

  const selectedStudyStatus = studyId ? ws.getPaperStatus(studyId) : null;
  const isConsensusRouteTarget = ws.isCurrentUserLeader
    ? selectedStudyStatus === "in-progress" ||
      selectedStudyStatus === "awaiting-consensus" ||
      selectedStudyStatus === "completed"
    : selectedStudyStatus === "awaiting-consensus" ||
      selectedStudyStatus === "completed";

  return (
    <div className="min-h-full bg-bg-secondary flex flex-col">
      {/* Main Content */}
      <div className="pt-0">
        {studyId && isConsensusRouteTarget ? (
          !ws.isCurrentUserLeader ? (
            <DataExtractionReviewerWorkspace
              ws={ws}
              dashboardPath={dashboardPath}
              documentUrl={ws.selectedStudy?.pdfUrl}
            />
          ) : (
            <DataExtractionConsensusWorkspace
              ws={ws}
              dashboardPath={dashboardPath}
              documentUrl={ws.selectedStudy?.pdfUrl}
            />
          )
        ) : studyId ? (
          <DataExtractionReviewerWorkspace
            ws={ws}
            dashboardPath={dashboardPath}
            documentUrl={ws.selectedStudy?.pdfUrl}
          />
        ) : (
          <DataExtractionDashboard ws={ws} dashboardPath={dashboardPath} />
        )}
      </div>
    </div>
  );
}
