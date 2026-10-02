// PRISMA Report Workspace — Slim orchestrator page
// Wires the usePrismaReport hook to section components.

import { useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { useRef, useCallback, useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { RootState } from "../../../redux/store";
import { usePrismaReport } from "../../../hooks/usePrismaReport";
import { FiClipboard, FiAlertCircle, FiArrowLeft } from "react-icons/fi";

import PrismaReportHeader from "./sections/PrismaReportHeader";
// import PrismaExportActions from "./sections/PrismaExportActions";
import PrismaSummaryHeader from "./sections/PrismaSummaryHeader";
import PrismaFlowDiagram, {
  type PrismaFlowDiagramRef,
} from "./sections/PrismaFlowDiagram";
import PrismaExclusionTable from "./sections/PrismaExclusionTable";
import PrismaReportHistory from "./sections/PrismaReportHistory";
import PrismaExportActions from "./sections/PrismaExportActions";

export default function PrismaReportWorkspace() {
  const { projectId, processId } = useParams<{
    projectId: string;
    processId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const diagramRef = useRef<PrismaFlowDiagramRef>(null);

  const handleExportPNG = useCallback(() => {
    diagramRef.current?.exportImage();
  }, []);

  const effectiveProjectId = projectId || processId || "";

  const {
    latestReport,
    activeReport,
    reportHistory,
    summaryStats,
    nodes,
    includedNode,
    hasReport,
    isLoadingLatest,
    isLoadingHistory,
    isGenerating,
    isDownloading,
    isLoadingSelected,
    latestError,
    generateError,
    selectedError,
    isViewingHistorical,
    activeReportId,
    generateReport,
    selectReport,
    clearSelection,
    downloadPrismaDiagram,
    refreshAll,
  } = usePrismaReport({ reviewProcessId: effectiveProjectId });

  // React Query fetches on mount automatically — no useEffect needed

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleBack = () => {
    if (projectId && processId) {
      navigate(`/projects/${projectId}/processes/${processId}`);
    } else {
      navigate(`/projects/${effectiveProjectId}`);
    }
  };

  const handleGenerate = async () => {
    if (cooldown > 0 || isGenerating) return;
    setCooldown(5);

    const nextVersion = latestReport
      ? (Math.round((Number(latestReport.version) + 0.1) * 10) / 10).toFixed(1)
      : "1.0";
    const result = await generateReport({
      version: nextVersion,
      notes: "Generated from PRISMA Report workspace",
      generatedBy: user?.name ?? user?.email ?? undefined,
    });
    
    if (result) {
      if (result.id === latestReport?.id) {
        toast("PRISMA diagram is already up-to-date with current review data.", {
          icon: "ℹ️",
        });
      } else {
        toast.success(`Generated PRISMA Report v${result.version}`);
      }
    }
  };

  const handleSelectReport = (reportId: string) => {
    // If clicking the report that's already active, do nothing
    if (reportId === activeReportId) return;
    // If clicking the latest report, clear selection instead
    if (reportId === latestReport?.id) {
      clearSelection();
      return;
    }
    selectReport(reportId);
  };

  const isLoading = isLoadingLatest || isLoadingSelected;

  return (
    <div className="min-h-screen bg-bg-secondary print:bg-surface-white">
      {/* ── Sticky Header ── */}
      <PrismaReportHeader onBack={handleBack}>
        <PrismaExportActions
          hasReport={hasReport}
          isGenerating={isGenerating}
          isDownloading={isDownloading}
          cooldown={cooldown}
          onGenerate={handleGenerate}
          onDownloadDiagram={downloadPrismaDiagram}
          onExportPNG={handleExportPNG}
          nodes={nodes}
          includedNode={includedNode}
          version={activeReport?.version}
          generatedAt={activeReport?.generatedAt}
        />
      </PrismaReportHeader>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
        {/* Error banner */}
        {(latestError || generateError || selectedError) && (
          <div
            className="flex items-start gap-3 p-4 bg-surface-white border border-border/70 rounded-xl shadow-sm"
            role="alert"
          >
            <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {latestError || generateError || selectedError}
              </p>
              <button
                onClick={refreshAll}
                className="text-sm text-red-600 hover:text-red-800 underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Historical version banner */}
        {isViewingHistorical && activeReport && (
          <div className="flex items-center gap-3 p-4 bg-amber-50/70 border border-amber-200/70 rounded-xl">
            <FiAlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Viewing historical report — Version {activeReport.version}
                {activeReport.generatedAt && (
                  <span className="font-normal text-amber-600">
                    {" "}
                    generated on{" "}
                    {new Date(activeReport.generatedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={clearSelection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              Back to latest
            </button>
          </div>
        )}

        {/* Empty state — no report yet */}
        {!isLoading && !hasReport && !latestError && (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-light flex items-center justify-center">
              <FiClipboard className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              No PRISMA Report Generated
            </h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
              Generate a PRISMA 2020 flow diagram report to visualise the
              current state of your systematic review pipeline. The report is a
              snapshot calculated from your review data.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? "Generating…" : "Generate PRISMA Report"}
            </button>
          </div>
        )}

        {/* Report content (visible when report exists or loading) */}
        {(isLoading || hasReport) && (
          <>
            {/* Report overview */}
            <PrismaSummaryHeader
              stats={summaryStats}
              isLoading={isLoading}
              generatedAt={activeReport?.generatedAt}
            />

            {/* Flow diagram — core visual */}
            <section className="bg-surface-white border border-border/70 rounded-xl p-4 sm:p-6 shadow-sm print:shadow-none print:border-0">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  PRISMA 2020 Flow Diagram
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Preferred Reporting Items for Systematic Reviews and Meta-Analyses
                </p>
              </div>
              <PrismaFlowDiagram
                ref={diagramRef}
                nodes={nodes}
                includedNode={includedNode}
                isLoading={isLoading}
              />
            </section>

            {/* Bottom grid: Exclusion table + Report history */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 items-start">
              <div className="lg:col-span-3 bg-surface-white border border-border/70 rounded-xl p-4 sm:p-5 shadow-sm">
                <PrismaExclusionTable nodes={nodes} isLoading={isLoading} />
              </div>
              <div className="lg:col-span-2 bg-surface-white border border-border/70 rounded-xl p-4 sm:p-5 shadow-sm">
                <PrismaReportHistory
                  reports={reportHistory}
                  isLoading={isLoadingHistory}
                  activeReportId={activeReportId}
                  onSelectReport={handleSelectReport}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
