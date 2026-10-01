import type { WorkspaceQAPaper } from "../QualityAssessmentWorkspace";
import AssessmentQueue from "../components/AssessmentQueue";
import AssessmentPaperViewer from "../components/AssessmentPaperViewer";
import ReviewerQAPanel from "../components/ReviewerQAPanel";
import LeaderQAPanel from "../components/LeaderQAPanel";
import { useState, useEffect } from "react";
import type { ReviewerDecisionPayload } from "../components/ReviewerQAPanel";
import type {
  QualityAssessmentStrategy,
  QualityAssessmentResolutionRequest,
  LeaderQAPaperResponse,
  QAPaperResponse,
  AutomateQualityAssessmentResponse,
} from "../../../../types/qualityAssessment";
import type { HighlightArea } from "@react-pdf-viewer/highlight";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../redux/store";

export interface HighlightData {
  areas: HighlightArea[];
  reviewerInitials: string;
  bgColor: string;
}

interface QAPapersTabContentProps {
  papers: WorkspaceQAPaper[];
  strategies: QualityAssessmentStrategy[];
  isLeader: boolean;
  selectedPaper: WorkspaceQAPaper | null | undefined;
  selectedPaperId: string | null;
  setSelectedPaperId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onReviewerSave?: (
    notes: string | null,
    decisions: ReviewerDecisionPayload[],
  ) => void;
  onLeaderResolve?: (
    data: Omit<
      QualityAssessmentResolutionRequest,
      "qualityAssessmentProcessId" | "paperId"
    >,
    decisionData?: { notes: string | null; items: ReviewerDecisionPayload[] },
  ) => void;
  onAiAnalyze?: (paperId: string) => Promise<AutomateQualityAssessmentResponse>;
  highlightsByCriterion?: Record<string, HighlightData[]>;
  isSaving?: boolean;
  canEdit?: boolean;
}

export function QAPapersTabContent({
  papers,
  strategies,
  isLeader,
  selectedPaper,
  selectedPaperId,
  setSelectedPaperId,
  searchQuery,
  setSearchQuery,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onReviewerSave,
  onLeaderResolve,
  onAiAnalyze,
  isSaving,
  canEdit,
}: QAPapersTabContentProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [activeCriterionId, setActiveCriterionId] = useState<string | null>(
    null,
  );
  const [highlightsByCriterion, setHighlightsByCriterion] = useState<
    Record<string, HighlightData[]>
  >({});
  const [leaderActiveTab, setLeaderActiveTab] = useState<
    "reviewers" | "my-assessment"
  >("reviewers");

  useEffect(() => {
    const firstCriterionId =
      strategies?.[0]?.checklists?.[0]?.criteria?.[0]?.criterionId || null;
    setActiveCriterionId(firstCriterionId);
    setHighlightsByCriterion({});
    if (selectedPaper) {
      if (!isLeader) {
        const qPaper = selectedPaper as QAPaperResponse;
        const initialHighlights: Record<string, HighlightData[]> = {};
        const myDecision = qPaper.decisions?.[0];
        myDecision?.decisionItems?.forEach((item) => {
          if (item.qualityCriterionId && item.pdfHighlightCoordinates) {
            try {
              const pageStrs = item.pdfHighlightCoordinates.split(";");
              const parsedAreas: HighlightArea[][] = pageStrs
                .filter(Boolean)
                .map((hStr) => {
                  const [page, x, y, height, width] = hStr
                    .split(",")
                    .map(Number);
                  return [{ pageIndex: page, top: y, left: x, height, width }];
                });
              initialHighlights[item.qualityCriterionId] = parsedAreas.map(
                (areas: HighlightArea[]) => ({
                  areas,
                  reviewerInitials: "YOU",
                  bgColor: "rgba(245, 158, 11, 0.4)",
                }),
              );
            } catch {
              // Skip malformed stored highlight coordinates.
            }
          }
        });
        setHighlightsByCriterion(initialHighlights);
      } else {
        // Leader loads highlights from all reviewers
        const lPaper = selectedPaper as LeaderQAPaperResponse;
        const initialHighlights: Record<string, HighlightData[]> = {};

        lPaper.decisions?.forEach((decision) => {
          // If the leader is in "my-assessment" mode, they only see their own highlights.
          if (
            leaderActiveTab === "my-assessment" &&
            decision.reviewerId !== currentUser?.id
          ) {
            return;
          }

          const reviewer = lPaper.reviewers?.find(
            (r) => r.id === decision.reviewerId,
          );
          console.log(
            "Processing decision for reviewer:",
            reviewer?.fullname || reviewer?.username,
            currentUser,
          );
          const isCurrentUser = decision?.reviewerId === currentUser?.id;
          const initials = isCurrentUser
            ? "YOU"
            : reviewer
              ? (reviewer.fullname || reviewer.username)
                  .substring(0, 2)
                  .toUpperCase()
              : "NA";

          let bgColor = "rgba(245, 158, 11, 0.4)";
          if (!isCurrentUser) {
            const colorIndex = decision.reviewerId.charCodeAt(0) % 5;
            const colors = [
              "rgba(239, 68, 68, 0.4)",
              "rgba(59, 130, 246, 0.4)",
              "rgba(16, 185, 129, 0.4)",
              "rgba(245, 158, 11, 0.4)",
              "rgba(139, 92, 246, 0.4)",
            ];
            bgColor = colors[colorIndex];
          }

          decision.decisionItems?.forEach((item) => {
            if (item.qualityCriterionId && item.pdfHighlightCoordinates) {
              try {
                const pageStrs = item.pdfHighlightCoordinates.split(";");
                const areas: HighlightArea[] = pageStrs
                  .filter(Boolean)
                  .map((hStr) => {
                    const [page, x, y, height, width] = hStr
                      .split(",")
                      .map(Number);
                    return { pageIndex: page, top: y, left: x, height, width };
                  });

                if (!initialHighlights[item.qualityCriterionId]) {
                  initialHighlights[item.qualityCriterionId] = [];
                }
                // Add each highlight group with reviewer styling
                initialHighlights[item.qualityCriterionId].push({
                  areas,
                  reviewerInitials: initials,
                  bgColor,
                });
              } catch {
                // Skip malformed stored highlight coordinates.
              }
            }
          });
        });
        setHighlightsByCriterion(initialHighlights);
      }
    }
  }, [
    selectedPaperId,
    selectedPaper,
    isLeader,
    strategies,
    leaderActiveTab,
    currentUser,
  ]);

  const handleAddHighlight = (areas: HighlightArea[]) => {
    if (!activeCriterionId) {
      return;
    }
    const newHighlightData: HighlightData = {
      areas,
      reviewerInitials: "YOU",
      bgColor: "rgba(255, 255, 0, 0.4)",
    };
    setHighlightsByCriterion((prev) => ({
      ...prev,
      [activeCriterionId]: [
        ...(prev[activeCriterionId] || []),
        newHighlightData,
      ],
    }));
  };

  const handleRemoveHighlight = (index: number) => {
    if (!activeCriterionId) return;
    setHighlightsByCriterion((prev) => {
      const arr = prev[activeCriterionId] || [];
      return {
        ...prev,
        [activeCriterionId]: arr.filter((_, i) => i !== index),
      };
    });
  };

  const currentHighlights = activeCriterionId
    ? highlightsByCriterion[activeCriterionId] || []
    : [];

  return (
    <div className="min-h-0 w-full flex-1 overflow-auto bg-bg-primary p-3 sm:p-4">
      <div className="grid min-h-full grid-cols-1 overflow-hidden rounded-2xl border border-border bg-surface-white shadow-[0_2px_10px_rgba(18,35,49,0.05)] xl:h-full xl:min-h-0 xl:grid-cols-[270px_minmax(0,1fr)_350px]">
      {/* Paper queue */}
      <div className="flex min-h-[300px] min-w-0 flex-col overflow-hidden border-b border-border bg-bg-primary xl:h-full xl:min-h-0 xl:border-b-0 xl:border-r">
        <AssessmentQueue
          papers={papers}
          selectedPaperId={selectedPaperId}
          onSelectPaper={setSelectedPaperId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLeader={isLeader}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={onPageChange}
        />
      </div>

      {/* Paper details */}
      <div className="relative flex min-h-[520px] min-w-0 flex-col overflow-hidden bg-surface-white xl:h-full xl:min-h-0">
        {selectedPaper ? (
          <div className="h-full overflow-hidden">
            <AssessmentPaperViewer
              paper={selectedPaper}
              highlights={currentHighlights}
              onAddHighlight={handleAddHighlight}
              onRemoveHighlight={handleRemoveHighlight}
              isLeader={isLeader && leaderActiveTab === "reviewers"}
            />
          </div>
        ) : (
          <div className="flex min-h-[520px] flex-1 items-center justify-center bg-bg-primary/60 px-6 text-center text-text-secondary xl:min-h-0">
            <div className="max-w-sm rounded-2xl border border-border bg-surface-white p-8 shadow-sm">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-accent">
                <span className="text-lg font-semibold">1</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">Choose a study to review</p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">Paper details and assessment activity will appear here.</p>
            </div>
          </div>
        )}
      </div>

      {/* Assessment / resolution */}
      <div className="relative z-10 flex min-h-[560px] min-w-0 flex-col overflow-hidden border-t border-border bg-surface-white xl:h-full xl:min-h-0 xl:border-l xl:border-t-0">
        {selectedPaper ? (
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface-white px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">Quality review</p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">
                {isLeader ? "Conflict Resolution" : "Assessment Criteria"}
                </p>
              </div>
              <span className="rounded-full border border-primary/15 bg-primary-light px-2.5 py-1 text-[11px] font-medium text-primary">{isLeader ? "Leader" : "Reviewer"}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              {isLeader ? (
                <LeaderQAPanel
                  paper={selectedPaper as LeaderQAPaperResponse}
                  strategies={strategies}
                  onResolve={onLeaderResolve!}
                  onAiAnalyze={onAiAnalyze}
                  isResolving={isSaving}
                  activeCriterionId={activeCriterionId}
                  onSelectCriterion={setActiveCriterionId}
                  highlightsByCriterion={highlightsByCriterion}
                  canEdit={canEdit}
                  activeTab={leaderActiveTab}
                  onTabChange={setLeaderActiveTab}
                />
              ) : (
                <ReviewerQAPanel
                  paper={selectedPaper as QAPaperResponse}
                  strategies={strategies}
                  onSave={onReviewerSave!}
                  onAiAnalyze={onAiAnalyze}
                  isSaving={isSaving}
                  activeCriterionId={activeCriterionId}
                  onSelectCriterion={setActiveCriterionId}
                  highlightsByCriterion={highlightsByCriterion}
                  canEdit={canEdit}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-1 items-center justify-center bg-bg-primary/50 p-6 text-center text-text-secondary xl:min-h-0">
            <div className="max-w-xs">
              <p className="text-sm font-semibold text-text-primary">Assessment panel</p>
              <p className="mt-1 text-sm leading-6">Select a paper to view reviewer decisions and submit a resolution.</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
