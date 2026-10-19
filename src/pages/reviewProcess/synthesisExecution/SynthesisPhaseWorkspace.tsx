import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Layers3, NotebookText } from "lucide-react";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { useProjectMember } from "../../../hooks/useProjectMember";
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
import QueryErrorState from "../../../components/ui/QueryErrorState";

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
  const { member } = useProjectMember(projectId);
  // Only the project leader runs Synthesis; reviewers read it.
  const isLeader = member?.isLeader ?? false;
  const [filterHighQualityOnly, setFilterHighQualityOnly] =
    useState<boolean>(false);
  const [thematicViewMode, setThematicViewMode] = useState<
    "cards" | "matrix" | "subgroup"
  >("cards");
  const [transitioningSection, setTransitioningSection] = useState<SynthesisSectionKey | null>(null);
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

  const isReadOnly = workspace.processStatus === "Completed" || !isLeader;

  const tabs = useMemo(
    () => [
      {
        key: "overview" as const,
        label: SECTION_LABELS.overview,
        compactLabel: "Overview",
        icon: Layers3,
      },
      {
        key: "descriptive-charts" as const,
        label: SECTION_LABELS["descriptive-charts"],
        compactLabel: "Charts",
        icon: BarChart3,
      },
      {
        key: "thematic-analysis" as const,
        label: SECTION_LABELS["thematic-analysis"],
        compactLabel: "Themes",
        icon: NotebookText,
      },
      {
        key: "rq-reporting" as const,
        label: SECTION_LABELS["rq-reporting"],
        compactLabel: "RQ",
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
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl items-center px-4 py-8 sm:px-6">
        <QueryErrorState
          title="Synthesis workspace unavailable"
          message={workspace.error || "Unable to load synthesis workspace."}
          onRetry={() => void workspace.refetchWorkspace()}
          retryLabel="Retry"
          onBack={handleBack}
          backLabel="Back to process"
        />
      </div>
    );
  }

  const strategyModal =
    isLeader && projectId && workspace.workspace.process.id && isStrategyModalOpen ? (
      <SynthesisStrategyModal
        isOpen={isStrategyModalOpen}
        projectId={projectId}
        synthesisProcessId={workspace.workspace.process.id}
        onClose={() => setIsStrategyModalOpen(false)}
        onStartSynthesis={handleStart}
      />
    ) : null;

  if (workspace.processStatus === "NotStarted") {
    return (
      <div className="min-h-screen bg-bg-secondary px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-xl border border-border bg-surface-white p-8 shadow-none">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-light p-3 text-accent">
              <Layers3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary">
                Phase B · Conducting
              </p>
              <h1 className="text-2xl font-semibold text-text-primary">
                Start the synthesis workspace
              </h1>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-bg-primary p-6">
            <p className="text-sm leading-6 text-text-secondary">
              {isLeader
                ? "The synthesis module is not started yet. Once activated, this workspace will unlock thematic analysis and research question reporting."
                : "The synthesis module has not been started by the project leader yet."}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {isLeader && (
              <Button
                onClick={() => setIsStrategyModalOpen(true)}
                isLoading={workspace.isStarting}
              >
                Start synthesis module
              </Button>
            )}
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Process
            </Button>
          </div>
        </div>
        {strategyModal}
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
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl p-2.5 text-text-secondary motion-safe:transition-colors hover:bg-bg-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 motion-reduce:transition-none"
              title="Back to Process Workspace"
              aria-label="Back to Process Workspace"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Layers3 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="review-process-header-title line-clamp-2 text-base font-semibold leading-5 text-text-primary sm:text-lg">
                {reviewProcess?.name || reviewProcess?.processName || "Systematic Literature Review"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-secondary">
                  Synthesis / {SECTION_LABELS[activeSection]}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    workspace.processStatus === "InProgress"
                      ? "text-text-secondary"
                      : workspace.processStatus === "Completed"
                        ? "text-text-secondary"
                        : "text-text-muted"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${workspace.processStatus === "Completed" ? "bg-success" : workspace.processStatus === "InProgress" ? "bg-primary" : "bg-text-muted"}`} aria-hidden="true" />
                  {workspace.processStatus === "InProgress"
                    ? "In progress"
                    : workspace.processStatus === "Completed"
                      ? "Completed"
                      : workspace.processStatus === "NotStarted"
                        ? "Not started"
                        : (workspace.processStatus ?? "")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-12 sm:pl-14 lg:gap-x-5 lg:pl-0">
            <div className="text-xs text-text-secondary">
              <div className="text-[10px] font-medium text-text-muted">Studies</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {workspace.workspace?.totalExtractedPapers ?? 0} extracted
              </div>
            </div>
            <div className="hidden h-7 w-px bg-border/70 sm:block" aria-hidden="true" />
            <div className="text-xs text-text-secondary">
              <div className="text-[10px] font-medium text-text-muted">Started</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {formatDate(workspace.workspace?.process.startedAt ?? "")}
              </div>
            </div>
            <div className="hidden h-7 w-px bg-border/70 sm:block" aria-hidden="true" />
            <div className="text-xs text-text-secondary">
              <div className="text-[10px] font-medium text-text-muted">Last updated</div>
              <div className="mt-0.5 font-medium text-text-primary">
                {formatDate(reviewProcess?.modifiedAt ?? workspace.workspace?.process.completedAt ?? workspace.workspace?.process.startedAt ?? "")}
              </div>
            </div>
            {Boolean(workspace.processStatus) && isLeader && (
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
                size="md"
                className="normal-case tracking-normal disabled:border-border disabled:bg-bg-secondary disabled:text-text-muted disabled:opacity-100"
              >
                Mark module complete
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 border-b border-border/70 xl:min-h-14 xl:flex-row xl:items-stretch xl:gap-5">
          <div className="inline-flex min-h-14 max-w-full shrink-0 items-center gap-3 rounded-xl border border-border/50 bg-surface-white/70 px-3 py-2 sm:px-4">
            <div
              className="flex min-w-0 items-center gap-3"
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
                className="inline-flex h-11 w-[52px] shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              >
                <span aria-hidden="true" className={`relative inline-flex h-6 w-11 items-center rounded-full motion-safe:transition-colors motion-safe:duration-150 motion-reduce:transition-none ${filterHighQualityOnly ? "bg-primary" : "bg-border"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-surface-white shadow-none motion-safe:transition-transform motion-safe:duration-150 motion-reduce:transform-none motion-reduce:transition-none ${filterHighQualityOnly ? "translate-x-5" : "translate-x-1"}`} />
                </span>
              </button>
            </div>
          </div>

          <nav aria-label="Synthesis sections" className="min-w-0 flex-1 overflow-x-auto md:self-stretch">
            <div className="flex min-h-14 min-w-max items-center gap-0.5 sm:gap-2 md:h-full md:items-stretch md:gap-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      if (!isActive) setTransitioningSection(tab.key);
                      navigate(`${synthesisBasePath}/${tab.key}`);
                    }}
                    aria-label={tab.label}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1 px-0.5 text-sm font-medium motion-safe:transition-colors motion-safe:duration-150 after:absolute after:bottom-[-1px] after:left-1 after:right-1 after:h-0.5 after:rounded-full after:content-[''] after:motion-safe:transition-colors focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-1 sm:gap-2 sm:px-2 md:h-full md:px-3 motion-reduce:transition-none ${
                      isActive
                        ? "text-primary after:bg-primary"
                        : "text-text-secondary after:bg-transparent hover:text-text-primary"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
                    <span className="sm:hidden">{tab.compactLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <div key={activeSection} className={transitioningSection === activeSection ? "ui-section-enter" : undefined}>
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
        </div>
      </main>

      {workspace.workspace?.process.id ? (
        <StrategyGuidelinesModal
          isOpen={isStrategyGuidelinesOpen}
          onClose={() => setIsStrategyGuidelinesOpen(false)}
          synthesisProcessId={workspace.workspace.process.id}
        />
      ) : null}

      {strategyModal}
    </div>
  );
}
