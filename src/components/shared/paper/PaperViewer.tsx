import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FiCheck,
  FiFileText,
  FiAlertTriangle,
  FiRefreshCw,
  FiShare2,
  FiGitBranch,
  FiList,
  FiExternalLink,
  FiUploadCloud,
  FiChevronUp,
} from "react-icons/fi";
import { cn } from "../../../utils/cn";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { useProjectMember } from "../../../hooks/useProjectMember";

import { usePaperViewerState } from "./PaperViewer/hooks/usePaperViewerState";
import {
  PaperHeroHeader,
  ContentSection,
  PublicationInfoCard,
  IdentifierSection,
  SystemMetadataCollapse,
  PaperInfoSummary,
  TabButton,
  DecisionStatus,
  ResolutionDetails,
  GraphSection,
  PaperNodeList,
} from "./PaperViewer/components";
import PdfJsViewer from "./PdfJsViewer/PdfJsViewer";
import CitationGraphModal from "../../../pages/reviewProcess/studySelection/titleAbstractScreening/components/graph/CitationGraphModal";
import ExcludeMenu from "../../../pages/reviewProcess/studySelection/components/ExcludeMenu";
import type { PaperViewerProps } from "./PaperViewer/types";
import { PaperPhase } from "../../../types/studySelection";
import { useReviewerDecisions } from "../../../hooks/useStudySelection";
import ConflictResolutionModal from "../../reviewProcess/leader/ConflictResolutionModal";
import UploadFullTextPdfModal from "../../../pages/reviewProcess/studySelection/components/UploadFullTextPdfModal";
import ReviewCommentField from "../../../pages/reviewProcess/studySelection/components/ReviewCommentField";

export default function PaperViewer({
  paper,
  onInclude,
  onExclude,
  isSubmitting = false,
  onRetryExtraction,
  isRetryingExtraction = false,
  hideActions = false,
  infoSummary = null,
  referencesOverride,
  referencesLoadingOverride,
  referencesCountOverride,
  isLeaderView = false,
  phase = PaperPhase.TitleAbstract,
  isDisabled = false,
}: PaperViewerProps) {
  const {
    screeningProcessId,
    activeTab,
    setActiveTab,
    openGraph,
    setOpenGraph,
    setReasonPageSize,
    includePaper,
    excludePaper,
    uploadPaperPdf,
    retryMetadataExtraction,
    isSubmittingDecision,
    isUploadingPdf,
    isRetryingExtraction: isHookRetryingExtraction,
    references,
    citations,
    citationGraph,
    isDiscoveryLoading,
    graphDepth,
    setGraphDepth,
    minConfidence,
    setMinConfidence,
    exclusionReasons,
    isLoadingReasons,
    hasMoreReasons,
    canReview,
    isFieldUpdated,
  } = usePaperViewerState(paper, phase);

  const displayedReferences = referencesOverride ?? references;
  const displayedReferencesLoading =
    referencesLoadingOverride ?? isDiscoveryLoading;
  const displayedReferencesCount =
    referencesCountOverride ?? displayedReferences.length;

  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const activeProjectId = projectId || id;

  const { member } = useProjectMember(activeProjectId || "");
  const isLeader = member?.isLeader ?? false;

  const navigate = useNavigate();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReviewerProgressCollapsed, setIsReviewerProgressCollapsed] =
    useState(false);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    setReviewComment("");
  }, [paper?.id]);

  const finalOnRetryExtraction = onRetryExtraction || retryMetadataExtraction;
  const finalIsRetryingExtraction =
    isRetryingExtraction || isHookRetryingExtraction;

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const handleSectionClick = (sectionKey: string) => {
    setActiveSection(sectionKey);
  };

  const activeSectionCoords = useMemo(() => {
    if (!activeSection) return null;
    const section = paper?.fullTextSections?.find(
      (s) => s.sectionTitle === activeSection,
    );
    return section?.coordinates || null;
  }, [activeSection, paper]);

  const { data: reviewerDecisions, isLoading: isLoadingReviewers } =
    useReviewerDecisions(screeningProcessId, paper?.id, phase, isLeaderView);

  const hasPendingAssignedReviewer = !!reviewerDecisions?.some(
    (rd) => !rd.decision,
  );
  const submittedReviewCount = reviewerDecisions?.filter((item) => item.decision).length ?? 0;
  const totalReviewCount = reviewerDecisions?.length ?? 0;
  const hasPendingReview = hasPendingAssignedReviewer;

  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  if (!paper) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-bg-primary text-center px-8">
        <FiFileText className="mb-4 h-12 w-12 text-text-secondary" />
        <h3 className="text-lg font-medium text-text-secondary">
          No Paper Selected
        </h3>
        <p className="text-sm text-text-secondary mt-2">
          Select a paper from the queue to start reviewing
        </p>
      </div>
    );
  }

  // const hasPendingAssignedReviewer = !!paper.assignedReviewers?.some((r) => !r.decision);

  return (
    <div className="relative flex h-full flex-col bg-bg-primary">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={cn("space-y-2 px-4 py-3 transition-[padding] duration-300 motion-reduce:transition-none lg:px-6 lg:py-4")}>
          {openGraph && citationGraph && (
            <CitationGraphModal
              isOpen={openGraph}
              onClose={() => setOpenGraph(false)}
              data={citationGraph}
              paperTitle={paper.title}
              rootPaperId={paper.id}
            />
          )}

          {/* 1. Hero Header */}
          <div className="relative group/hero">
            <button
              type="button"
              aria-label="View full paper details"
              onClick={() =>
                navigate(`/projects/${activeProjectId}/papers/${paper.id}`)
              }
              className="absolute right-6 top-6 z-20 hidden min-h-11 items-center gap-2 rounded-xl border border-border bg-bg-secondary/80 px-4 text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-0 shadow-none transition-[opacity,color,background-color,border-color] hover:border-accent hover:bg-primary hover:text-white group-hover/hero:opacity-100 lg:flex"
            >
              Full Details
              <FiExternalLink className="w-3.5 h-3.5" />
            </button>
            <PaperHeroHeader
              paper={paper}
              isLeaderView={isLeaderView}
              isFieldUpdated={isFieldUpdated}
            />
            <button
              type="button"
              onClick={() => navigate(`/projects/${activeProjectId}/papers/${paper.id}`)}
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-white px-4 text-xs font-semibold text-text-secondary transition-colors hover:border-accent/30 hover:bg-primary-light hover:text-accent lg:hidden"
            >
              View full paper details
              <FiExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-white p-1 shadow-sm">
            <TabButton
              active={activeTab === "abstract"}
              onClick={() => setActiveTab("abstract")}
              icon={<FiFileText className="w-4 h-4" />}
              label="Overview"
            />
            <TabButton
              active={activeTab === "references"}
              onClick={() => setActiveTab("references")}
              icon={<FiList className="w-4 h-4" />}
              label="References"
              count={displayedReferencesCount}
            />
            <TabButton
              active={activeTab === "citations"}
              onClick={() => setActiveTab("citations")}
              icon={<FiShare2 className="w-4 h-4" />}
              label="Citations"
              count={citations.length}
            />
            <TabButton
              active={activeTab === "graph"}
              onClick={() => setActiveTab("graph")}
              icon={<FiGitBranch className="w-4 h-4" />}
              label="Network"
            />
            <TabButton
              active={activeTab === "fulltext"}
              onClick={() => setActiveTab("fulltext")}
              icon={<FiFileText className="w-4 h-4" />}
              label="Full Text"
            />
          </div>

          {/* 2. Tab Content */}
          <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none">
            {activeTab === "abstract" && (
              <>
                {infoSummary && (
                  <PaperInfoSummary paper={paper} />
                )}
                <ContentSection
                  paper={paper as any}
                  isFieldUpdated={isFieldUpdated}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <PublicationInfoCard
                    paper={paper}
                    isFieldUpdated={isFieldUpdated}
                  />
                  <IdentifierSection
                    paper={paper}
                    isFieldUpdated={isFieldUpdated}
                  />
                </div>

                <SystemMetadataCollapse
                  paper={paper}
                  extras={infoSummary ?? undefined}
                />

                {paper.extraction?.status === "failed" &&
                  paper.extraction.requested && (
                    <div className="rounded-xl border border-warning/20 bg-warning/10 px-6 py-4 shadow-none" role="alert">
                      <div className="flex items-start gap-3">
                        <FiAlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
                        <div>
                          <p className="text-sm font-bold text-warning">
                            Extraction Failed
                          </p>
                          <p className="mt-1 text-xs text-text-primary">
                            PDF uploaded, but AI could not extract metadata
                            automatically.
                          </p>
                          {finalOnRetryExtraction && isLeader && (
                            <button
                              type="button"
                              onClick={() => finalOnRetryExtraction(paper.id)}
                              disabled={finalIsRetryingExtraction}
                              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-warning/25 bg-surface-white px-4 text-xs font-bold text-warning transition-colors hover:bg-warning/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/40 motion-reduce:transition-none disabled:opacity-50"
                            >
                              <FiRefreshCw
                                aria-hidden="true"
                                className={cn(
                                  "w-3.5 h-3.5",
                                  finalIsRetryingExtraction && "motion-safe:animate-spin motion-reduce:animate-none",
                                )}
                              />
                              {finalIsRetryingExtraction
                                ? "Retrying..."
                                : "Retry Extraction"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}

            {activeTab === "references" && (
              <div className="bg-surface-white rounded-xl border border-border p-6 shadow-none">
                <h2 className="text-sm font-black text-text-primary uppercase tracking-tight mb-4">
                  Cited References
                </h2>
                <PaperNodeList
                  nodes={displayedReferences}
                  isLoading={displayedReferencesLoading}
                  emptyLabel="No references found."
                />
              </div>
            )}

            {activeTab === "citations" && (
              <div className="bg-surface-white rounded-xl border border-border p-6 shadow-none">
                <h2 className="text-sm font-black text-text-primary uppercase tracking-tight mb-4">
                  Citing Papers
                </h2>
                <PaperNodeList
                  nodes={citations}
                  isLoading={isDiscoveryLoading}
                  emptyLabel="No citations found."
                />
              </div>
            )}

            {activeTab === "graph" && (
              <GraphSection
                citationGraph={citationGraph}
                isDiscoveryLoading={isDiscoveryLoading}
                graphDepth={graphDepth}
                setGraphDepth={setGraphDepth}
                minConfidence={minConfidence}
                setMinConfidence={setMinConfidence}
                setOpenGraph={setOpenGraph}
              />
            )}

            {activeTab === "fulltext" && (
              <div className="flex h-[min(82vh,900px)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-surface-white shadow-sm">
                {!paper.pdfUrl && <div className="flex items-center border-b border-border bg-bg-secondary/50 px-4 py-3">
                  <h2 className="text-xs font-black text-text-primary uppercase tracking-tight">
                    Full-Text Access
                  </h2>
                </div>}

                {paper.pdfUrl ? (
                  <div className="min-h-0 flex-1">
                      <PdfJsViewer
                        fileUrl={paper.pdfUrl}
                        documentTitle={paper.title}
                        coordinateStr={activeSectionCoords}
                        sections={paper.fullTextSections}
                        activeSection={activeSection}
                        onSectionSelect={handleSectionClick}
                        scale={1.25}
                      />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 bg-bg-secondary/30">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-surface-white text-text-secondary shadow-none">
                      <FiFileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">
                      No PDF attached yet
                    </h3>
                    <p className="text-sm text-text-secondary max-w-sm text-center mb-8 leading-relaxed">
                      To enable full-text screening and AI-powered metadata
                      extraction, please upload the PDF version of this paper.
                    </p>
                    {isLeader && !isDisabled && (
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-none transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 motion-reduce:active:scale-100 motion-reduce:transition-none"
                      >
                        <FiUploadCloud className="w-4 h-4" />
                        Upload Full-Text PDF
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* {(paper.hasConflict || (paper.screeningStatus === "conflicted" && !isLeaderView)) && (
            <ConflictDetails paper={paper as any} />
          )} */}
          {!isLeaderView && paper.resolution && (
            <ResolutionDetails resolution={paper.resolution} />
          )}
        </div>
      </div>

      {!hideActions && isLeaderView && (
        <div
          aria-hidden={isReviewerProgressCollapsed}
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none",
            isReviewerProgressCollapsed
              ? "pointer-events-none grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100",
          )}
        >
        <div className="min-h-0 overflow-hidden">
        <div className="border-t border-border bg-white px-4 py-3 lg:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                Reviewer progress
              </span>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs font-semibold text-text-primary">
                  {isLoadingReviewers
                    ? "Checking submissions…"
                    : `${submittedReviewCount} of ${totalReviewCount} human reviews submitted`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsReviewerProgressCollapsed(true)}
                  aria-expanded={!isReviewerProgressCollapsed}
                  aria-label="Hide reviewer progress"
                  title="Hide reviewer progress"
                  tabIndex={isReviewerProgressCollapsed ? -1 : 0}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
                >
                  <FiChevronUp className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div
              className="space-y-2.5"
            >
            <div className="flex flex-wrap gap-2">
              {reviewerDecisions?.map((item) => {
                const decisionText = item.decision?.decisionText;
                const decisionTone = decisionText?.toLowerCase().includes("include")
                  ? "border-success/20 bg-success/10 text-success"
                  : decisionText?.toLowerCase().includes("exclude")
                    ? "border-error/20 bg-error/10 text-error"
                    : "border-border bg-bg-secondary text-text-secondary";
                return (
                  <span
                    key={item.reviewerId}
                    title={decisionText || "Waiting for reviewer"}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium",
                      decisionTone,
                    )}
                  >
                    {item.reviewerName}: {decisionText || "Pending"}
                  </span>
                );
              })}
              {!isLoadingReviewers && !reviewerDecisions?.length && (
                <span className="text-xs text-text-secondary">No human reviewers are assigned to this paper.</span>
              )}
            </div>
            {reviewerDecisions?.some((item) => item.decision?.comment ?? item.decision?.reason) && (
              <div className="mt-2 space-y-1.5">
                {reviewerDecisions.map((item) => {
                  const comment = item.decision?.comment ?? item.decision?.reason;
                  return comment ? (
                    <p key={`${item.reviewerId}-comment`} className="text-xs text-text-secondary">
                      <span className="font-semibold">{item.reviewerName} comment:</span>{" "}
                      {comment}
                    </p>
                  ) : null;
                })}
              </div>
            )}
            </div>
            {!paper.hasConflict && !isLoadingReviewers && reviewerDecisions?.length ? (
              <p className="text-xs text-text-secondary">
                {hasPendingReview
                  ? "Waiting for the remaining reviewer submissions."
                  : "All reviewer submissions are complete."}
              </p>
            ) : null}
          </div>
        </div>
        </div>
        </div>
      )}

      {/* Decision Action Bar */}
      {!hideActions && (
        <div
          aria-hidden={isLeaderView && isReviewerProgressCollapsed && !onInclude && !onExclude}
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none",
            isLeaderView && isReviewerProgressCollapsed && !onInclude && !onExclude
              ? "pointer-events-none grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100",
          )}
        >
        <div className="min-h-0 overflow-hidden">
        <div className="border-t border-border bg-white/95 px-4 py-3 backdrop-blur-md lg:px-6">
          <div className="mx-auto max-w-5xl">
            {(!isLeaderView && canReview) ||
            (isLeaderView && (onInclude || onExclude)) ? (
              <div className="flex flex-col gap-2">
                {exclusionReasons.length === 0 && !isLoadingReasons && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-xs font-medium text-warning motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-reduce:animate-none">
                    <FiAlertTriangle className="w-4 h-4" />
                    {isLeaderView
                      ? "Add exclusion codes in Review Context → Criteria to enable Exclude."
                      : "Waiting for the project leader to define exclusion codes."}
                  </div>
                )}
                {hasPendingAssignedReviewer && isLeaderView && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border border-accent/20 rounded-xl text-accent text-xs font-bold motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-reduce:animate-none">
                    <FiAlertTriangle className="w-4 h-4" />
                    Wait for assigned reviewers finished reviews to make
                    decision
                  </div>
                )}
                {isLoadingReviewers && isLeaderView && (
                  <div role="status" className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-text-secondary text-xs font-bold">
                    <LoadingSpinner size="sm" />
                    Checking assignments...
                  </div>
                )}
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2",
                    paper.hasConflict && isLeaderView && "w-full justify-between",
                  )}
                >
                  {paper.hasConflict && isLeaderView ? (
                    <p className="min-w-[220px] flex-1 text-sm leading-5 text-text-secondary">
                      Reviewer decisions differ. Review the submissions and record the final screening decision.
                    </p>
                  ) : (
                    <ReviewCommentField
                      value={reviewComment}
                      onChange={setReviewComment}
                      disabled={
                        isDisabled ||
                        isSubmittingDecision ||
                        isSubmitting ||
                        (isLeaderView && hasPendingAssignedReviewer) ||
                        isLoadingReviewers
                      }
                    />
                  )}
                  <div
                    className={cn(
                      "flex shrink-0 items-center gap-2",
                      paper.hasConflict && isLeaderView && "ml-auto",
                    )}
                  >
                    {paper.hasConflict && isLeaderView ? (
                      <button
                        onClick={() =>
                          !isDisabled && setIsResolutionModalOpen(true)
                        }
                        disabled={isDisabled}
                        className={cn(
                          "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-sm font-semibold text-warning transition-colors hover:bg-warning/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/30",
                          isDisabled && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <FiAlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        Resolve Conflict
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            onInclude
                              ? onInclude(paper.id, reviewComment.trim() || null)
                              : includePaper(paper.id, reviewComment.trim() || null)
                          }
                          disabled={
                            isDisabled ||
                            isSubmittingDecision ||
                            isSubmitting ||
                            (isLeaderView && hasPendingAssignedReviewer) ||
                            isLoadingReviewers
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-white px-3 text-xs font-semibold text-text-primary transition-colors hover:border-success/30 hover:bg-success/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                        >
                          <FiCheck className="h-3.5 w-3.5 text-success" />
                          {phase === PaperPhase.TitleAbstract ? "Advance to Full Text" : "Include in review"}
                          <kbd className="ml-0.5 rounded border border-border bg-bg-secondary px-1 py-0.5 text-[10px] font-medium text-text-secondary">
                            1
                          </kbd>
                        </button>

                        <ExcludeMenu
                          paperId={paper.id}
                          onExclude={onExclude || excludePaper}
                          isSubmitting={
                            isDisabled ||
                            isSubmittingDecision ||
                            isSubmitting ||
                            (isLeaderView && hasPendingAssignedReviewer) ||
                            isLoadingReviewers
                          }
                          exclusionReasons={exclusionReasons}
                          hasMoreReasons={hasMoreReasons}
                          onShowMoreReasons={() =>
                            setReasonPageSize((prev) => prev + 5)
                          }
                          onResetReasons={() => setReasonPageSize(5)}
                          isDisabled={isDisabled}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <DecisionStatus paper={paper} phase={phase} />
            )}
          </div>
        </div>
        </div>
        </div>
      )}

      {!hideActions && isLeaderView && (
        <button
          type="button"
          onClick={() => setIsReviewerProgressCollapsed(false)}
          aria-hidden={!isReviewerProgressCollapsed}
          tabIndex={isReviewerProgressCollapsed ? 0 : -1}
          aria-label="Show reviewer progress and status"
          title="Show reviewer progress and status"
          className={cn(
            "absolute bottom-3 right-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-white/95 text-text-secondary shadow-sm transition-[opacity,transform,color,background-color] duration-300 ease-out hover:bg-surface-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none",
            isReviewerProgressCollapsed
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-2 scale-90 opacity-0",
          )}
        >
          <FiChevronUp className="h-4 w-4" />
        </button>
      )}

      {isResolutionModalOpen && (
        <ConflictResolutionModal
          isOpen={isResolutionModalOpen}
          onClose={() => setIsResolutionModalOpen(false)}
          paperId={paper.id}
          processId={screeningProcessId || ""}
          phase={phase}
        />
      )}
      {isUploadModalOpen && paper && (
        <UploadFullTextPdfModal
          isOpen={isUploadModalOpen}
          isUploading={isUploadingPdf || false}
          paper={{
            title: paper.title,
            authors: paper.authors ?? "",
            doi: paper.doi ?? "",
            abstract: paper.abstract ?? "",
            journal: paper.journal ?? "",
          }}
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={async (file, options) => {
            if (uploadPaperPdf) {
              await uploadPaperPdf(paper.id, file, options);
              setIsUploadModalOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}
