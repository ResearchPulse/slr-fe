import { useState, useCallback, useMemo, useEffect } from "react";
import { getProjectRoleLabel, ProjectRole } from "../../types/project";
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
  Routes,
  Route,
  Navigate,
} from "react-router";
import { useMyProjects, useProject, useProjectMutations } from "../../hooks/useProjects";
import { useReviewProcessesByProject } from "../../hooks/useReviewProcesses";
import { useReviewNeeds, useDocuments } from "../../hooks/useProjectGovernance";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ProjectHeader from "../../components/projects/detail/ProjectHeader";
import StepProgressNav from "../../components/projects/detail/StepProgressNav";
import type {
  WorkflowStep,
  StepStatus,
} from "../../components/projects/detail/StepProgressNav";
import ActivateProjectStep from "../../components/projects/detail/ActivateProjectStep";
import ProjectDrawers from "../../components/projects/detail/ProjectDrawers";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ProjectMembersModal from "../../components/admin/slr-projects/ProjectMembersModal";
import ProjectFormModal from "../../components/admin/slr-projects/ProjectFormModal";
import { aiProjectSetupService } from "../../services/aiProjectSetupService";
import OverviewTabContent from "../../components/projects/detail/OverviewTabContent";
import SLRWorkflowOverview from "../../components/projects/detail/SLRWorkflowOverview";
import ProjectSetupSection from "../../components/projects/detail/ProjectSetupSection";
import PicocWizard from "../../components/projects/picocWizard/PicocWizard";
import { picocWizardStateService } from "../../services/picocWizardStateService";
import BusinessJustificationSection from "../../components/projects/detail/BusinessJustificationSection";
import PaperPoolTab from "../../components/paperPool/PaperPoolTab";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { useProjectMember } from "../../hooks/useProjectMember";

type WorkflowStepKey =
  | "picoc-scope"
  | "business-justification"
  | "project-setup"
  | "activate-project";

interface PhaseAProgress {
  reviewProtocolPassed: boolean;
  reviewJustificationPassed: boolean;
}

function readPhaseAProgress(projectId?: string): PhaseAProgress {
  const empty: PhaseAProgress = { reviewProtocolPassed: false, reviewJustificationPassed: false };
  if (!projectId) return empty;
  try {
    const stored = localStorage.getItem(`slr-phase-a-progress:${projectId}`);
    if (!stored) return empty;
    const parsed = JSON.parse(stored) as Partial<PhaseAProgress>;
    return {
      reviewProtocolPassed: parsed.reviewProtocolPassed === true,
      reviewJustificationPassed: parsed.reviewJustificationPassed === true,
    };
  } catch {
    return empty;
  }
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Project data & mutations ─────────────────────────────────────────────
  const {
    project,
    isLoading: projectLoading,
    error: projectError,
    refetch: refetchProject,
  } = useProject(id);

  const { projects: myProjects } = useMyProjects({ pageNumber: 1, pageSize: 100 });
  const { member: currentProjectMember } = useProjectMember(id);
  const projectSummary = useMemo(
    () => myProjects.find((item) => item.id === id),
    [id, myProjects],
  );
  const projectForHeader = useMemo(() => {
    if (!project) return null;
    return {
      ...project,
      roleText: currentProjectMember?.roleText || project.roleText || projectSummary?.roleText,
      role: currentProjectMember?.role ?? project.role ?? projectSummary?.role,
      isLeader: currentProjectMember?.isLeader ?? project.isLeader ?? projectSummary?.isLeader,
      leader: project.leader ?? projectSummary?.leader,
    };
  }, [project, projectSummary, currentProjectMember]);

  const {
    activateProject,
    isActivating: activateLoading,
    updateProjectDates,
    isUpdatingDates,
  } = useProjectMutations();

  const {
    processes,
    isLoading: processesLoading,
    isError: processesError,
    refetch: refetchProcesses,
  } = useReviewProcessesByProject(id);

  const {
    needs: reviewNeeds,
    isLoading: isReviewNeedsLoading,
    addNeed,
    isSubmitting: isNeedSubmitting,
  } = useReviewNeeds(id);
  const {
    documents,
    isLoading: isDocumentsLoading,
    addDocument,
    isSubmitting: isDocSubmitting,
  } = useDocuments(id);

  const [isProjectSetupReady, setIsProjectSetupReady] = useState(false);
  const [isProjectSetupChecking, setIsProjectSetupChecking] = useState(true);
  const [isPicocScopeComplete, setIsPicocScopeComplete] = useState(false);
  const [isPicocScopeChecking, setIsPicocScopeChecking] = useState(true);
  const [hasPassedReviewProtocol, setHasPassedReviewProtocol] = useState(
    () => readPhaseAProgress(id).reviewProtocolPassed,
  );
  const [hasPassedReviewJustification, setHasPassedReviewJustification] = useState(
    () => readPhaseAProgress(id).reviewJustificationPassed,
  );
  const [businessJustificationInitialTab, setBusinessJustificationInitialTab] =
    useState<"needs" | "documents" | "dates">("needs");

  const isLeader = useMemo(() => {
    if (!projectForHeader) return false;
    if (currentProjectMember) return currentProjectMember.isLeader;
    return (
      projectForHeader.isLeader === true ||
      Number(projectForHeader.role) === ProjectRole.Leader ||
      getProjectRoleLabel(projectForHeader.role ?? projectForHeader.roleText) === "Project Leader"
    );
  }, [projectForHeader, currentProjectMember]);

  const isProjectActive =
    project?.statusText === "Active" || project?.statusText === "Completed";

  // ── Current step & workflow steps ────────────────────────────────────────
  const selectedStep =
    (searchParams.get("step") as WorkflowStepKey) || "picoc-scope";
  const setSelectedStep = (step: WorkflowStepKey) => {
    setSearchParams(
      (prev) => {
        prev.set("step", step);
        return prev;
      },
      { replace: true },
    );
  };

  const checkProjectSetupReady = useCallback(async () => {
    if (!id) {
      setIsProjectSetupReady(false);
      setIsProjectSetupChecking(false);
      return;
    }

    setIsProjectSetupChecking(true);
    try {
      const response = await aiProjectSetupService.getSetupDetails(id);
      if (!response.isSuccess || !response.data) {
        setIsProjectSetupReady(false);
        return;
      }

      const data = response.data;
      const hasSetup =
        Boolean(data?.researchTopic?.trim()) ||
        Boolean(data?.researchObjective?.trim()) ||
        Boolean(data?.domain?.trim()) ||
        Boolean(data?.picoc?.population?.trim()) ||
        Boolean(data?.picoc?.intervention?.trim()) ||
        Boolean(data?.picoc?.comparator?.trim()) ||
        Boolean(data?.picoc?.outcome?.trim()) ||
        Boolean(data?.picoc?.context?.trim()) ||
        (data?.researchQuestions?.length ?? 0) > 0;

      setIsProjectSetupReady(hasSetup);
    } catch {
      setIsProjectSetupReady(false);
    } finally {
      setIsProjectSetupChecking(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkProjectSetupReady();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [checkProjectSetupReady]);

  const isReviewProtocolComplete = isPicocScopeComplete
    && isProjectSetupReady
    && hasPassedReviewProtocol;

  useEffect(() => {
    if (!id) return;
    try {
      localStorage.setItem(`slr-phase-a-progress:${id}`, JSON.stringify({
        reviewProtocolPassed: hasPassedReviewProtocol,
        reviewJustificationPassed: hasPassedReviewJustification,
      } satisfies PhaseAProgress));
    } catch {
      // Browser storage can be disabled; step completion still persists while this page stays open.
    }
  }, [id, hasPassedReviewProtocol, hasPassedReviewJustification]);

  useEffect(() => {
    let cancelled = false;
    if (projectLoading) return () => { cancelled = true; };
    if (!id || project?.statusText !== "Draft") {
      setIsPicocScopeComplete(false);
      setIsPicocScopeChecking(false);
      return () => { cancelled = true; };
    }

    setIsPicocScopeChecking(true);
    void picocWizardStateService.getState(id)
      .then((record) => {
        if (cancelled) return;
        const requiredGates = record.qualityGate.filter((gate) => gate.gateId === "G1" || gate.gateId === "G2");
        setIsPicocScopeComplete(
          record.currentStep === "review"
          && requiredGates.length === 2
          && requiredGates.every((gate) => gate.status === "passed"),
        );
      })
      .catch(() => {
        if (!cancelled) setIsPicocScopeComplete(false);
      })
      .finally(() => {
        if (!cancelled) setIsPicocScopeChecking(false);
      });

    return () => { cancelled = true; };
  }, [id, project?.statusText, projectLoading]);

  const workflowSteps: WorkflowStep[] = useMemo(() => {
    const getStatus = (stepKey: WorkflowStepKey): StepStatus => {
      if (isProjectActive) return "completed";

      if (stepKey === "picoc-scope") {
        if (isPicocScopeChecking) return selectedStep === "picoc-scope" ? "current" : "upcoming";
        return isPicocScopeComplete ? "completed" : selectedStep === "picoc-scope" ? "current" : "upcoming";
      }

      if (stepKey === "project-setup") {
        if (isPicocScopeChecking || !isPicocScopeComplete) return "locked";
        if (isReviewProtocolComplete) return "completed";
        return selectedStep === "project-setup" ? "current" : "upcoming";
      }

      if (stepKey === "business-justification") {
        if (isPicocScopeChecking || !isReviewProtocolComplete) return "locked";
        if (selectedStep === "business-justification") return "current";
        return hasPassedReviewJustification ? "completed" : "upcoming";
      }

      if (stepKey === "activate-project") {
        if (isPicocScopeChecking || !isReviewProtocolComplete) return "locked";
        return selectedStep === "activate-project" ? "current" : "upcoming";
      }

      return "locked";
    };

    return [
      {
        key: "picoc-scope",
        label: "PICOC Scope",
        status: getStatus("picoc-scope"),
      },
      {
        key: "project-setup",
        label: "Review Protocol",
        status: getStatus("project-setup"),
        lockedReason: "Complete PICOC Scope first",
      },
      {
        key: "business-justification",
        label: "Review Justification",
        status: getStatus("business-justification"),
        lockedReason: "Complete Review Protocol first",
      },
      {
        key: "activate-project",
        label: "Activate Review",
        status: getStatus("activate-project"),
        lockedReason: "Complete Review Protocol first",
      },
    ];
  }, [
    isProjectActive,
    isPicocScopeComplete,
    isPicocScopeChecking,
    isReviewProtocolComplete,
    hasPassedReviewJustification,
    isProjectSetupReady,
    selectedStep,
    reviewNeeds.length,
    documents.length,
  ]);

  // ── Step click handler ───────────────────────────────────────────────────
  const handleStepClick = (key: string) => {
    const step = workflowSteps.find((s) => s.key === key);
    if (!step || step.status === "locked") return;
    if (key === "business-justification") setBusinessJustificationInitialTab("needs");
    if (key === "activate-project") setHasPassedReviewJustification(true);
    setSelectedStep(key as WorkflowStepKey);
  };

  useEffect(() => {
    if (projectLoading || project?.statusText !== "Draft" || isPicocScopeChecking || isProjectSetupChecking) return;
    if (!isPicocScopeComplete && selectedStep !== "picoc-scope") {
      setSelectedStep("picoc-scope");
      return;
    }
    if (
      isPicocScopeComplete
      && !isReviewProtocolComplete
      && (selectedStep === "business-justification" || selectedStep === "activate-project")
    ) {
      setSelectedStep("project-setup");
    }
  }, [projectLoading, project?.statusText, isPicocScopeChecking, isProjectSetupChecking, isPicocScopeComplete, isReviewProtocolComplete, selectedStep]);

  // ── Modal states ─────────────────────────────────────────────────────────
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isObjModalOpen, setIsObjModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isPICOCModalOpen, setIsPICOCModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const location = useLocation();
  const activeMainSection = location.pathname.includes("/workspace")
    ? "paper-pool"
    : "overview";

  const savedStep = useSelector(
    (state: RootState) => state.project.paperPoolSteps?.[id || ""],
  );
  const defaultLeaderStep = (processes && processes.length > 0) ? 4 : 2;
  const targetStep = isLeader ? (savedStep && savedStep > 1 ? savedStep : defaultLeaderStep) : 5;

  const setActiveMainSection = (tab: "overview" | "paper-pool") => {
    if (tab === "overview") {
      navigate(`/projects/${id}/overview`, { replace: true });
    } else {
      navigate(`/projects/${id}/workspace/${targetStep}`, { replace: true });
    }
  };

  // ── Status transition handlers ───────────────────────────────────────────
  const handleActivate = async () => {
    if (!id) return;
    try {
      await activateProject(id);
      await refetchProject();
    } catch {
      // Error handled by mutation
    }
  };

  // Review Process handlers — mutations auto-invalidate queries (no loadProcesses needed)

  // ── Governance submission handlers ───────────────────────────────────────
  const handleAddNeedSubmit = useCallback(
    async (data: {
      description: string;
      justification: string;
      identified_by: string;
    }) => {
      if (!id) return;
      try {
        await addNeed({ project_id: id, ...data });
        setIsNeedModalOpen(false);
      } catch (err) {
        console.error(err);
      }
    },
    [id, addNeed],
  );

  const handleAddDocumentSubmit = useCallback(
    async (data: {
      sponsor: string;
      scope: string;
      budget: number;
      document_url: string;
    }) => {
      if (!id) return;
      try {
        await addDocument({ project_id: id, ...data });
        setIsDocModalOpen(false);
      } catch (err) {
        console.error(err);
      }
    },
    [id, addDocument],
  );

  const handleAddObjectiveSubmit = useCallback(async () => {
    setIsObjModalOpen(false);
  }, []);

  const handleAddQuestionSubmit = useCallback(async () => {
    setIsQuestionModalOpen(false);
  }, []);

  const handleAddPICOCSubmit = useCallback(async () => {
    setIsPICOCModalOpen(false);
  }, []);

  const handleSaveProjectDates = useCallback(
    async (payload: {
      id: string;
      startDate: string | null;
      endDate: string | null;
    }) => {
      if (!id) return;
      await updateProjectDates({ id, data: payload });
      await refetchProject();
    },
    [id, refetchProject, updateProjectDates],
  );

  // ── Render guards ────────────────────────────────────────────────────────
  if (projectLoading && !project) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-bg-primary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <p className="text-center text-red-500">{projectError}</p>
          <div className="text-center mt-4">
            <Button onClick={() => navigate("/projects")}>
              Back to Projects
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-surface-white rounded-xl border border-border p-8 text-center">
          <p className="text-text-secondary mb-6 text-sm">
            Project not found (ID: {id || "none"})
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="px-6 py-2 bg-accent text-bg-primary rounded-xl hover:bg-primary-hover transition-colors text-[12px] uppercase tracking-[0.1em]"
          >
            Back to Project List
          </button>
        </div>
      </div>
    );
  }

  // ── Activation checklist ─────────────────────────────────────────────────
  const activationChecklist = [
    {
      id: "project-setup",
      label: "Project setup defined (Required)",
      description: "Save the review topic, research field and scope details.",
      completed: isProjectSetupReady,
      required: true,
      onConfigure: () => setSelectedStep("project-setup"),
    },
    {
      id: "review-needs",
      label: "Review needs identified (Optional)",
      description: "Record the reason and intended value of this review.",
      completed: reviewNeeds.length > 0,
      required: false,
      onConfigure: () => setIsNeedModalOpen(true),
    },
    {
      id: "commissioning-documents",
      label: "Commissioning documents added (Optional)",
      description: "Attach supporting or commissioning documents for the project.",
      completed: documents.length > 0,
      required: false,
      onConfigure: () => setIsDocModalOpen(true),
    },
    {
      id: "project-dates",
      label: "Project dates set (Optional)",
      description: "Set the planned start date and, if known, the end date.",
      completed: Boolean(project.startDate),
      required: false,
      onConfigure: () => {
        setBusinessJustificationInitialTab("dates");
        setSelectedStep("business-justification");
      },
    },
  ];

  const WorkspaceRedirect = () => {
    const savedStep = useSelector(
      (state: RootState) => state.project.paperPoolSteps?.[id || ""],
    );
    const defaultLeaderStep = (processes && processes.length > 0) ? 4 : 2;
    const targetStep = isLeader ? (savedStep && savedStep > 1 ? savedStep : defaultLeaderStep) : 5;
    return <Navigate to={`workspace/${targetStep}`} replace />;
  };

  // ── Render workspace based on selected step ──────────────────────────────
  const renderWorkspace = () => {
    // ── Active / Completed / Archived → show Project Overview ──────────
    if (isProjectActive) {
      return (
        <div>
          {/* Review Processes Section */}
          <div className="mb-6 border-b border-border">
            <nav className="flex gap-6">
              <button
                type="button"
                aria-current={activeMainSection === "overview" ? "page" : undefined}
                onClick={() => setActiveMainSection("overview")}
                className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeMainSection === "overview"
                    ? "text-accent border-accent"
                    : "text-text-secondary border-transparent hover:text-text-primary"
                }`}
              >
                Overview
              </button>

              <button
                type="button"
                aria-current={activeMainSection === "paper-pool" ? "page" : undefined}
                onClick={() => setActiveMainSection("paper-pool")}
                className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeMainSection === "paper-pool"
                    ? "text-accent border-accent"
                    : "text-text-secondary border-transparent hover:text-text-primary"
                }`}
              >
                Review workspace
              </button>
            </nav>
          </div>

          <Routes>
            <Route
              path="overview"
              element={
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <OverviewTabContent
                    project={projectForHeader ?? project}
                    projectId={id || ""}
                    isLeader={isLeader}
                    isProjectActive={isProjectActive}
                    isProjectSetupReady={isProjectSetupReady}
                    isProjectSetupChecking={isProjectSetupChecking}
                    reviewNeeds={reviewNeeds}
                    documents={documents}
                    processes={processes}
                    isProcessesLoading={processesLoading}
                    processesError={processesError}
                    onRetryProcesses={() => void refetchProcesses()}
                    isUpdatingDates={isUpdatingDates}
                    handleSaveProjectDates={handleSaveProjectDates}
                    setIsNeedModalOpen={setIsNeedModalOpen}
                    setIsDocModalOpen={setIsDocModalOpen}
                    setIsMemberModalOpen={setIsMemberModalOpen}
                    onSetupSaved={() => void checkProjectSetupReady()}
                    onOpenWorkspace={() => setActiveMainSection("paper-pool")}
                  />
                </div>
              }
            />
            <Route
              path="workspace/:stepId"
              element={
                <PaperPoolTab
                  projectId={id || ""}
                  reviewProcesses={processes}
                />
              }
            />
            <Route path="workspace" element={<WorkspaceRedirect />} />
            <Route
              path="*"
              element={<Navigate to={`/projects/${id}/overview`} replace />}
            />
          </Routes>
        </div>
      );
    }

    // ── Draft project workflow steps ───────────────────────────────────
    switch (selectedStep) {
      case "picoc-scope":
        return <PicocWizard projectId={id || ""} canEdit={isLeader} onScopeCompletionChange={setIsPicocScopeComplete} />;

      case "business-justification":
        return (
          <BusinessJustificationSection
            project={project}
            projectId={id || ""}
            isLeader={isLeader}
            isProjectActive={isProjectActive}
            reviewNeeds={reviewNeeds}
            documents={documents}
            isUpdatingDates={isUpdatingDates}
            handleSaveProjectDates={handleSaveProjectDates}
            setIsNeedModalOpen={setIsNeedModalOpen}
            setIsDocModalOpen={setIsDocModalOpen}
            initialTab={businessJustificationInitialTab}
            onSkip={() => {
              setHasPassedReviewJustification(true);
              setSelectedStep("activate-project");
            }}
          />
        );

      case "project-setup":
        return (
          <ProjectSetupSection
            projectId={id || ""}
            projectTitle={project?.title}
            projectDomain={project?.domain}
            isProjectSetupReady={isProjectSetupReady}
            onSetupSaved={() => {
              setIsProjectSetupReady(true);
              setHasPassedReviewProtocol(true);
              setSelectedStep("business-justification");
            }}
            embedded={true}
            hideEditButton={!isLeader}
          />
        );

      case "activate-project":
        return isLeader ? (
          <ActivateProjectStep
            projectId={id || ""}
            isActive={false}
            checklist={activationChecklist}
            onActivate={handleActivate}
            isActivating={activateLoading}
            isCheckingReadiness={isProjectSetupChecking || isReviewNeedsLoading || isDocumentsLoading}
          />
        ) : (
          <div className="border border-border bg-surface-white p-6 text-sm text-text-secondary">
            Project activation is managed by the project leader. You can review the setup and project information here.
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* ── Top Area: Project Header + Settings ───────────────────────────── */}
      <ProjectHeader
        project={projectForHeader ?? project}
        isLeader={isLeader}
        onBack={() => navigate("/projects")}
        onEdit={() => setIsEditProjectModalOpen(true)}
        onSettings={() => navigate(`/projects/${id}/settings`)}
      />

      {project.statusText === "Draft" && (
        <SLRWorkflowOverview
          projectId={id || ""}
          isDraft
          protocolReady={isProjectSetupReady}
          isProtocolLoading={isProjectSetupChecking}
          processes={processes}
          isProcessesLoading={processesLoading}
          processesError={processesError}
          onRetryProcesses={() => void refetchProcesses()}
        />
      )}

      {/* ── Middle Area: Step Progress Navigation ─────────────────────────── */}
      {project.statusText === "Draft" && (
        <StepProgressNav
          steps={workflowSteps}
          onStepClick={handleStepClick}
          actionLabel={
            isLeader && isProjectSetupReady
              ? selectedStep === "project-setup"
                ? "Continue to justification"
                : selectedStep === "business-justification"
                  ? "Continue to activation"
                  : undefined
              : undefined
          }
          onAction={() => {
            if (selectedStep === "project-setup") {
              setHasPassedReviewProtocol(true);
              setSelectedStep("business-justification");
            } else if (selectedStep === "business-justification") {
              setHasPassedReviewJustification(true);
              setSelectedStep("activate-project");
            }
          }}
        />
      )}

      {/* ── Bottom Area: Stage Workspace ──────────────────────────────────── */}
      {renderWorkspace()}

      {/* ── Drawers & Modals ─────────────────────────────────────────────── */}
      <ProjectDrawers
        isNeedModalOpen={isNeedModalOpen}
        onCloseNeed={() => setIsNeedModalOpen(false)}
        isDocModalOpen={isDocModalOpen}
        onCloseDoc={() => setIsDocModalOpen(false)}
        isObjModalOpen={isObjModalOpen}
        onCloseObj={() => setIsObjModalOpen(false)}
        isQuestionModalOpen={isQuestionModalOpen}
        onCloseQuestion={() => setIsQuestionModalOpen(false)}
        isPICOCModalOpen={isPICOCModalOpen}
        onClosePICOC={() => setIsPICOCModalOpen(false)}
        isSubmitting={isNeedSubmitting || isDocSubmitting}
        questionTypes={[]}
        onAddNeed={handleAddNeedSubmit}
        onAddDocument={handleAddDocumentSubmit}
        onAddObjective={handleAddObjectiveSubmit}
        onAddQuestion={handleAddQuestionSubmit}
        onAddPICOC={handleAddPICOCSubmit}
      />

      <ProjectMembersModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        projectId={id}
        projectName={project.title}
      />

      <ProjectFormModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        projectId={id}
        onSuccess={async () => {
          setIsEditProjectModalOpen(false);
          await refetchProject();
        }}
      />
    </div>
  );
}
