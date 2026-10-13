import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { UseDataExtractionWorkspaceReturn } from "../types";
import DataExtractionDashboard from "../components/DataExtractionDashboard";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

vi.mock("../../../../components/projects/protocol/wizard/TemplateWizard", () => ({
  default: () => null,
}));
vi.mock("../../../../components/reviewProcess/leader/PaperViewerModal", () => ({
  default: () => null,
}));
vi.mock("../../../../components/reviewProcess/leader/BulkAssignmentPanelDataExtraction", () => ({
  default: () => null,
}));
vi.mock("../components/AssignReviewersModal", () => ({
  default: () => null,
}));
vi.mock("../components/WorkloadSummaryCard", () => ({
  default: () => null,
}));

function buildReviewerWorkspace(): UseDataExtractionWorkspaceReturn {
  const task = {
    paperId: "paper-1",
    title: "Submitted paper",
    citation: { title: "Submitted paper", authors: [] },
    status: "IN_PROGRESS",
    ownStatus: "SUBMITTED",
  };
  const study = {
    paperId: "paper-1",
    title: "Submitted paper",
    authors: null,
    publicationYear: 2026,
    pdfUrl: null,
    source: null,
    raw: {} as never,
  };

  return {
    projectId: "project-1",
    currentUserId: "reviewer-1",
    isCurrentUserLeader: false,
    extractionProcessStatus: "InProgress",
    extractionProcessStartedAt: null,
    extractionProcessLastUpdatedAt: null,
    isLoading: false,
    error: null,
    isMockMode: false,
    activeTab: "dashboard",
    setActiveTab: vi.fn(),
    extractionMode: "double",
    setExtractionMode: vi.fn(),
    activeReviewerId: "reviewer-1",
    setActiveReviewerId: vi.fn(),
    reviewerOptions: [],
    templates: [],
    selectedTemplateId: "",
    setSelectedTemplateId: vi.fn(),
    selectedTemplate: null,
    refreshTemplates: vi.fn(),
    studies: [study],
    selectedPaperId: "paper-1",
    setSelectedPaperId: vi.fn(),
    selectedStudy: study,
    selectedRecord: null,
    allFields: [],
    answerFields: [],
    summary: { totalIncluded: 1, inProgress: 1, awaitingConsensus: 0, completed: 0, notStarted: 0 },
    dashboardTasks: [task],
    dashboardTotalCount: 1,
    dashboardTotalPages: 1,
    isDashboardLoading: false,
    workloadSummary: null,
    isWorkloadLoading: false,
    searchQuery: "",
    setSearchQuery: vi.fn(),
    statusFilter: "all",
    setStatusFilter: vi.fn(),
    pageNumber: 1,
    setPageNumber: vi.fn(),
    pageSize: 10,
    setPageSize: vi.fn(),
    getPaperStatus: () => "in-progress",
    getRecord: () => null,
    canCurrentUserExtractPaper: () => true,
    assignPaper: vi.fn(),
    isAssigningReviewers: false,
    startPhase: vi.fn(),
    isStarting: false,
    completePhase: vi.fn(),
    isCompleting: false,
    reopenExtraction: vi.fn(),
    isReopeningExtraction: false,
    hasCurrentUserSubmitted: () => true,
    setDraftValue: vi.fn(),
    saveDraft: vi.fn(),
    submitExtraction: vi.fn(),
    isSubmittingExtraction: false,
    autoExtractWithAI: vi.fn(),
    isAutoExtracting: false,
    activeHighlights: [],
    setActiveHighlights: vi.fn(),
    handleAskAiForField: vi.fn(),
    isAskingAi: false,
    consensusWorkspace: null,
    isConsensusLoading: false,
    fetchConsensusWorkspace: vi.fn(),
    fetchPaperVersion: vi.fn(),
    checkConsensus: vi.fn(),
    isCheckingConsensus: false,
    saveConsensusDraft: vi.fn(),
    isSavingConsensusDraft: false,
    finalizeConsensus: vi.fn(),
    isFinalizingConsensus: false,
    submitConsensus: vi.fn(),
    isSubmittingConsensus: false,
    reviewerWorkspace: null,
    isReviewerWorkspaceLoading: false,
    fetchReviewerWorkspace: vi.fn(),
    fetchFieldComments: vi.fn(),
    addFieldComment: vi.fn(),
    isAddingFieldComment: false,
    editableGrid: null,
    isGridLoading: false,
    getEditableGrid: vi.fn(),
    updateGridCell: vi.fn(),
    completedStudies: [],
    awaitingConsensus: [],
    handleBack: vi.fn(),
  } as unknown as UseDataExtractionWorkspaceReturn;
}

describe("data extraction dashboard reviewer actions", () => {
  it("shows one assignment badge and opens submitted extraction from its title", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <DataExtractionDashboard
          ws={buildReviewerWorkspace()}
          dashboardPath="/projects/project-1/extraction"
        />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText("Assigned to you")).toHaveLength(1);
    expect(screen.getByText("Submitted (Locked)")).toBeTruthy();
    const submittedTitle = screen.getByRole("button", {
      name: "Review submitted extraction: Submitted paper",
    });

    fireEvent.click(submittedTitle);

    expect(navigate).toHaveBeenCalledWith(
      "/projects/project-1/extraction/workspace/paper-1",
    );
  });
});
