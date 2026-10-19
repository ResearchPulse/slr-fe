import React, { useState, useCallback, useRef } from "react";
import { toastSuccess, toastError } from "../../utils/toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PaperList } from "./components/PaperList";
import { SelectionActionPanel } from "./components/SelectionActionPanel";
import {
  StuSePhaseHeaderController,
  type SelectionPhase,
} from "./components/StuSePhaseHeaderController";
import {
  useConflictStatus,
  usePaperDetails,
  useResolveConflict,
  useStudySelectionDetails,
} from "../../hooks/useStudySelection";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import type { RootState } from "../../redux/store";
import PaperViewer from "../../components/shared/paper/PaperViewer";
import { PaperPhase } from "../../types/studySelection";
import Button from "../../components/ui/Button";
import Drawer from "../../components/ui/Drawer";
import { Users, X, AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn";
import BulkAssignmentPanel from "../../components/reviewProcess/leader/BulkAssignmentPanel";
import StudySelectionCriteriaModal from "../../components/reviewProcess/leader/StudySelectionCriteriaModal";
import { useStudySelection } from "../reviewProcess/studySelection/titleAbstractScreening/hooks/useStudySelection";
import { SelectionProcessStatus } from "../../types/studySelection";
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiList } from "react-icons/fi";
import { getAdjacentPaperId, getPaperQueueNeighbors } from "../reviewProcess/studySelection/navigatePaperQueue";
import { useProject } from "../../hooks/useProjects";

export default function ManageStudySelectionPage() {
  const { projectId, processId, screeningProcessId, paperId } = useParams<{
    projectId: string;
    processId: string;
    screeningProcessId: string;
    paperId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPhase, setCurrentPhase] =
    useState<SelectionPhase>("TITLE_ABSTRACT");
  const [isAssignmentMode, setIsAssignmentMode] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(paperId ?? null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leftWidth, setLeftWidth] = useState(320); // px
  const [rightWidth, setRightWidth] = useState(300); // px
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [mobileActionOpen, setMobileActionOpen] = useState(false);
  const currentPhaseNumeric =
    currentPhase === "TITLE_ABSTRACT"
      ? PaperPhase.TitleAbstract
      : PaperPhase.FullText;
  const queryClient = useQueryClient();

  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch process details to check status
  const { data: processDetails } = useStudySelectionDetails(screeningProcessId);
  const isCompleted =
    processDetails?.status === SelectionProcessStatus.Completed;

  // Fetch full paper details when a paper is selected
  const { paper: selectedPaper } = usePaperDetails(
    screeningProcessId,
    selectedPaperId || undefined,
  );

  // AI Analysis Hook
  const selectionWorkspace = useStudySelection(
    currentPhaseNumeric,
    selectedPaperId,
  );
  const { aiAnalysis, isAnalyzing, runAiAnalysis } = selectionWorkspace;
  const { project } = useProject(projectId);
  const [contextOpen, setContextOpen] = useState(() => {
    try { return localStorage.getItem("study-selection:context-open") !== "false"; } catch { return true; }
  });
  const [mobileContextOpen, setMobileContextOpen] = useState(false);
  const [directNeighbors, setDirectNeighbors] = useState<{ paperId: string; previous: boolean; next: boolean } | null>(null);
  React.useEffect(() => setSelectedPaperId(paperId ?? null), [paperId]);

  // Fetch conflict status to check for conflicts on the selected paper
  const { data: conflictStatusList } = useConflictStatus(
    screeningProcessId,
    currentPhaseNumeric,
    {
      enabled: !!screeningProcessId,
    },
  );

  const paperHasConflict = React.useMemo(() => {
    if (!selectedPaperId || !conflictStatusList) return false;
    return (
      conflictStatusList.find((c) => c.paperId === selectedPaperId)
        ?.hasConflict || false
    );
  }, [selectedPaperId, conflictStatusList]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    if (isResizingLeft.current) {
      const newWidth = e.clientX - containerRect.left;
      if (newWidth > 250 && newWidth < containerRect.width * 0.4) {
        setLeftWidth(newWidth);
      }
    } else if (isResizingRight.current) {
      const newWidth = containerRect.right - e.clientX;
      if (newWidth > 200 && newWidth < containerRect.width * 0.4) {
        setRightWidth(newWidth);
      }
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizingLeft.current = false;
    isResizingRight.current = false;
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, [handleMouseMove]);

  const startResizingLeft = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizingLeft.current = true;
      setIsResizing(true);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
    },
    [handleMouseMove, stopResizing],
  );

  const startResizingRight = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizingRight.current = true;
      setIsResizing(true);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
    },
    [handleMouseMove, stopResizing],
  );

  // ---- Resolution Logic ----
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { mutate: resolveConflict, isPending: isResolving } =
    useResolveConflict();

  const handleInclude = useCallback(
    (paperId: string) => {
      if (!screeningProcessId || !currentUser?.id) return;

      resolveConflict(
        {
          processId: screeningProcessId,
          paperId,
          request: {
            finalDecision: 0, // Include
            phase: currentPhaseNumeric,
            resolvedBy: currentUser.id,
            resolutionNotes: "Leader resolution",
          },
        },
        {
          onSuccess: () => {
            toastSuccess("Included", "Paper included successfully");
            queryClient.invalidateQueries({
              queryKey: [
                "study-selection",
                screeningProcessId,
                "conflict-status",
              ],
            });
          },
          onError: (err: any) =>
            toastError("Error", err.message || "Failed to include paper"),
        },
      );
    },
    [screeningProcessId, currentUser, currentPhaseNumeric, resolveConflict],
  );

  const handleExclude = useCallback(
    (
      paperId: string,
      exclusionReasonId: string | null,
      reason: string | null,
    ) => {
      if (!screeningProcessId || !currentUser?.id) return;

      resolveConflict(
        {
          processId: screeningProcessId,
          paperId,
          request: {
            finalDecision: 1, // Exclude
            phase: currentPhaseNumeric,
            resolvedBy: currentUser.id,
            exclusionReasonId,
            resolutionNotes: reason,
          },
        },
        {
          onSuccess: () => {
            toastSuccess("Excluded", "Paper excluded successfully");
            queryClient.invalidateQueries({
              queryKey: [
                "study-selection",
                screeningProcessId,
                "conflict-status",
              ],
            });
          },
          onError: (err: any) =>
            toastError("Error", err.message || "Failed to exclude paper"),
        },
      );
    },
    [screeningProcessId, currentUser, currentPhaseNumeric, resolveConflict],
  );

  const listPath = `/projects/${projectId}/processes/${processId}/screening/${screeningProcessId}`;
  const detailPath = (id: string) => `${listPath}/papers/${id}`;
  const currentPaperIndex = selectionWorkspace.papers.findIndex((paper) => paper.id === paperId);
  React.useEffect(() => {
    if (!paperId || currentPaperIndex >= 0 || selectionWorkspace.isLoading || !screeningProcessId) return;
    let active = true;
    void getPaperQueueNeighbors({
      processId: screeningProcessId,
      phase: currentPhaseNumeric,
      currentId: paperId,
      papers: selectionWorkspace.papers,
      pagination: selectionWorkspace.pagination,
      filters: selectionWorkspace.filters,
    }).then((neighbors) => {
      if (active) setDirectNeighbors({ paperId, previous: !!neighbors.previous, next: !!neighbors.next });
    }).catch(() => {
      if (active) setDirectNeighbors({ paperId, previous: false, next: false });
    });
    return () => { active = false; };
  }, [paperId, currentPaperIndex, selectionWorkspace.isLoading, screeningProcessId, currentPhaseNumeric, selectionWorkspace.papers, selectionWorkspace.pagination, selectionWorkspace.filters]);

  const navigateAdjacent = async (direction: -1 | 1) => {
    if (!paperId || !screeningProcessId) return;
    try {
      const adjacent = await getAdjacentPaperId({
        processId: screeningProcessId,
        phase: currentPhaseNumeric,
        currentId: paperId,
        papers: selectionWorkspace.papers,
        pagination: selectionWorkspace.pagination,
        filters: selectionWorkspace.filters,
        direction,
      });
      if (!adjacent) return;
      selectionWorkspace.goToPage(adjacent.pageNumber);
      navigate(detailPath(adjacent.paperId), { state: location.state });
    } catch {
      // Stay on the current paper if the adjacent result cannot be loaded.
    }
  };

  const toggleContextPanel = () => {
    if (window.matchMedia("(max-width: 1279px)").matches) {
      setMobileContextOpen(true);
      return;
    }
    setContextOpen((open) => {
      const nextOpen = !open;
      try { localStorage.setItem("study-selection:context-open", String(nextOpen)); } catch { /* optional preference */ }
      return nextOpen;
    });
  };

  if (paperId) {
    const backToList = () => navigate((location.state as { listPath?: string } | null)?.listPath || listPath);
    const closeContext = () => {
      setContextOpen(false);
      setMobileContextOpen(false);
      try { localStorage.setItem("study-selection:context-open", "false"); } catch { /* optional preference */ }
    };
    const previousDisabled = currentPaperIndex >= 0
      ? currentPaperIndex === 0 && !selectionWorkspace.pagination.hasPreviousPage
      : !directNeighbors || directNeighbors.paperId !== paperId || !directNeighbors.previous;
    const nextDisabled = currentPaperIndex >= 0
      ? currentPaperIndex === selectionWorkspace.papers.length - 1 && !selectionWorkspace.pagination.hasNextPage
      : !directNeighbors || directNeighbors.paperId !== paperId || !directNeighbors.next;
    return <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-bg-primary">
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-border bg-surface-white px-3 sm:px-5">
        <button type="button" aria-label="Back to papers" onClick={backToList} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:justify-start motion-reduce:transition-none"><FiArrowLeft/><span className="hidden sm:inline">Back to papers</span></button>
        <div className="min-w-0 text-center"><div className="text-xs text-text-secondary">{project?.title || "Study Selection"} · Leader review</div><div className="truncate text-xs font-semibold sm:text-sm">Paper {currentPaperIndex >= 0 ? (selectionWorkspace.filters.pageNumber - 1) * selectionWorkspace.pagination.pageSize + currentPaperIndex + 1 : "—"} of {selectionWorkspace.pagination.totalCount || "—"}</div></div>
        <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => void navigateAdjacent(-1)} disabled={previousDisabled} aria-label="Previous paper" className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"><FiChevronLeft/></button><button type="button" onClick={() => void navigateAdjacent(1)} disabled={nextDisabled} aria-label="Next paper" className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"><FiChevronRight/></button><button type="button" onClick={() => navigate(`${listPath}/assignment-management`)} className="hidden min-h-11 items-center rounded-lg border border-border px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:inline-flex motion-reduce:transition-none">Manage assignments</button><button type="button" onClick={toggleContextPanel} aria-label="Toggle review context" className="ml-1 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"><FiList/></button></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-hidden rounded-xl bg-surface-white">
          <PaperViewer paper={selectedPaper ? { ...selectedPaper, hasConflict: paperHasConflict } : null} isLeaderView onInclude={!isCompleted && (paperHasConflict || selectedPaper?.hasConflict) ? handleInclude : undefined} onExclude={!isCompleted && (paperHasConflict || selectedPaper?.hasConflict) ? handleExclude : undefined} isSubmitting={isResolving} phase={currentPhaseNumeric} isDisabled={isCompleted}/>
        </main>
        {contextOpen && <aside className="hidden w-[340px] shrink-0 border-l border-border bg-surface-white xl:block"><SelectionActionPanel currentPhase={currentPhase} selectedPaper={selectedPaper} aiAnalysis={aiAnalysis} isAnalyzing={isAnalyzing} runAiAnalysis={runAiAnalysis} isCollapsed={false} onToggleCollapse={toggleContextPanel} isDisabled={isCompleted} onEditCriteria={() => setIsCriteriaModalOpen(true)}/></aside>}
        <Drawer
          isOpen={mobileContextOpen}
          onClose={closeContext}
          title="Review context"
          hideHeader
          maxWidth="max-w-[min(92vw,380px)]"
          contentClassName="min-h-0 overflow-hidden p-0"
          className="xl:hidden"
        >
          <SelectionActionPanel
            currentPhase={currentPhase}
            selectedPaper={selectedPaper}
            aiAnalysis={aiAnalysis}
            isAnalyzing={isAnalyzing}
            runAiAnalysis={runAiAnalysis}
            isCollapsed={false}
            onToggleCollapse={closeContext}
            isDisabled={isCompleted}
            onEditCriteria={() => setIsCriteriaModalOpen(true)}
          />
        </Drawer>
      </div>
      <StudySelectionCriteriaModal isOpen={isCriteriaModalOpen} onClose={() => setIsCriteriaModalOpen(false)} studySelectionProcessId={screeningProcessId || ""}/>
    </div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden overscroll-none bg-bg-secondary">
      <StuSePhaseHeaderController
        currentPhase={currentPhase}
        onPhaseChange={(phase) => {
          setCurrentPhase(phase);
          setSelectedPaperId(null);
          setSelectedIds([]);
        }}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex justify-end px-2 pt-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileActionOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface-white px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <FiList aria-hidden="true" />
            Review tools
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative flex min-h-0 flex-1 gap-2 overflow-hidden p-2 select-none"
        >
        {/* Main Content: Paper Viewer - Occupies full space */}
        <div
          className={cn(
            "order-2 z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-white",
            !selectedPaperId && "max-lg:hidden",
            selectedPaperId && "max-lg:absolute max-lg:inset-2 max-lg:z-20",
          )}
        >
          {selectedPaperId && (
            <button
              type="button"
              onClick={() => setSelectedPaperId(null)}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-sm font-medium text-text-secondary hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary lg:hidden"
            >
              <FiArrowLeft aria-hidden="true" />
              Back to review queue
            </button>
          )}
          <div className="min-h-0 flex-1 overflow-hidden">
            <PaperViewer
              paper={
                selectedPaper
                  ? { ...selectedPaper, hasConflict: paperHasConflict }
                  : null
              }
              isLeaderView={true}
              onInclude={
                !isCompleted && (paperHasConflict || selectedPaper?.hasConflict)
                  ? handleInclude
                  : undefined
              }
              onExclude={
                !isCompleted && (paperHasConflict || selectedPaper?.hasConflict)
                  ? handleExclude
                  : undefined
              }
              isSubmitting={isResolving}
              phase={currentPhaseNumeric}
              isDisabled={isCompleted}
            />
          </div>
        </div>

        {/* Left Side: Paper List Overlay */}
        <div
          style={{
            "--left-panel-width": isLeftCollapsed ? "48px" : `${leftWidth}px`,
          } as React.CSSProperties}
          className={cn(
            "order-1 relative flex h-full min-h-0 w-[var(--left-panel-width)] max-w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface-white max-lg:w-full",
            isAssignmentMode && "ring-1 ring-accent/20",
            !isResizing && "transition-[width] duration-300 motion-reduce:transition-none",
          )}
        >
          {/* Resize Handle Left */}
          {!isLeftCollapsed && (
            <div
              onMouseDown={startResizingLeft}
              className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize z-30 group"
            >
              <div className="absolute inset-y-0 left-1/2 w-px bg-border transition-colors group-hover:bg-accent group-active:bg-primary-hover" />
            </div>
          )}
          {!isLeftCollapsed && (
            <div
              className={cn(
                "border-b border-border p-4 transition-colors duration-150",
                isAssignmentMode ? "bg-primary-light/50" : "bg-surface-white",
              )}
            >
              <Button
                onClick={() => {
                  if (isCompleted) return;
                  setIsAssignmentMode(!isAssignmentMode);
                  if (isAssignmentMode) setSelectedIds([]);
                }}
                disabled={isCompleted}
                className={cn(
                  "min-h-11 w-full gap-2 rounded-xl transition-colors duration-150 motion-reduce:transition-none",
                  isAssignmentMode
                    ? "border border-error/20 bg-error/10 text-error hover:bg-error/15"
                    : "bg-primary text-white hover:bg-primary-hover",
                  isCompleted && "opacity-50 cursor-not-allowed",
                )}
                size="sm"
              >
                {isAssignmentMode ? (
                  <>
                    <X className="w-4 h-4" />
                    Exit Assignment
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Assign Reviewers
                  </>
                )}
              </Button>
              {isAssignmentMode && (
                <div className="mt-3 space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-150 motion-reduce:animate-none">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Assignment Mode Active
                  </div>
                  <div className="flex gap-2 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2.5">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                    <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                      Select papers to assign reviewers.{" "}
                      <span className="font-bold text-warning">
                        Resolved papers
                      </span>{" "}
                      cannot be assigned.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <PaperList
              studySelectionProcessId={screeningProcessId || ""}
              currentPhase={currentPhase}
              selectedPaperId={selectedPaperId}
              onSelectPaper={setSelectedPaperId}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              isAssignmentMode={isAssignmentMode}
              isCollapsed={isLeftCollapsed}
              onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
            />
          </div>
        </div>

        {/* Right Side: Action Panel Overlay */}
        <div
          style={{ width: isRightCollapsed ? "48px" : `${rightWidth}px` }}
          className={cn(
            "order-3 relative h-full min-h-0 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-white",
            isRightCollapsed && "w-12",
            "max-lg:hidden",
            !isResizing && "transition-[width] duration-300 motion-reduce:transition-none",
          )}
        >
          {/* Resize Handle Right */}
          {!isRightCollapsed && (
            <div
              onMouseDown={startResizingRight}
              className="absolute -left-1 top-0 bottom-0 w-2 cursor-col-resize z-30 group"
            >
              <div className="absolute inset-y-0 left-1/2 w-px bg-border transition-colors group-hover:bg-accent group-active:bg-primary-hover" />
            </div>
          )}
          <SelectionActionPanel
            currentPhase={currentPhase}
            selectedPaper={selectedPaper}
            aiAnalysis={aiAnalysis}
            isAnalyzing={isAnalyzing}
            runAiAnalysis={runAiAnalysis}
            isCollapsed={isRightCollapsed}
            onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
            isDisabled={isCompleted}
            onEditCriteria={() => setIsCriteriaModalOpen(true)}
          />
        </div>
        </div>

        {mobileActionOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setMobileActionOpen(false)}
          >
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Review tools"
              className="absolute inset-y-0 right-0 w-[min(92vw,380px)] bg-surface-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <SelectionActionPanel
                currentPhase={currentPhase}
                selectedPaper={selectedPaper}
                aiAnalysis={aiAnalysis}
                isAnalyzing={isAnalyzing}
                runAiAnalysis={runAiAnalysis}
                isCollapsed={false}
                onToggleCollapse={() => setMobileActionOpen(false)}
                isDisabled={isCompleted}
                onEditCriteria={() => setIsCriteriaModalOpen(true)}
              />
            </aside>
          </div>
        )}
      </div>

      {isAssignmentMode && selectedIds.length > 0 && (
        <BulkAssignmentPanel
          selectedPaperIds={selectedIds}
          currentPhase={currentPhaseNumeric}
          isDisabled={isCompleted}
          onAssignmentComplete={() => {
            setSelectedIds([]);
            queryClient.invalidateQueries({
              queryKey: [
                "infinite-title-abstract-assignment-papers",
                screeningProcessId,
              ],
            });
            queryClient.invalidateQueries({
              queryKey: [
                "infinite-full-text-assignment-papers",
                screeningProcessId,
              ],
            });
            queryClient.invalidateQueries({
              queryKey: ["reviewer-decisions"],
            });
            queryClient.invalidateQueries({
              queryKey: [
                "study-selection",
                screeningProcessId,
                "conflict-status",
              ],
            });
          }}
        />
      )}

      <StudySelectionCriteriaModal
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
        studySelectionProcessId={screeningProcessId || ""}
      />
    </div>
  );
}
