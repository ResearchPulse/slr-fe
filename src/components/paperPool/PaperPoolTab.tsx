import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { FiChevronRight, FiAlertCircle, FiArrowDown } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toastSuccess, toastError } from "../../utils/toast";

import type { ReviewProcess } from "../../types/reviewProcess";
import type { CreateReviewProcessRequest } from "../../types/reviewProcess";
import { useDebounce } from "../../hooks/useDebounce";

import {
  useAddPapersFromFilterSetting,
  useAddSelectedPapers,
  useReviewProcessSnapshots,
  useReviewProcessMutations,
} from "../../hooks/useReviewProcesses";
import {
  usePaperPool,
  usePaperPoolFilterSettingDetail,
  usePaperPoolFilterSettings,
  usePaperPoolMetadata,
  useSavedFilterPreviewCount,
} from "../../hooks/usePaperPool";
import { useSearchSources } from "../../hooks/useSearchSources";
import { usePaperActions } from "../../hooks/usePaperActions";
import { useProjectMember } from "../../hooks/useProjectMember";
import { useDispatch } from "react-redux";
import { setPaperPoolStep } from "../../redux/slices/projectSlice";

import PaperRepositoryPage from "./PaperRepositoryPage";
import DeduplicationPage from "./DeduplicationPage";
import SearchSourcePage from "./SearchSourcePage";
import SnowballingCandidatesPage from "./snowballing/SnowballingCandidatesPage";
import PaperStatisticsDashboard from "./statistics/PaperStatisticsDashboard";
import HeroNav from "./HeroNav";
import CreateProcessModal from "../reviewProcess/CreateProcessModal";
import PoolWorkflowStepper from "./PoolWorkflowStepper";
import SetupSummaryView from "../../pages/projects/aiSetupWizard/components/SetupSummaryView";
import { useAIProjectSetupState } from "../../pages/projects/aiSetupWizard/hooks/useAIProjectSetupState";
import { DEFAULT_FILTERS, DEFAULT_PAGE_SIZE } from "./constants";
import type {
  FilterSettingRequest,
  PaperPoolApiResponse,
  PaperPoolFilters,
  PaperPoolFilterSetting,
  PaperPoolItem,
  PaperPoolQueryParams,
  ProcessSnapshot,
  SelectionInsertResult,
} from "./types";

interface PaperPoolTabProps {
  projectId: string;
  reviewProcesses: ReviewProcess[];
}

function parseKeywords(keywords?: string) {
  if (!keywords) return [];
  return keywords
    .split(/[;,|]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function mapPaperFromApi(paper: PaperPoolApiResponse): PaperPoolItem {
  const parsedYear =
    paper.publicationYearInt ??
    (paper.publicationYear ? Number.parseInt(paper.publicationYear, 10) : null);

  return {
    id: paper.id,
    title: paper.title,
    authors: paper.authors?.trim() || "Unknown authors",
    year: Number.isNaN(parsedYear) ? null : parsedYear,
    doi: paper.doi || null,
    source: paper.source?.trim() || "Unknown source",
    searchSourceId: paper.searchSourceId || "all",
    importBatchId: "N/A",
    hasFullText: Boolean(paper.fullTextAvailable),
    abstract: paper.abstract?.trim() || "No abstract available.",
    keywords: parseKeywords(paper.keywords),
    pdfUrl: paper.pdfUrl || null,
    fullTextRetrievalStatus: paper.fullTextRetrievalStatus ?? null,
    fullTextRetrievalStatusText: paper.fullTextRetrievalStatusText || null,
  };
}

function mapFiltersForRequest(
  filters: PaperPoolFilters,
): FilterSettingRequest["filters"] {
  return {
    keyword: filters.keyword || undefined,
    yearFrom: filters.yearFrom ?? undefined,
    yearTo: filters.yearTo ?? undefined,
    searchSourceId: filters.searchSourceId,
    importBatchId: filters.importBatchId,
    doiState: filters.doiState,
    fullTextState: filters.fullTextState,
    onlyUnused: filters.onlyUnused,
    recentlyImported: filters.recentlyImported,
  };
}

function buildPaperQuery(
  searchText: string,
  filters: PaperPoolFilters,
  pageNumber: number,
  pageSize: number,
): PaperPoolQueryParams {
  return {
    searchText: searchText || undefined,
    keyword: filters.keyword || undefined,
    yearFrom: filters.yearFrom ?? undefined,
    yearTo: filters.yearTo ?? undefined,
    searchSourceId: filters.searchSourceId,
    importBatchId: filters.importBatchId,
    doiState: filters.doiState,
    fullTextState: filters.fullTextState,
    onlyUnused: filters.onlyUnused,
    recentlyImported: filters.recentlyImported,
    pageNumber,
    pageSize,
  };
}

function mapReviewProcessesToSnapshots(
  reviewProcesses: ReviewProcess[],
): ProcessSnapshot[] {
  return reviewProcesses.map((process) => {
    const progressPercent =
      process.statusText === "Completed"
        ? 100
        : process.statusText === "InProgress"
          ? Math.max(
              15,
              Math.min(
                95,
                Math.round((((process.currentPhase ?? 0) + 1) / 7) * 100),
              ),
            )
          : 0;

    return {
      processId: process.id || process.processId || "",
      processName:
        process.name?.trim() ||
        process.processName?.trim() ||
        "Untitled review process",
      statusText: process.statusText,
      progressPercent,
      existingPaperIds: [],
      totalPapers: process.totalPapersImported ?? 0,
      totalIncludedPapers: process.totalIncludedPapers ?? 0,
      totalExcludedPapers: process.totalExcludedPapers ?? 0,
    };
  });
}

export default function PaperPoolTab({
  projectId,
  reviewProcesses,
}: PaperPoolTabProps) {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab =
    (searchParams.get("subtab") as
      | "library"
      | "deduplication"
      | "sources"
      | "snowballing"
      | "statistics") || "library";
  const setActiveTab = (
    tab: "library" | "deduplication" | "sources" | "snowballing" | "statistics",
  ) => {
    setSearchParams(
      (prev) => {
        prev.set("subtab", tab);
        return prev;
      },
      { replace: true },
    );
  };
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [viewerPaper, setViewerPaper] = useState<PaperPoolItem | null>(null);
  const [insertResult, setInsertResult] =
    useState<SelectionInsertResult | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSavedFilterId, setSelectedSavedFilterId] = useState<
    string | null
  >(null);
  const [detailFilterId, setDetailFilterId] = useState<string | null>(null);
  const [processSnapshots, setProcessSnapshots] = useState<ProcessSnapshot[]>(
    [],
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManageFiltersOpen, setIsManageFiltersOpen] = useState(false);
  const [isNameFilterModalOpen, setIsNameFilterModalOpen] = useState(false);
  const [isAddToProcessBySelectionOpen, setIsAddToProcessBySelectionOpen] =
    useState(false);
  const [isAddToProcessByFilterOpen, setIsAddToProcessByFilterOpen] =
    useState(false);
  const [isFilterPanelCollapsed, setIsFilterPanelCollapsed] = useState(false);
  const [isCreateProcessModalOpen, setIsCreateProcessModalOpen] =
    useState(false);
  const { stepId } = useParams();
  const workflowStep = Number.parseInt(stepId || "1", 10);
  const dispatch = useDispatch();

  const { member } = useProjectMember(projectId);
  const isLeader = member?.isLeader ?? false;
  const canUploadPdf = isLeader || member?.role === 2;

  // Reviewers are restricted from setup steps (1-4) and automatically land on step 5 (Select & Assign)
  useEffect(() => {
    if (member && !isLeader && workflowStep !== 5) {
      navigate(`/projects/${projectId}/workspace/5`, { replace: true });
    }
  }, [member, isLeader, workflowStep, navigate, projectId]);

  const setWorkflowStep = useCallback(
    (step: number) => {
      if (!isLeader) return;
      navigate(`/projects/${projectId}/workspace/${step}`, { replace: true });
      dispatch(setPaperPoolStep({ projectId, step }));
    },
    [navigate, projectId, dispatch, isLeader],
  );
  const setupState = useAIProjectSetupState(projectId);

  const { searchSources: definedSources } = useSearchSources(projectId);
  const hasSearchSources = (definedSources?.length ?? 0) > 0;

  const debouncedSearch = useDebounce(searchText.trim(), 250);
  const isYearRangeValid =
    filters.yearFrom === null ||
    filters.yearTo === null ||
    filters.yearFrom <= filters.yearTo;
  // --- Hooks ---
  const activePaperQuery = useMemo(
    () => buildPaperQuery(debouncedSearch, filters, pageNumber, pageSize),
    [debouncedSearch, filters, pageNumber, pageSize],
  );

  const {
    papersPage,
    isLoading: isLoadingPapers,
    isFetching: isFetchingPapers,
  } = usePaperPool(projectId, activePaperQuery, { enabled: isYearRangeValid });
  const isStepCompleted = useCallback(
    (stepId: number) => {
      switch (stepId) {
        case 1:
          // In an active project review workspace, protocol definition is already completed
          return true;
        case 2:
          return hasSearchSources;
        case 3:
          return (papersPage?.totalCount ?? 0) > 0;
        case 4:
          return (reviewProcesses?.length ?? 0) > 0;
        case 5:
          return (
            (reviewProcesses?.length ?? 0) > 0 &&
            reviewProcesses.some((rp: any) => (rp.totalPapersImported ?? 0) > 0)
          );
        default:
          return false;
      }
    },
    [
      hasSearchSources,
      papersPage?.totalCount,
      reviewProcesses,
    ],
  );

  const initialCheckPerformed = useRef(false);

  useEffect(() => {
    // Wait until background queries finish loading before evaluating step resolution
    if (isLoadingPapers || setupState.isLoadingSetup) return;

    // Only determine initial starting step once on mount when user arrives at step 1
    if (initialCheckPerformed.current) return;

    if (workflowStep === 1) {
      // Find the first incomplete step sequentially so earlier steps are never skipped
      if (!isStepCompleted(1)) {
        // Step 1 not complete: stay on step 1
      } else if (!isStepCompleted(2)) {
        setWorkflowStep(2);
      } else if (!isStepCompleted(3)) {
        setWorkflowStep(3);
      } else if (!isStepCompleted(4)) {
        setWorkflowStep(4);
      } else {
        setWorkflowStep(5);
      }
    }
    initialCheckPerformed.current = true;
  }, [
    workflowStep,
    isStepCompleted,
    setWorkflowStep,
    isLoadingPapers,
    setupState.isLoadingSetup,
  ]);

  const workflowActions = useMemo(() => {
    switch (workflowStep) {
      case 1:
        return [
          {
            label: "Next: Search Strategy",
            primary: true,
            onClick: () => setWorkflowStep(2),
            icon: FiChevronRight,
          },
        ];
      case 2:
        return [
          {
            label: "Next: Paper Repository",
            primary: true,
            onClick: () => {
              if (!hasSearchSources) {
                toastError(
                  "Please add at least one search source before continuing",
                );
                return;
              }
              setWorkflowStep(3);
              // setActiveTab("library");
            },
            icon: FiChevronRight,
          },
        ];
      case 3:
        return [
          ...(isLeader
            ? [
                {
                  label: "Open Import Modal",
                  primary: (papersPage?.totalCount ?? 0) === 0,
                  onClick: () => {
                    // setActiveTab("library");
                    setIsImportModalOpen(true);
                  },
                },
              ]
            : []),
          ...((papersPage?.totalCount ?? 0) > 0
            ? [
                {
                  label: "Next: Review Processes",
                  primary: true,
                  onClick: () => setWorkflowStep(4),
                  icon: FiChevronRight,
                },
              ]
            : []),
        ];
      case 4:
        return [
          {
            label: "Scroll to Review Processes",
            primary: (reviewProcesses?.length ?? 0) === 0,
            onClick: () => {
              setActiveTab("library");
              setTimeout(() => {
                const el = document.getElementById("review-process-panel");
                el?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            },
          },
          ...((reviewProcesses?.length ?? 0) > 0
            ? [
                {
                  label: "Continue to Assignment",
                  primary: true,
                  onClick: () => setWorkflowStep(5),
                  icon: FiChevronRight,
                },
              ]
            : []),
        ];
      case 5:
        if (!isLeader) {
          return [
            {
              label: "View Review Processes",
              primary: true,
              icon: FiArrowDown,
              onClick: () => {
                setActiveTab("library");
                setTimeout(() => {
                  const el = document.getElementById("review-process-panel");
                  el?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              },
            },
          ];
        }
        return [
          {
            label: "Start Assigning Papers",
            primary: true,
            onClick: () => {
              setActiveTab("library");
              toastSuccess(
                "Select papers in the table and use the action bar or process panel",
              );
            },
          },
        ];
      default:
        return [];
    }
  }, [workflowStep, setActiveTab, isLeader, reviewProcesses?.length]);

  const {
    uploadPaperPdf,
    isUploadingPdf,
    applyMetadataSuggestion,
    isApplyingMetadataSuggestion,
    deletePaper,
    paperIdBeingDeleted,
    removePaperPdf,
    isRemovingPdf,
  } = usePaperActions();

  const { metadata } = usePaperPoolMetadata(projectId);

  const {
    savedFilters,
    createFilterSetting,
    deleteFilterSetting,
    isCreating: isCreatingFilter,
    isDeleting: isDeletingFilter,
  } = usePaperPoolFilterSettings(projectId);

  const { filterDetail: detailFilter, isLoading: isLoadingDetailFilter } =
    usePaperPoolFilterSettingDetail(projectId, detailFilterId);

  const { snapshots: reviewProcessSnapshotsFromApi } =
    useReviewProcessSnapshots(projectId);
  const { addSelectedPapers } = useAddSelectedPapers();
  const { addPapersFromFilterSetting } = useAddPapersFromFilterSetting();
  const { createReviewProcess, isCreating: isCreatingProcess } =
    useReviewProcessMutations();

  const selectedSavedFilter = useMemo(
    () =>
      savedFilters.find((setting) => setting.id === selectedSavedFilterId) ??
      null,
    [savedFilters, selectedSavedFilterId],
  );

  const selectedSavedFilterQuery = useMemo(
    () =>
      selectedSavedFilter
        ? buildPaperQuery(
            selectedSavedFilter.searchText || "",
            selectedSavedFilter.filters,
            1,
            1,
          )
        : null,
    [selectedSavedFilter],
  );

  const { totalCount: selectedSavedFilterMatchedCount } =
    useSavedFilterPreviewCount(
      projectId,
      selectedSavedFilterId,
      selectedSavedFilterQuery,
    );

  // --- Mapped Data ---
  const papers = useMemo(
    () => (papersPage?.items ?? []).map(mapPaperFromApi),
    [papersPage?.items],
  );
  const totalCount = papersPage?.totalCount ?? 0;
  const totalPages = papersPage?.totalPages ?? 1;

  // --- Effects ---
  useEffect(() => {
    if (reviewProcessSnapshotsFromApi.length > 0) {
      setProcessSnapshots(
        reviewProcessSnapshotsFromApi.map(
          (snapshot): ProcessSnapshot => ({
            processId: snapshot.processId || snapshot.id || "",
            processName:
              snapshot.processName || snapshot.name || "Untitled process",
            statusText: snapshot.statusText as ProcessSnapshot["statusText"],
            progressPercent: snapshot.progressPercent ?? 0,
            existingPaperIds: [],
            totalPapers: snapshot.totalPapersImported ?? 0,
            totalIncludedPapers: snapshot.totalIncludedPapers ?? 0,
            totalExcludedPapers: snapshot.totalExcludedPapers ?? 0,
          }),
        ),
      );
    } else if (reviewProcesses.length > 0) {
      setProcessSnapshots(mapReviewProcessesToSnapshots(reviewProcesses));
    }
  }, [reviewProcessSnapshotsFromApi, reviewProcesses]);

  useEffect(() => {
    if (!papersPage) return;
    if (papersPage.pageNumber !== pageNumber)
      setPageNumber(papersPage.pageNumber);
    if (papersPage.pageSize !== pageSize) setPageSize(papersPage.pageSize);
  }, [pageNumber, pageSize, papersPage]);

  // --- Handlers ---
  const handleNavigateToProcess = (processId: string) => {
    navigate(`/projects/${projectId}/processes/${processId}`);
  };

  const persistFilterSetting = async (filterName: string) => {
    const payload: FilterSettingRequest = {
      name: filterName,
      searchText: searchText.trim() || undefined,
      filters: mapFiltersForRequest(filters),
    };
    const created = await createFilterSetting(payload);
    setSelectedSavedFilterId(created.id);
    toastSuccess("Saved filter created");
    return created;
  };

  const handleSaveCurrentAsFilter = async (name: string) => {
    await persistFilterSetting(name);
  };

  const handleSaveDetailAsNew = async (draft: PaperPoolFilterSetting) => {
    const payload: FilterSettingRequest = {
      name: draft.name,
      searchText: (draft.searchText ?? "").trim() || undefined,
      filters: mapFiltersForRequest(draft.filters),
    };
    const created = await createFilterSetting(payload);
    setSelectedSavedFilterId(created.id);
    toastSuccess("Saved filter created");
    setIsManageFiltersOpen(false);
  };

  const handleApplySavedFilter = (setting: PaperPoolFilterSetting) => {
    setSelectedSavedFilterId(setting.id);
    setSearchText(setting.searchText || "");
    setFilters({
      ...DEFAULT_FILTERS,
      ...setting.filters,
      keyword: setting.filters.keyword || "",
      yearFrom: setting.filters.yearFrom ?? null,
      yearTo: setting.filters.yearTo ?? null,
    });
    setPageNumber(1);
  };

  // ManageFiltersModal already asks for an inline confirmation before calling this.
  const handleDeleteSavedFilter = async (settingId: string) => {
    await deleteFilterSetting(settingId);
    setSelectedSavedFilterId((prev) => (prev === settingId ? null : prev));
    toastSuccess("Saved filter deleted");
  };

  const handleAddSelectedToProcess = async (processId: string) => {
    if (selectedPaperIds.length === 0) return;
    setIsAdding(true);
    setInsertResult(null);
    try {
      const result = await addSelectedPapers({
        reviewProcessId: processId,
        data: { paperIds: selectedPaperIds },
      });
      setInsertResult({
        inserted: result.inserted,
        skippedAsDuplicate: result.skippedAsDuplicate,
      });
      setSelectedPaperIds([]);
      // Update local progress snapshot if possible
      if (result.reviewProcessSnapshot) {
        setProcessSnapshots((prev) =>
          prev.map((p) =>
            p.processId === processId
              ? {
                  ...p,
                  progressPercent: result.reviewProcessSnapshot.progressPercent,
                }
              : p,
          ),
        );
      }
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : "Failed to add papers",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddFromFilterToProcess = async (
    processId: string,
    filterId: string,
  ) => {
    setIsAdding(true);
    setInsertResult(null);
    try {
      const result = await addPapersFromFilterSetting({
        processId,
        data: { filterSettingId: filterId },
      });
      setInsertResult({
        inserted: result.inserted,
        skippedAsDuplicate: result.skippedAsDuplicate,
      });
      if (result.processSnapshot) {
        setProcessSnapshots((prev) =>
          prev.map((p) =>
            p.processId === processId
              ? {
                  ...p,
                  progressPercent: result.processSnapshot.progressPercent,
                }
              : p,
          ),
        );
      }
    } catch (error) {
      toastError(
        error instanceof Error
          ? error.message
          : "Failed to add papers from filter",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleCreateProcess = async (data: CreateReviewProcessRequest) => {
    try {
      await createReviewProcess({ projectId, data });
      setIsCreateProcessModalOpen(false);
      toastSuccess("Review process created successfully");
    } catch {
      // Error handled in hook
    }
  };

  // Redundant import handler removed as it's now handled by PaperImportModal internally

  return (
    <div className="flex flex-col gap-5 pb-12">
      <PoolWorkflowStepper
        currentStep={workflowStep}
        onStepClick={setWorkflowStep}
        actions={workflowActions}
        isCompleted={isStepCompleted}
        isLeader={isLeader}
      />

      {workflowStep === 1 && (
        <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-surface-white rounded-xl border border-border p-10 shadow-none shadow-slate-200/50">
            <div className="mb-8 pb-8 border-b border-border">
              <h2 className="text-2xl font-black text-text-primary mb-2 uppercase tracking-tight">
                Research <span className="text-accent">Context</span> Summary
              </h2>
              <p className="text-text-secondary font-medium">
                Review your Research Questions and PICO-C definitions.
              </p>
            </div>
            <SetupSummaryView
              topic={setupState.topic}
              scopeForm={setupState.scopeForm}
              picocForm={setupState.picocForm}
              researchQuestions={setupState.editResearchQuestions}
              onEdit={setupState.handleEnterEditMode}
              isLeader={isLeader}
            />
          </div>
        </div>
      )}

      {workflowStep === 2 && (
        <div className="  w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-surface-white rounded-xl border border-border p-10 shadow-none shadow-slate-200/50">
            <div className="mb-8 pb-8 border-b border-border">
              <h2 className="text-2xl font-black text-text-primary mb-2 uppercase tracking-tight">
                Search <span className="text-accent">Strategy</span> Planning
              </h2>
              <p className="text-text-secondary font-medium">
                Define the academic databases and sources for your search.
              </p>
            </div>
            <SearchSourcePage projectId={projectId} hideHeader={true} />
          </div>

          {!hasSearchSources && (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4 text-amber-800">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <FiAlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Search sources required</p>
                <p className="text-sm opacity-80 font-medium">
                  You must add at least one search source to proceed to the
                  paper repository.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {workflowStep >= 3 && (
        <>
          <HeroNav
            activeTab={activeTab}
            onChange={setActiveTab}
            isLeader={isLeader}
          />

          {activeTab === "library" ? (
            <>
              <PaperRepositoryPage
                projectId={projectId}
                papers={papers}
                totalCount={totalCount}
                totalPages={totalPages}
                isLoadingPapers={isLoadingPapers}
                isFetchingPapers={isFetchingPapers}
                searchText={searchText}
                setSearchText={(val) => {
                  setSearchText(val);
                  setPageNumber(1);
                }}
                filters={filters}
                setFilters={(f) => {
                  setFilters(f);
                  setPageNumber(1);
                }}
                onResetFilters={() => {
                  setFilters(DEFAULT_FILTERS);
                  setPageNumber(1);
                }}
                isFilterPanelCollapsed={isFilterPanelCollapsed}
                setIsFilterPanelCollapsed={setIsFilterPanelCollapsed}
                selectedPaperIds={selectedPaperIds}
                setSelectedPaperIds={setSelectedPaperIds}
                savedFilters={savedFilters}
                selectedSavedFilterId={selectedSavedFilterId}
                onApplySavedFilter={handleApplySavedFilter}
                onSelectSavedFilter={setSelectedSavedFilterId}
                onDeleteSavedFilter={handleDeleteSavedFilter}
                onSaveCurrentAsFilter={handleSaveCurrentAsFilter}
                onSaveDetailAsNew={handleSaveDetailAsNew}
                processSnapshots={processSnapshots}
                onAddSelectedToProcess={handleAddSelectedToProcess}
                onAddFromFilterToProcess={handleAddFromFilterToProcess}
                isAdding={isAdding}
                insertResult={insertResult}
                setInsertResult={setInsertResult}
                selectedSavedFilterMatchedCount={
                  selectedSavedFilterMatchedCount
                }
                viewerPaper={viewerPaper}
                setViewerPaper={setViewerPaper}
                isManageFiltersOpen={isManageFiltersOpen}
                setIsManageFiltersOpen={setIsManageFiltersOpen}
                isNameFilterModalOpen={isNameFilterModalOpen}
                setIsNameFilterModalOpen={setIsNameFilterModalOpen}
                isAddToProcessBySelectionOpen={isAddToProcessBySelectionOpen}
                setIsAddToProcessBySelectionOpen={
                  setIsAddToProcessBySelectionOpen
                }
                isAddToProcessByFilterOpen={isAddToProcessByFilterOpen}
                setIsAddToProcessByFilterOpen={setIsAddToProcessByFilterOpen}
                isImportModalOpen={isImportModalOpen}
                setIsImportModalOpen={setIsImportModalOpen}
                pageNumber={pageNumber}
                setPageNumber={setPageNumber}
                pageSize={pageSize}
                setPageSize={setPageSize}
                detailFilter={detailFilter}
                isLoadingDetailFilter={isLoadingDetailFilter}
                onViewFilterDetail={setDetailFilterId}
                isCreatingFilter={isCreatingFilter}
                isDeletingFilter={isDeletingFilter}
                metadata={metadata ?? null}
                onGoToDeduplication={() => setActiveTab("deduplication")}
                onNavigateToProcess={handleNavigateToProcess}
                pendingDuplicatesCount={0}
                onConfirmSaveFilter={handleSaveCurrentAsFilter}
                onOpenSaveModal={() => setIsNameFilterModalOpen(true)}
                // PDF Actions
                onUploadPdf={uploadPaperPdf}
                isUploadingPdf={isUploadingPdf}
                onApplyMetadataSuggestion={applyMetadataSuggestion}
                isApplyingMetadataSuggestion={isApplyingMetadataSuggestion}
                onRemovePdf={removePaperPdf}
                isRemovingPdf={isRemovingPdf}
                onDeletePaper={deletePaper}
                isDeletingPaper={paperIdBeingDeleted}
                onOpenCreateProcessModal={() =>
                  setIsCreateProcessModalOpen(true)
                }
                isLeader={isLeader}
                canUploadPdf={canUploadPdf}
              />

              <CreateProcessModal
                isOpen={isCreateProcessModalOpen}
                onClose={() => setIsCreateProcessModalOpen(false)}
                onSubmit={handleCreateProcess}
                isLoading={isCreatingProcess}
              />

            </>
          ) : activeTab === "snowballing" ? (
            <SnowballingCandidatesPage projectId={projectId} />
          ) : activeTab === "deduplication" ? (
            <DeduplicationPage projectId={projectId} />
          ) : activeTab === "statistics" ? (
            <PaperStatisticsDashboard
              projectId={projectId}
              availableSources={
                metadata?.searchSources?.map((s) => s.name) ?? []
              }
            />
          ) : (
            <SearchSourcePage projectId={projectId} />
          )}
        </>
      )}
    </div>
  );
}
