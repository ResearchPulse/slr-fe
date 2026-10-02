import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQualityAssessment } from "./hooks/useQualityAssessment";
import { QAHeader } from "./sections/QAHeader";
import { AssignMembersTabContent } from "./sections/AssignMembersTabContent";
import { QAPapersTabContent } from "./sections/QAPapersTabContent";
import { QAAssignModal } from "./components/QAAssignModal";
import { QAAutoResolveModal } from "./components/QAAutoResolveModal";
import { ReviewerProgressPanel } from "./components/ReviewerProgressPanel";
import { useProject, useProjectMembers } from "../../../hooks/useProjects";
import type {
  QAPaperResponse,
  LeaderQAPaperResponse,
  QualityAssessmentResolutionRequest,
} from "../../../types/qualityAssessment";
import { ProjectRole } from "../../../types/project";
import type { ReviewerDecisionPayload } from "./components/ReviewerQAPanel";
import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store";
import { CheckCircle2, CircleDashed, Clock3, Files } from "lucide-react";

export type WorkspaceQAPaper = QAPaperResponse | LeaderQAPaperResponse;

const defaultQAStats = {
  total: 0,
  completed: 0,
  inProgress: 0,
  notStarted: 0,
  pending: 0,
  completionPercentage: 0,
};

export default function QualityAssessmentWorkspace() {
  const { projectId, qualityAssessmentId, processId } = useParams<{
    projectId: string;
    qualityAssessmentId: string;
    processId: string;
  }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [viewMode, setViewMode] = useState<"list" | "edit">("list");
  const [assignPopupPaperId, setAssignPopupPaperId] = useState<string | null>(
    null,
  );
  const [isAutoResolveOpen, setIsAutoResolveOpen] = useState(false);

  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [qaPage, setQaPage] = useState(1);

  const { project } = useProject(projectId);

  const { members: projectMembers } = useProjectMembers(projectId);
  // TODO: casi role nay co phai isLeader ko wtf :)?
  const members =
    projectMembers?.filter((m) => m.role === ProjectRole.Reviewer) || [];

  const {
    assignedPapers,
    allPapers,
    leaderStats,
    memberStats,
    memberProgresses,
    totalPagesList,
    totalItemsList,
    strategies,
    isAssigning,
    isSubmittingDecisions,
    isUpdatingDecisions,
    isSubmittingResolution,
    isUpdatingResolution,
    isAutoResolving,
    phaseStatus,
    assign,
    submitDecisions,
    updateDecisions,
    submitResolution,
    updateResolution,
    autoResolve,
    aiDecision,
    exportExcel,
  } = useQualityAssessment(qualityAssessmentId, project?.isLeader, {
    pageNumber: qaPage,
    pageSize: 10,
    search: searchQuery || undefined,
  });

  const canEdit = phaseStatus !== "Completed" && phaseStatus !== "Cancelled";

  const totalCriteria = useMemo(() => {
    return strategies.reduce((acc, strategy) => {
      return (
        acc +
        strategy.checklists.reduce((acc2, checklist) => {
          return acc2 + checklist.criteria.length;
        }, 0)
      );
    }, 0);
  }, [strategies]);

  const activePapers = useMemo(() => {
    const rawPapers = project?.isLeader ? allPapers : assignedPapers;
    // Apply different ordering depending on role
    return [...rawPapers].sort((a, b) => {
      // Helper to compute group priority for a paper
      const getPriority = (paper: typeof a) => {
        const res = paper.resolution;
        const pct = paper.completionPercentage ?? 0;

        // Both leader and reviewer now return the same resolution object
        if (res && typeof res.finalDecision === "number") {
          if (res.finalDecision === 1) return 4; // HighQuality
          if (res.finalDecision === 0) return 5; // LowQuality
        }

        if (project?.isLeader) {
          // Leader: completed on top, then ongoing, pending, highQuality, LowQuality
          if (pct === 100) return 0; // completed
          if (pct > 0 && pct < 100) return 1; // ongoing
          return 2; // pending (pct === 0)
        } else {
          // Reviewer: ongoing, pending, completed, highQuality, LowQuality
          if (pct > 0 && pct < 100) return 0; // ongoing
          if (pct === 0) return 1; // pending
          if (pct === 100) return 2; // completed
          return 3;
        }
      };

      const pa = getPriority(a);
      const pb = getPriority(b);

      if (pa !== pb) return pa - pb;

      // Tie-breaker within same group: prefer higher completion percentage, then title
      const pctDiff =
        (b.completionPercentage ?? 0) - (a.completionPercentage ?? 0);
      if (pctDiff !== 0) return pctDiff;
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [project?.isLeader, assignedPapers, allPapers]);

  const selectedPaper = useMemo(
    () => activePapers.find((p) => p.paperId === selectedPaperId) ?? null,
    [activePapers, selectedPaperId],
  );

  const stats = useMemo(() => {
    if (project?.isLeader && leaderStats) {
      const completed = leaderStats.completedPapers ?? 0;
      const total = leaderStats.totalPapers ?? 0;
      return {
        ...defaultQAStats,
        total,
        completed,
        inProgress: leaderStats.inProgressPapers ?? 0,
        notStarted: leaderStats.notStartedPapers ?? 0,
        pending: total - completed,
        completionPercentage: leaderStats.completionPercentage ?? 0,
      };
    } else if (!project?.isLeader && memberStats) {
      const completed = memberStats.completedPapers ?? 0;
      const total = memberStats.totalPapers ?? 0;
      return {
        ...defaultQAStats,
        total,
        completed,
        inProgress: memberStats.inProgressPapers ?? 0,
        notStarted: memberStats.notStartedPapers ?? 0,
        pending: total - completed,
        completionPercentage: memberStats.completionPercentage ?? 0,
      };
    }

    if (!activePapers.length) return defaultQAStats;
    const total = activePapers.length;
    const completed = activePapers.filter(
      (p) => p.completionPercentage === 100,
    ).length;
    const inProgress = activePapers.filter(
      (p) => p.completionPercentage > 0 && p.completionPercentage < 100,
    ).length;
    const notStarted = activePapers.filter(
      (p) => p.completionPercentage === 0,
    ).length;

    return {
      ...defaultQAStats,
      total,
      completed,
      inProgress,
      notStarted,
      pending: total - completed,
      completionPercentage: Math.round((completed / total) * 100) || 0,
    };
  }, [activePapers, leaderStats, memberStats, project?.isLeader]);

  const openEditSpace = (paperId: string) => {
    setSelectedPaperId(paperId);
    setViewMode("edit");
  };

  const closeEditSpace = () => {
    setViewMode("list");
  };

  const handleAssignClick = (e: React.MouseEvent, paperId: string) => {
    e.stopPropagation();
    setAssignPopupPaperId(paperId);
  };

  const handleBack = () => {
    navigate(`/projects/${projectId}/processes/${processId}`);
  };

  const handleSaveAssignments = (selectedUserIds: string[]) => {
    if (assignPopupPaperId && qualityAssessmentId) {
      // Ensure we don't overwrite/remove previously assigned users if the backend fully replaces the array
      const allUserIdsToAssign = Array.from(
        new Set([...assignedUserIds, ...selectedUserIds]),
      );

      assign({
        qualityAssessmentProcessId: qualityAssessmentId,
        paperIds: [assignPopupPaperId],
        userIds: allUserIdsToAssign,
      });
      setAssignPopupPaperId(null);
    }
  };

  const currentAssignPaper = activePapers.find(
    (p) => p.paperId === assignPopupPaperId,
  ) as LeaderQAPaperResponse | undefined;
  const assignedUserIds = currentAssignPaper?.reviewers?.map((r) => r.id) || [];

  const handleReviewerSave = (
    notes: string | null,
    decisionitems: ReviewerDecisionPayload[],
  ) => {
    if (selectedPaperId && qualityAssessmentId) {
      const sp = selectedPaper as QAPaperResponse;
      const myDecision = sp?.decisions?.[0]; // Get current decision record

      if (myDecision?.id) {
        updateDecisions({
          id: myDecision.id,
          notes,
          decisionItems: decisionitems.map((item) => ({
            id: item.itemId || null,
            qualityCriterionId: item.criterionId,
            value: item.value,
            comment: item.comment,
            pdfHighlightCoordinates: item.pdfHighlightCoordinates,
          })),
        });
      } else {
        submitDecisions({
          paperId: selectedPaperId,
          qualityAssessmentProcessId: qualityAssessmentId,
          notes,
          decisionItems: decisionitems.map((item) => ({
            qualityCriterionId: item.criterionId,
            value: item.value,
            comment: item.comment,
            pdfHighlightCoordinates: item.pdfHighlightCoordinates,
          })),
        });
      }
    }
  };

  const handleLeaderResolve = (
    data: Omit<
      QualityAssessmentResolutionRequest,
      "qualityAssessmentProcessId" | "paperId"
    >,
    decisionData?: { notes: string | null; items: ReviewerDecisionPayload[] },
  ) => {
    if (selectedPaperId && qualityAssessmentId) {
      const sp = selectedPaper as LeaderQAPaperResponse;

      // Optionally submit or update leader's own decisions
      if (decisionData && currentUser) {
        const myDecision = sp?.decisions?.find(
          (d) => d.reviewerId === currentUser.id,
        );

        if (myDecision?.id) {
          updateDecisions({
            id: myDecision.id,
            notes: decisionData.notes,
            decisionItems: decisionData.items.map((item) => ({
              id: item.itemId || null,
              qualityCriterionId: item.criterionId,
              value: item.value,
              comment: item.comment,
              pdfHighlightCoordinates: item.pdfHighlightCoordinates,
            })),
          });
        } else {
          submitDecisions({
            paperId: selectedPaperId,
            qualityAssessmentProcessId: qualityAssessmentId,
            notes: decisionData.notes,
            decisionItems: decisionData.items.map((item) => ({
              qualityCriterionId: item.criterionId,
              value: item.value,
              comment: item.comment,
              pdfHighlightCoordinates: item.pdfHighlightCoordinates,
            })),
          });
        }
      }

      if (sp?.resolution?.id) {
        updateResolution({
          id: sp.resolution.id,
          finalDecision: data.finalDecision,
          finalScore: data.finalScore,
          resolutionNotes: data.resolutionNotes,
        });
      } else {
        submitResolution({
          qualityAssessmentProcessId: qualityAssessmentId,
          paperId: selectedPaperId,
          ...data,
        });
      }
    }
  };

  const handleAiAnalyze = async (paperId: string) => {
    if (!qualityAssessmentId)
      return { pageWidth: null, pageHeight: null, decisionItems: [] };
    try {
      const result = await aiDecision({
        qualityAssessmentProcessId: qualityAssessmentId,
        paperId: paperId,
      });
      return (
        result.data ?? { pageWidth: null, pageHeight: null, decisionItems: [] }
      );
    } catch (error) {
      console.error(error);
      return { pageWidth: null, pageHeight: null, decisionItems: [] };
    }
  };

  const handleAutoResolve = async (data: {
    score?: number | null;
    percentage?: number | null;
  }) => {
    if (!qualityAssessmentId) return;
    try {
      await autoResolve({
        qualityAssessmentProcessId: qualityAssessmentId,
        score: data.score,
        percentage: data.percentage,
      });
      setIsAutoResolveOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-bg-primary relative">
      <QAHeader
        onBack={viewMode === "edit" ? closeEditSpace : handleBack}
        stats={stats}
        phaseStatus={phaseStatus ?? "NotStarted"}
        onExport={project?.isLeader ? exportExcel : undefined}
        rightControls={
          project?.isLeader &&
          canEdit && (
            <button
              onClick={() => setIsAutoResolveOpen(true)}
              className="flex h-12 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              Auto-Resolve
            </button>
          )
        }
      />

      {viewMode === "list" ? (
        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 overflow-auto px-5 py-5 sm:px-6 lg:gap-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-text-primary">
                Assessment workspace
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Assign studies, track reviewer progress, and resolve assessments.
              </p>
            </div>
          </div>

          <section aria-label="Assessment progress" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-white p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-sm text-text-secondary">Total studies</p>
                <p className="mt-2 text-2xl font-semibold leading-none text-text-primary">{stats.total}</p>
                <p className="mt-2 text-xs text-text-secondary">Included for quality review</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-primary text-text-secondary"><Files size={19} /></div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-surface-white p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-sm text-text-secondary">Completed</p>
                <p className="mt-2 text-2xl font-semibold leading-none text-text-primary">{stats.completed}</p>
                <p className="mt-2 text-xs text-text-secondary">Assessment submitted</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={19} /></div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-surface-white p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-sm text-text-secondary">In progress</p>
                <p className="mt-2 text-2xl font-semibold leading-none text-text-primary">{stats.inProgress}</p>
                <p className="mt-2 text-xs text-text-secondary">Reviewer work underway</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Clock3 size={19} /></div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-surface-white p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-sm text-text-secondary">{project?.isLeader ? "Not started" : "Pending"}</p>
                <p className="mt-2 text-2xl font-semibold leading-none text-text-primary">{project?.isLeader ? stats.notStarted : stats.pending}</p>
                <p className="mt-2 text-xs text-text-secondary">Waiting for reviewer activity</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><CircleDashed size={19} /></div>
            </div>
          </section>

          <div
            className={
              project?.isLeader && memberProgresses.length > 0
                ? "grid grid-cols-1 items-start gap-5 xl:grid-cols-4 xl:gap-6"
                : "block"
            }
          >
            <div
              className={
                project?.isLeader && memberProgresses.length > 0
                  ? "min-w-0 xl:col-span-3"
                  : "w-full"
              }
            >
              <AssignMembersTabContent
                papers={activePapers}
                isLeader={project?.isLeader}
                onPaperClick={openEditSpace}
                onAssignClick={handleAssignClick}
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                  setSearchQuery(q);
                  setQaPage(1);
                }}
                currentPage={qaPage}
                totalPages={totalPagesList ?? 1}
                totalItems={totalItemsList ?? 0}
                onPageChange={setQaPage}
              />
            </div>

            {project?.isLeader && memberProgresses.length > 0 && (
              <div className="min-w-0 xl:col-span-1">
                <ReviewerProgressPanel reviewerProgresses={memberProgresses} />
              </div>
            )}
          </div>
        </main>
      ) : (
        <main className="flex-1 min-h-0 flex flex-col pt-0 w-full overflow-hidden bg-surface-white">
          <QAPapersTabContent
            papers={activePapers}
            strategies={strategies}
            isLeader={project?.isLeader ?? false}
            selectedPaper={selectedPaper}
            selectedPaperId={selectedPaperId}
            setSelectedPaperId={setSelectedPaperId}
            searchQuery={searchQuery}
            setSearchQuery={(q) => {
              setSearchQuery(q);
              setQaPage(1);
            }}
            currentPage={qaPage}
            totalPages={totalPagesList ?? 1}
            totalItems={totalItemsList ?? 0}
            onPageChange={setQaPage}
            onReviewerSave={handleReviewerSave}
            onLeaderResolve={handleLeaderResolve}
            onAiAnalyze={handleAiAnalyze}
            isSaving={
              isSubmittingDecisions ||
              isUpdatingDecisions ||
              isSubmittingResolution ||
              isUpdatingResolution
            }
            canEdit={canEdit}
          />
        </main>
      )}

      {/* Assignment Popup Modal */}
      <QAAssignModal
        isOpen={!!assignPopupPaperId}
        onClose={() => setAssignPopupPaperId(null)}
        onAssign={(userIds) => handleSaveAssignments(userIds)}
        members={members}
        assignedUserIds={assignedUserIds}
        isAssigning={isAssigning}
        hasResolution={!!currentAssignPaper?.resolution}
      />
      {/* Auto Resolve Modal */}
      {isAutoResolveOpen && (
        <QAAutoResolveModal
          isOpen={isAutoResolveOpen}
          onClose={() => setIsAutoResolveOpen(false)}
          onConfirm={handleAutoResolve}
          isSubmitting={isAutoResolving}
          totalCriteria={totalCriteria}
        />
      )}
    </div>
  );
}
