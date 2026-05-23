import { useMemo } from "react";
import { useFullTextScreening } from "./hooks/useFullTextScreening";
import FullTextPaperQueue from "./components/FullTextPaperQueue";
import FullTextReader from "./components/FullTextReader";
import FullTextRightPanel from "./components/FullTextRightPanel";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useNavigate, useParams } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
import FullTextScreeningHeader from "./components/FullTextScreeningHeader";
import type { AiHighlight } from "./types";
import { useStudySelectionDetails } from "../../../../hooks/useStudySelection";
import { SelectionProcessStatus } from "../../../../types/studySelection";

export default function FullTextScreeningWorkspace() {
  const ws = useFullTextScreening();
  const navigate = useNavigate();
  const { projectId, processId, screeningProcessId } = useParams();

  const { data: processDetails } = useStudySelectionDetails(screeningProcessId);
  const isCompleted =
    processDetails?.status === SelectionProcessStatus.Completed;

  const aiHighlights: AiHighlight[] = useMemo(() => {
    if (!ws.aiAnalysis?.aiOutput) return [];
    return ws.aiAnalysis.aiOutput.exclusionHighlights.map((text) => ({
      section: "Exclusion",
      text,
      page: 1, // Placeholder page
    }));
  }, [ws.aiAnalysis]);

  const navigateToTitleAbstract = () => {
    if (projectId && processId && screeningProcessId) {
      navigate(
        `/projects/${projectId}/processes/${processId}/screening/${screeningProcessId}`,
      );
    }
  };

  const navigateToFullText = () => {
    // Already here
  };

  if (ws.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (ws.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600 text-sm">{ws.error}</p>
        <button
          onClick={ws.handleBack}
          className="text-sm text-accent hover:underline"
        >
          Back to Review Process
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      {/* Integrated Pipeline Header */}
      <FullTextScreeningHeader
        processName={processId || "Screening Process"}
        stats={ws.stats}
        titleAbstractStats={ws.titleAbstractStats}
        onBack={ws.handleBack}
        onNavigateToFullText={navigateToFullText}
        onNavigateToTitleAbstract={navigateToTitleAbstract}
      />

      {/* 3-Column Layout */}
      {ws.papers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-surface-white border-t border-border">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 shadow-inner">
            <FiFileText className="w-10 h-10 text-blue-400 opacity-60" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            No papers available yet
          </h3>
          <p className="text-text-secondary max-w-md leading-relaxed">
            Papers will appear here in real-time once they are resolved as{" "}
            <span className="text-emerald-600 font-bold">Include</span> from the
            Title / Abstract screening phase.
          </p>
          <button
            onClick={navigateToTitleAbstract}
            className="mt-8 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-[4px] shadow-none hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Go to Title / Abstract Screening
          </button>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Left Panel — Paper Queue */}
          <div className="w-80 shrink-0">
            <FullTextPaperQueue
              papers={ws.papers}
              selectedPaperId={ws.selectedPaper?.id ?? null}
              pagination={ws.pagination}
              filters={ws.filters}
              onSelectPaper={ws.selectPaper}
              onSearchChange={ws.setSearch}
              onSortChange={ws.setSort}
              onStatusFilterChange={ws.setStatusFilter}
              onHasFullTextFilterChange={ws.setHasFullTextFilter}
              onHasConflictFilterChange={ws.setHasConflictFilter}
              onDecidedByMeFilterChange={ws.setDecidedByMeFilter}
              onPageChange={ws.goToPage}
            />
          </div>

          {/* Center Panel — Full-Text PDF Reader */}
          <div className="flex-1 min-w-0">
            <FullTextReader
              paper={ws.selectedPaper}
              aiHighlights={aiHighlights}
              onUploadPdf={ws.uploadFullText}
              onApplyMetadataSuggestion={ws.applyMetadataSuggestion}
              isUploading={ws.isUploadingFullText}
              isApplyingMetadataSuggestion={ws.isApplyingMetadataSuggestion}
              onRetryExtraction={ws.retryMetadataExtraction}
              isRetryingExtraction={ws.isRetryingMetadataExtraction}
            />
          </div>

          {/* Right Panel — AI Analysis + Decision */}
          <div className="w-96 shrink-0">
            <FullTextRightPanel
              paper={ws.selectedPaper}
              aiAnalysis={ws.aiAnalysis}
              isAnalyzing={ws.isAnalyzing}
              runAiAnalysis={ws.runAiAnalysis}
              onInclude={ws.includePaper}
              onExclude={ws.excludePaper}
              isSubmitting={ws.isSubmitting}
              onResolveConflict={ws.resolveConflict}
              isResolving={ws.isResolving}
              isDisabled={isCompleted}
            />
          </div>
        </div>
      )}
    </div>
  );
}
