import React, { useState, useCallback, useRef } from "react";
import { toastSuccess, toastError } from "../../utils/toast";
import { useParams } from "react-router-dom";
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
import { Users, X, AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn";
import BulkAssignmentPanel from "../../components/reviewProcess/leader/BulkAssignmentPanel";
import { useStudySelection } from "../reviewProcess/studySelection/titleAbstractScreening/hooks/useStudySelection";
import { SelectionProcessStatus } from "../../types/studySelection";

export default function ManageStudySelectionPage() {
  const { screeningProcessId } = useParams<{
    screeningProcessId: string;
  }>();
  const [currentPhase, setCurrentPhase] =
    useState<SelectionPhase>("TITLE_ABSTRACT");
  const [isAssignmentMode, setIsAssignmentMode] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leftWidth, setLeftWidth] = useState(320); // px
  const [rightWidth, setRightWidth] = useState(300); // px
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
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
  const { aiAnalysis, isAnalyzing, runAiAnalysis } = useStudySelection(
    currentPhaseNumeric,
    selectedPaperId,
  );

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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden overscroll-none bg-[#f2f6f9]">
      <StuSePhaseHeaderController
        currentPhase={currentPhase}
        onPhaseChange={(phase) => {
          setCurrentPhase(phase);
          setSelectedPaperId(null);
          setSelectedIds([]);
        }}
      />

      <div
        ref={containerRef}
        className="relative flex min-h-0 flex-1 gap-2 overflow-hidden p-2 select-none"
      >
        {/* Main Content: Paper Viewer - Occupies full space */}
        <div className="order-2 z-0 min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-[#dce6ed] bg-white shadow-sm">
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

        {/* Left Side: Paper List Overlay */}
        <div
          style={{ width: isLeftCollapsed ? "48px" : `${leftWidth}px` }}
          className={cn(
            "order-1 relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-[#dce6ed] bg-white shadow-sm",
            isAssignmentMode && "ring-1 ring-blue-200",
            !isResizing && "transition-all duration-300",
          )}
        >
          {/* Resize Handle Left */}
          {!isLeftCollapsed && (
            <div
              onMouseDown={startResizingLeft}
              className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize z-30 group"
            >
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-200 group-hover:bg-blue-400 group-active:bg-blue-600 transition-colors" />
            </div>
          )}
          {!isLeftCollapsed && (
            <div
              className={cn(
                "border-b border-[#e4ebf0] p-4 transition-colors duration-300",
                isAssignmentMode ? "bg-blue-50/50" : "bg-white",
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
                  "w-full gap-2 rounded-lg transition-all duration-200",
                  isAssignmentMode
                    ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "bg-blue-700 text-white hover:bg-blue-800",
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
                <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Assignment Mode Active
                  </div>
                  <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                      Select papers to assign reviewers.{" "}
                      <span className="text-amber-700 font-bold">
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
            "order-3 relative h-full min-h-0 shrink-0 overflow-hidden rounded-xl border border-[#dce6ed] bg-white shadow-sm",
            isRightCollapsed && "w-12",
            !isResizing && "transition-all duration-300",
          )}
        >
          {/* Resize Handle Right */}
          {!isRightCollapsed && (
            <div
              onMouseDown={startResizingRight}
              className="absolute -left-1 top-0 bottom-0 w-2 cursor-col-resize z-30 group"
            >
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-200 group-hover:bg-blue-400 group-active:bg-blue-600 transition-colors" />
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
          />
        </div>
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
    </div>
  );
}
