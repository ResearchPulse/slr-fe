import React, { useState, useRef, useCallback, useMemo } from "react";
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
  FiLoader,
  FiUploadCloud,
} from "react-icons/fi";
import { cn } from "../../../utils/cn";
import { useProjectMember } from "../../../hooks/useProjectMember";

import { usePaperViewerState } from "./PaperViewer/hooks/usePaperViewerState";
import {
  PaperHeroHeader,
  ContentSection,
  PublicationInfoCard,
  IdentifierSection,
  SystemMetadataCollapse,
  TabButton,
  DecisionStatus,
  ResolutionDetails,
  GraphSection,
  PaperNodeList,
  PaperSectionSidebar,
} from "./PaperViewer/components";
import PdfJsViewer from "./PdfJsViewer/PdfJsViewer";
import CitationGraphModal from "../../../pages/reviewProcess/studySelection/titleAbstractScreening/components/graph/CitationGraphModal";
import ExcludeMenu from "../../../pages/reviewProcess/studySelection/components/ExcludeMenu";
import type { PaperViewerProps } from "./PaperViewer/types";
import { PaperPhase } from "../../../types/studySelection";
import { useReviewerDecisions } from "../../../hooks/useStudySelection";
import ConflictResolutionModal from "../../reviewProcess/leader/ConflictResolutionModal";
import UploadFullTextPdfModal from "../../../pages/reviewProcess/studySelection/components/UploadFullTextPdfModal";

export default function PaperViewer({
  paper,
  onInclude,
  onExclude,
  isSubmitting = false,
  onRetryExtraction,
  isRetryingExtraction = false,
  hideActions = false,
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
  } = usePaperViewerState(paper);

  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const activeProjectId = projectId || id;

  const { member } = useProjectMember(activeProjectId || "");
  const isLeader = member?.isLeader ?? false;

  const navigate = useNavigate();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const finalOnRetryExtraction = onRetryExtraction || retryMetadataExtraction;
  const finalIsRetryingExtraction = isRetryingExtraction || isHookRetryingExtraction;

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (sidebarRef.current) {
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        const newWidth = moveEvent.clientX - sidebarRect.left;
        if (newWidth >= 160 && newWidth <= 450) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
  }, []);

  const handleSectionClick = (sectionKey: string) => {
    setActiveSection(sectionKey);
  };

  const activeSectionCoords = useMemo(() => {
    if (!activeSection) return null;
    const section = paper?.fullTextSections?.find((s) => s.sectionTitle === activeSection);
    return section?.coordinates || null;
  }, [activeSection, paper]);

  const { data: reviewerDecisions, isLoading: isLoadingReviewers } = useReviewerDecisions(
    screeningProcessId,
    paper?.id,
    phase,
  );

  const hasPendingAssignedReviewer = !!reviewerDecisions?.some((rd) => !rd.decision);

  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  console.log("paper sections ", paper?.fullTextSections);
  if (!paper) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center px-8">
        <FiFileText className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-500">No Paper Selected</h3>
        <p className="text-sm text-gray-400 mt-2">
          Select a paper from the queue to start reviewing
        </p>
      </div>
    );
  }

  // const hasPendingAssignedReviewer = !!paper.assignedReviewers?.some((r) => !r.decision);

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={cn("px-6 py-8 space-y-6 transition-all duration-300")}>
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
              onClick={() => navigate(`/projects/${activeProjectId}/papers/${paper.id}`)}
              className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-slate-50/80 backdrop-blur-md border border-slate-200 rounded-2xl text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm opacity-0 group-hover/hero:opacity-100 transform translate-y-2 group-hover/hero:translate-y-0"
            >
              Full Details
              <FiExternalLink className="w-3.5 h-3.5" />
            </button>
            <PaperHeroHeader
              paper={paper}
              isLeaderView={isLeaderView}
              isFieldUpdated={isFieldUpdated}
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
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
              count={references.length}
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
          <div className="space-y-6 animate-in fade-in duration-300">
            {activeTab === "abstract" && (
              <>
                <ContentSection paper={paper as any} isFieldUpdated={isFieldUpdated} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PublicationInfoCard paper={paper} isFieldUpdated={isFieldUpdated} />
                  <IdentifierSection paper={paper} isFieldUpdated={isFieldUpdated} />
                </div>

                <SystemMetadataCollapse paper={paper} />

                {paper.extraction?.status === "failed" && paper.extraction.requested && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <FiAlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Extraction Failed</p>
                        <p className="text-xs text-amber-800 mt-1">
                          PDF uploaded, but AI could not extract metadata automatically.
                        </p>
                        {finalOnRetryExtraction && isLeader && (
                          <button
                            onClick={() => finalOnRetryExtraction(paper.id)}
                            disabled={finalIsRetryingExtraction}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white border border-amber-200 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <FiRefreshCw
                              className={cn(
                                "w-3.5 h-3.5",
                                finalIsRetryingExtraction && "animate-spin",
                              )}
                            />
                            {finalIsRetryingExtraction ? "Retrying..." : "Retry Extraction"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "references" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">
                  Cited References
                </h2>
                <PaperNodeList
                  nodes={references}
                  isLoading={isDiscoveryLoading}
                  emptyLabel="No references found."
                />
              </div>
            )}

            {activeTab === "citations" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">
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
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[800px] flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                    {paper.pdfUrl ? "PDF Viewer" : "Full-Text Access"}
                  </h2>
                  {paper.pdfUrl && (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                    >
                      Open in New Tab
                      <FiExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {paper.pdfUrl ? (
                  <div className="flex-1 flex min-h-0 relative">
                    {/* Dynamic Section Sidebar Integration */}
                    <div ref={sidebarRef}>
                      <PaperSectionSidebar
                        sections={paper.fullTextSections ?? null}
                        activeSection={activeSection}
                        onSectionClick={handleSectionClick}
                        width={sidebarWidth}
                      />
                    </div>

                    {/* Resizable Divider */}
                    <div
                      onMouseDown={handleMouseDown}
                      className={cn(
                        "w-1 hover:w-1.5 bg-slate-100 hover:bg-blue-400 cursor-col-resize transition-all duration-200 z-10 relative group",
                        isResizing && "bg-blue-500 w-1.5",
                      )}
                    >
                      <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
                    </div>

                    <div
                      className={cn(
                        "flex-1 relative bg-slate-100 transition-opacity",
                        isResizing && "pointer-events-none opacity-80",
                      )}
                    >
                      <PdfJsViewer
                        fileUrl={paper.pdfUrl}
                        coordinateStr={activeSectionCoords}
                        scale={1.5}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/30">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 text-slate-300 border border-slate-100">
                      <FiFileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No PDF attached yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm text-center mb-8 leading-relaxed">
                      To enable full-text screening and AI-powered metadata extraction, please
                      upload the PDF version of this paper.
                    </p>
                    {isLeader && !isDisabled && (
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
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
          {!isLeaderView && paper.resolution && <ResolutionDetails resolution={paper.resolution} />}
        </div>
      </div>

      {/* Decision Action Bar */}
      {!hideActions && (
        <div className="border-t border-slate-200 bg-white/80 backdrop-blur-md px-8 py-4 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto">
            {(!isLeaderView && canReview) || (isLeaderView && (onInclude || onExclude)) ? (
              <div className="flex flex-col gap-4">
                {exclusionReasons.length === 0 && !isLoadingReasons && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs font-bold animate-pulse">
                    <FiAlertTriangle className="w-4 h-4" />
                    Waiting for leader to define exclusion codes...
                  </div>
                )}
                {hasPendingAssignedReviewer && isLeaderView && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
                    <FiAlertTriangle className="w-4 h-4" />
                    Wait for assigned reviewers finished reviews to make decision
                  </div>
                )}
                {isLoadingReviewers && isLeaderView && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs font-bold animate-pulse">
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Checking assignments...
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {paper.hasConflict && isLeaderView ? (
                    <button
                      onClick={() => !isDisabled && setIsResolutionModalOpen(true)}
                      disabled={isDisabled}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-2 h-12 bg-amber-600 text-white font-black uppercase tracking-wider text-xs rounded-2xl hover:bg-amber-700 active:scale-[0.98] transition-all shadow-lg shadow-amber-900/10 animate-in zoom-in-95 duration-200",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <FiAlertTriangle className="w-4 h-4" />
                      Resolve Conflict
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => (onInclude ? onInclude(paper.id) : includePaper(paper.id))}
                        disabled={
                          isDisabled ||
                          isSubmittingDecision ||
                          isSubmitting ||
                          (isLeaderView && hasPendingAssignedReviewer) ||
                          isLoadingReviewers
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 h-12 bg-emerald-600 text-white font-black uppercase tracking-wider text-xs rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-50"
                      >
                        <FiCheck className="w-4 h-4" />
                        Include{" "}
                        <kbd className="ml-2 px-1.5 py-0.5 bg-emerald-500/50 rounded font-mono">
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
                        onShowMoreReasons={() => setReasonPageSize((prev) => prev + 5)}
                        onResetReasons={() => setReasonPageSize(5)}
                        isDisabled={isDisabled}
                      />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <DecisionStatus paper={paper} />
            )}
          </div>
        </div>
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
