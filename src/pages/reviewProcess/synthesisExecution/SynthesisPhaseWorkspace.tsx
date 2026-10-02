import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Layers3, NotebookText } from "lucide-react";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { useReviewProcess } from "../../../hooks/useReviewProcesses";
import { formatDate } from "../../../utils/dateFormat";
import { useSynthesisWorkspace } from "./hooks/useSynthesisWorkspace";
import DescriptiveChartsWorkspace from "./DescriptiveChartsWorkspace";
import SynthesisDashboard from "./SynthesisDashboard";
import ThematicWorkspace from "./ThematicWorkspace";
import RqReportingWorkspace from "./RqReportingWorkspace";
import SynthesisStrategyModal from "./components/SynthesisStrategyModal";
import StrategyGuidelinesModal from "./components/StrategyGuidelinesModal";
import SynthesisWorkspaceErrorBoundary from "./components/SynthesisWorkspaceErrorBoundary";

type SynthesisSectionKey =
  | "overview"
  | "descriptive-charts"
  | "thematic-analysis"
  | "rq-reporting";

const SECTION_LABELS: Record<SynthesisSectionKey, string> = {
  overview: "Overview",
  "descriptive-charts": "Descriptive Charts",
  "thematic-analysis": "Thematic Analysis",
  "rq-reporting": "RQ Reporting",
};

function resolveSection(pathname: string): SynthesisSectionKey {
  if (pathname.includes("rq-reporting")) {
    return "rq-reporting";
  }

  if (pathname.includes("descriptive-charts")) {
    return "descriptive-charts";
  }

  if (pathname.includes("thematic-analysis")) {
    return "thematic-analysis";
  }

  return "overview";
}

export default function SynthesisPhaseWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, processId } = useParams<{
    projectId: string;
    processId: string;
  }>();
  const workspace = useSynthesisWorkspace();
  const { process: reviewProcess } = useReviewProcess(processId);
  const [filterHighQualityOnly, setFilterHighQualityOnly] =
    useState<boolean>(false);
  const [thematicViewMode, setThematicViewMode] = useState<
    "cards" | "matrix" | "subgroup"
  >("cards");
  const [isStrategyGuidelinesOpen, setIsStrategyGuidelinesOpen] =
    useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const synthesisBasePath = `/projects/${projectId}/processes/${processId}/synthesis`;

  const activeSection = resolveSection(location.pathname);
  const phaseIsStarted =
    workspace.processStatus && workspace.processStatus !== "NotStarted";

  useEffect(() => {
    if (
      phaseIsStarted &&
      activeSection === "overview" &&
      !location.pathname.endsWith("overview")
    ) {
      navigate(`${synthesisBasePath}/overview`, { replace: true });
    }
  }, [
    activeSection,
    location.pathname,
    navigate,
    phaseIsStarted,
    synthesisBasePath,
  ]);

  const handleBack = () => {
    if (!projectId || !processId) {
      navigate("/projects");
      return;
    }

    navigate(`/projects/${projectId}/processes/${processId}`);
  };

  const handleStart = async () => {
    await workspace.startSynthesis();
  };

  const isReadOnly = workspace.processStatus === "Completed";

  const tabs = useMemo(
    () => [
      {
        key: "overview" as const,
        label: SECTION_LABELS.overview,
        icon: Layers3,
      },
      {
        key: "descriptive-charts" as const,
        label: SECTION_LABELS["descriptive-charts"],
        icon: BarChart3,
      },
      {
        key: "thematic-analysis" as const,
        label: SECTION_LABELS["thematic-analysis"],
        icon: NotebookText,
      },
      {
        key: "rq-reporting" as const,
        label: SECTION_LABELS["rq-reporting"],
        icon: NotebookText,
      },
    ],
    [],
  );

  if (workspace.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg-secondary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (workspace.error || !workspace.workspace) {
    return (
      <div className="min-h-screen bg-bg-secondary px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-[4px] border border-border bg-surface-white p-6 shadow-none">
          <h2 className="text-lg font-semibold text-red-900">
            Synthesis Workspace Error
          </h2>
          <p className="mt-2 text-sm text-red-700">
            {workspace.error || "Unable to load synthesis workspace."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => workspace.refetchWorkspace()}
            >
              Retry
            </Button>
            <Button variant="secondary" onClick={handleBack}>
              Back to Process
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (workspace.processStatus === "NotStarted") {
    return (
      <div className="min-h-screen bg-bg-secondary px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-[4px] border border-border bg-surface-white p-8 shadow-none">
          <div className="flex items-center gap-3">
            <div className="rounded-[4px] bg-blue-50 p-3 text-blue-600">
              <Layers3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary">
                Synthesis Phase
              </p>
              <h1 className="text-2xl font-semibold text-text-primary">
                Start the synthesis workspace
              </h1>
            </div>
          </div>

          <div className="mt-6 rounded-[4px] border border-border bg-bg-primary p-6">
            <p className="text-sm leading-6 text-text-secondary">
              The synthesis phase is not started yet. Once activated, the
              workspace will unlock thematic analysis and research question
              reporting.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={() => setIsStrategyModalOpen(true)}
              isLoading={workspace.isStarting}
            >
              Start Synthesis Phase
            </Button>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Process
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="border-b border-border bg-surface-white shadow-none">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="shrink-0 rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              title="Back to Process Workspace"
              aria-label="Back to Process Workspace"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Layers3 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="line-clamp-2 text-base font-semibold leading-5 text-text-primary sm:text-lg">
                {reviewProcess?.name || reviewProcess?.processName || "Systematic Literature Review"}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-secondary">
                  Synthesis / {SECTION_LABELS[activeSection]}
                </span>
                <span className="h-1 w-1 rounded-full bg-text-muted" aria-hidden="true" />
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    workspace.processStatus === "InProgress"
                      ? "bg-success/10 text-success"
                      : workspace.processStatus === "Completed"
                        ? "bg-primary-light text-primary"
                        : "bg-bg-secondary text-text-secondary"
                  }`}
                >
                  {workspace.processStatus === "InProgress"
                    ? "In progress"
                    : workspace.processStatus === "Completed"
                      ? "Completed"
                      : (workspace.processStatus ?? "")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pl-12 sm:pl-14 lg:gap-5 lg:pl-0">
            <div className="text-xs text-text-secondary">
              <div className="text-[10px] font-medium text-text-muted">Studies</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {workspace.workspace?.totalExtractedPapers ?? 0} extracted
              </div>
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
            <div className="text-xs text-text-secondary">
              <div className="text-[10px] font-medium text-text-muted">Started</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {formatDate(workspace.workspace?.process.startedAt ?? "")}
              </div>
            </div>
            <div className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
            <div className="text-xs text-text-secondary">
              <div className="text-[10px] font-medium text-text-muted">Last updated</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {formatDate(reviewProcess?.modifiedAt ?? workspace.workspace?.process.completedAt ?? workspace.workspace?.process.startedAt ?? "")}
              </div>
            </div>
            {Boolean(workspace.processStatus) && (
              <Button
                variant={
                  workspace.processStatus === "InProgress" &&
                  workspace.allFindingsFinalized &&
                  !isReadOnly
                    ? "success"
                    : "outline"
                }
                onClick={workspace.completeSynthesis}
                disabled={
                  workspace.processStatus !== "InProgress" ||
                  !workspace.allFindingsFinalized ||
                  isReadOnly ||
                  workspace.isCompleting
                }
                isLoading={workspace.isCompleting}
                size="sm"
                className="normal-case tracking-normal"
              >
                Complete phase
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div
            className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-surface-white px-3 py-2"
            title="When enabled, synthesis views include high-quality studies only."
          >
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-medium leading-4 text-text-primary">Sensitivity analysis</span>
              <span className="text-[11px] leading-4 text-text-secondary">Exclude low-quality studies</span>
            </div>
            <button
              type="button"
              id="sensitivity-toggle"
              role="switch"
              aria-label="Exclude low-quality studies"
              aria-checked={filterHighQualityOnly}
              onClick={() => setFilterHighQualityOnly((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${filterHighQualityOnly ? "bg-primary" : "bg-slate-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-surface-white shadow-none transition-transform ${filterHighQualityOnly ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Process
          </Button>
        </div>

        <nav aria-label="Synthesis sections" className="mb-5 overflow-x-auto border-b border-border">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => navigate(`${synthesisBasePath}/${tab.key}`)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative inline-flex min-h-[48px] items-center justify-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35 ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:bg-bg-primary/70 hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <SynthesisWorkspaceErrorBoundary>
          {activeSection === "thematic-analysis" ? (
            <ThematicWorkspace
              workspace={workspace.workspace}
              sourceDataGroups={workspace.sourceDataGroups}
              filterHighQualityOnly={filterHighQualityOnly}
              viewMode={thematicViewMode}
              onViewModeChange={setThematicViewMode}
              isReadOnly={isReadOnly}
              isCreatingTheme={workspace.isCreatingTheme}
              isUpdatingTheme={workspace.isUpdatingTheme}
              isDeletingTheme={workspace.isDeletingTheme}
              isLinkingEvidence={workspace.isLinkingEvidence}
              isUnlinkingEvidence={workspace.isUnlinkingEvidence}
              onCreateTheme={workspace.createTheme}
              onUpdateTheme={workspace.updateTheme}
              onDeleteTheme={workspace.deleteTheme}
              onLinkEvidence={workspace.linkEvidence}
              onUnlinkEvidence={workspace.unlinkEvidence}
              onViewStrategyGuidelines={() => setIsStrategyGuidelinesOpen(true)}
            />
          ) : activeSection === "descriptive-charts" ? (
            <DescriptiveChartsWorkspace
              sourceDataGroups={workspace.sourceDataGroups}
              filterHighQualityOnly={filterHighQualityOnly}
            />
          ) : activeSection === "rq-reporting" ? (
            <RqReportingWorkspace
              workspace={workspace.workspace}
              themes={workspace.themes}
              isReadOnly={isReadOnly}
              isSavingFinding={workspace.isSavingFinding}
              onSaveFinding={workspace.saveFinding}
              onViewStrategyGuidelines={() => setIsStrategyGuidelinesOpen(true)}
            />
          ) : (
            <SynthesisDashboard
              workspace={workspace.workspace}
              finalizedFindingCount={workspace.finalizedFindingCount}
              evidenceCount={workspace.evidenceCount}
              isReadOnly={isReadOnly}
              onNavigateToThematic={() =>
                navigate(`${synthesisBasePath}/thematic-analysis`)
              }
              onNavigateToDescriptiveCharts={() =>
                navigate(`${synthesisBasePath}/descriptive-charts`)
              }
              onNavigateToRqReporting={() =>
                navigate(`${synthesisBasePath}/rq-reporting`)
              }
            />
          )}
        </SynthesisWorkspaceErrorBoundary>
      </main>

      {workspace.workspace?.process.id ? (
        <StrategyGuidelinesModal
          isOpen={isStrategyGuidelinesOpen}
          onClose={() => setIsStrategyGuidelinesOpen(false)}
          synthesisProcessId={workspace.workspace.process.id}
        />
      ) : null}

      {projectId && workspace.workspace?.process.id && isStrategyModalOpen ? (
        <SynthesisStrategyModal
          isOpen={isStrategyModalOpen}
          projectId={projectId}
          synthesisProcessId={workspace.workspace.process.id}
          onClose={() => setIsStrategyModalOpen(false)}
          onStartSynthesis={handleStart}
        />
      ) : null}
    </div>
  );
}
