import React, { useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studySelectionService } from "../../services/studySelectionService";
import { QUERY_KEYS } from "../../constants/queryKeys";

import {
  FiArrowLeft,
  FiFileText,
  FiList,
  FiShare2,
  FiGitBranch,
  FiExternalLink,
  FiUploadCloud,
} from "react-icons/fi";
import { toastError, toastSuccess } from "../../utils/toast";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import Button from "../../components/ui/Button";
import type { ScreeningPaper } from "../reviewProcess/studySelection/titleAbstractScreening/types";
import { usePaperDetails } from "../../hooks/usePaperDetails";
import {
  usePaperReferences,
  usePaperCitations,
  usePaperGraph,
} from "../../hooks/usePaperDiscovery";

import { cn } from "../../utils/cn";
import {
  PaperHeroHeader,
  ContentSection,
  PublicationInfoCard,
  IdentifierSection,
  SystemMetadataCollapse,
  TabButton,
  GraphSection,
  PaperNodeList,
  PaperSectionSidebar,
} from "../../components/shared/paper/PaperViewer/components";
import PdfJsViewer from "../../components/shared/paper/PdfJsViewer/PdfJsViewer";
import CitationGraphModal from "../reviewProcess/studySelection/titleAbstractScreening/components/graph/CitationGraphModal";
import UploadFullTextPdfModal from "../reviewProcess/studySelection/components/UploadFullTextPdfModal";
import { useProjectMember } from "../../hooks/useProjectMember";

export default function PaperDetailsPage() {
  const { projectId, paperId } = useParams<{
    projectId: string;
    paperId: string;
  }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("abstract");
  const [openGraph, setOpenGraph] = useState(false);
  const [graphDepth, setGraphDepth] = useState(1);
  const [minConfidence, setMinConfidence] = useState(0.1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { member } = useProjectMember(projectId || "");
  const isLeader = member?.isLeader ?? false;

  const {
    data: paper,
    isLoading: isPaperLoading,
    error: paperError,
  } = usePaperDetails(paperId);

  // Discovery Hooks
  const { data: references = [], isLoading: isReferencesLoading } =
    usePaperReferences(paperId);
  const { data: citations = [], isLoading: isCitationsLoading } =
    usePaperCitations(paperId);
  const { data: citationGraph, isLoading: isGraphLoading } = usePaperGraph(
    paperId,
    {
      depth: graphDepth,
      minConfidence,
    },
  );

  const [sidebarWidth, setSidebarWidth] = useState(200);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
    const section = paper?.fullTextSections?.find(
      (s) => s.sectionTitle === activeSection,
    );
    return section?.coordinates || null;
  }, [activeSection, paper]);

  const isDiscoveryLoading =
    isReferencesLoading || isCitationsLoading || isGraphLoading;

  // ---- Mutation: Upload Full-Text PDF ----
  const uploadMutation = useMutation({
    mutationFn: async (vars: { file: File; extractWithGrobid?: boolean }) => {
      if (!projectId || !paperId) return;
      return studySelectionService.uploadPaperFullText({
        file: vars.file,
        projectId,
        paperId,
        extractWithGrobid: vars.extractWithGrobid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.papers.detail(paperId!),
      });
      toastSuccess("PDF uploaded successfully.");
      setIsUploadModalOpen(false);
    },
    onError: (error) => {
      toastError(
        error instanceof Error
          ? error.message
          : "Failed to upload PDF. Please try again.",
      );
    },
  });

  // Adapt API metadata to the shared paper viewer model.
  const adaptedPaper = useMemo<ScreeningPaper | null>(() => {
    if (!paper) return null;
    const publicationYear = paper.publicationYearInt ??
      (paper.publicationYear ? Number.parseInt(paper.publicationYear, 10) : null);
    return {
      id: paper.id,
      title: paper.title,
      authors: paper.authors ?? null,
      doi: paper.doi ?? null,
      publicationYear: Number.isNaN(publicationYear) ? null : publicationYear,
      publicationDate: paper.publicationDate ?? null,
      abstract: paper.abstract ?? null,
      journal: paper.journal ?? null,
      source: paper.source ?? null,
      keywords: paper.keywords ?? null,
      publicationType: paper.publicationType ?? null,
      volume: paper.volume ?? null,
      issue: paper.issue ?? null,
      pages: paper.pages ?? null,
      publisher: paper.publisher ?? null,
      language: paper.language ?? null,
      url: paper.url ?? null,
      pdfUrl: paper.pdfUrl ?? null,
      pdfFileName: null,
      conferenceName: paper.conferenceName ?? null,
      conferenceLocation: paper.conferenceLocation ?? null,
      journalIssn: paper.journalIssn ?? null,
      journalEIssn: paper.journalEIssn ?? null,
      md5: paper.md5 ?? null,
      referenceCount: references?.length || 0,
      citationCount: citations?.length || 0,
      screeningStatus: "pending",
      finalDecision: null,
      finalDecisionText: null,
      decisions: [],
      extraction: null,
      metadataSources: null,
      extractionResult: null,
      extractionSuggestion: paper.extractionSuggestion ?? null,
      resolution: null,
      fullTextSections: paper.fullTextSections ?? null,
    };
  }, [paper, references, citations]);

  const isFieldUpdated = () => false; // No suggestions view in this standalone page for now

  if (isPaperLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-secondary/50">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-text-secondary font-medium">
          Loading paper details...
        </p>
      </div>
    );
  }

  if (paperError || !paper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-secondary/50 px-6 text-center">
        <div className="w-20 h-20 bg-surface-white rounded-xl flex items-center justify-center text-red-500 mb-6 border border-red-100">
          <FiFileText className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-text-primary mb-2">
          Paper Not Found
        </h1>
        <p className="text-text-secondary max-w-md mb-8">
          The paper you are looking for might have been removed or you don't
          have permission to view it.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-surface-white border border-border text-text-primary rounded-xl font-bold hover:bg-bg-secondary transition-all active:scale-95"
        >
          <FiArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-secondary/50">
      {/* Header / Navigation */}
      <div className="sticky top-0 z-30 bg-surface-white/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className=" flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 hover:bg-bg-secondary rounded-xl text-text-secondary transition-colors"
              title="Back"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Paper Details
              </h2>
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                Project ID: {projectId?.substring(0, 8)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {paper.url && (
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-white border border-border text-text-primary text-xs font-bold rounded-xl hover:bg-bg-secondary transition-all"
              >
                Source Link
                <FiExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
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
          {adaptedPaper && (
            <PaperHeroHeader
              paper={adaptedPaper!}
              isLeaderView={true} // Hide status badge for general view
              isFieldUpdated={isFieldUpdated}
            />
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-surface-white p-1 rounded-xl border border-border shadow-none">
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
              count={references?.length}
            />
            <TabButton
              active={activeTab === "citations"}
              onClick={() => setActiveTab("citations")}
              icon={<FiShare2 className="w-4 h-4" />}
              label="Citations"
              count={citations?.length}
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
                <ContentSection
                  paper={paper}
                  isFieldUpdated={isFieldUpdated}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PublicationInfoCard
                    paper={adaptedPaper!}
                    isFieldUpdated={isFieldUpdated}
                  />
                  <IdentifierSection
                    paper={adaptedPaper!}
                    isFieldUpdated={isFieldUpdated}
                  />
                </div>

                <SystemMetadataCollapse paper={adaptedPaper!} />
              </>
            )}

            {activeTab === "references" && (
              <div className="bg-surface-white rounded-xl border border-border p-6 shadow-none">
                <h2 className="text-sm font-black text-text-primary uppercase tracking-tight mb-4">
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
              <div className="bg-surface-white rounded-xl border border-border overflow-hidden shadow-none h-[800px] flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between bg-bg-secondary/50">
                  <h2 className="text-xs font-black text-text-primary uppercase tracking-tight">
                    {paper.pdfUrl ? "PDF Viewer" : "Full-Text Access"}
                  </h2>
                  {paper.pdfUrl && (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-primary-hover text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
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
                        "w-1 hover:w-1.5 bg-bg-secondary hover:bg-accent/60 cursor-col-resize transition-all duration-200 z-10 relative group",
                        isResizing && "bg-accent w-1.5",
                      )}
                    >
                      <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
                    </div>

                    <div
                      className={cn(
                        "flex-1 relative bg-bg-secondary transition-opacity",
                        isResizing && "pointer-events-none opacity-80",
                      )}
                    >
                      {paper.pdfUrl ? (
                        <PdfJsViewer
                          fileUrl={paper.pdfUrl}
                          coordinateStr={activeSectionCoords}
                          scale={1.5}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-bg-secondary text-text-secondary p-8 text-center">
                          <FiUploadCloud className="w-12 h-12 mb-4 opacity-20" />
                          <p className="font-bold text-lg">No PDF Available</p>
                          <p className="text-sm max-w-xs mt-2">
                            Full-text content was not found or could not be
                            extracted for this paper.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 bg-bg-secondary/30">
                    <div className="w-20 h-20 bg-surface-white rounded-xl shadow-none flex items-center justify-center mb-6 text-text-muted border border-border">
                      <FiFileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">
                      No PDF attached yet
                    </h3>
                    <p className="text-sm text-text-secondary max-w-sm text-center mb-8 leading-relaxed">
                      PDF is not available for this paper.
                    </p>
                    {isLeader && (
                      <Button
                        variant="primary"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="gap-2"
                      >
                        <FiUploadCloud className="w-4 h-4" />
                        Upload Full-Text PDF
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isUploadModalOpen && paper && (
        <UploadFullTextPdfModal
          isOpen={isUploadModalOpen}
          isUploading={false} // Standalone page doesn't track this easily without extra hooks
          paper={{
            title: paper.title,
            authors: paper.authors ?? "",
            doi: paper.doi ?? "",
            abstract: paper.abstract ?? "",
            journal: paper.journal ?? "",
          }}
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={async (file, options) => {
            await uploadMutation.mutateAsync({
              file,
              extractWithGrobid: options?.extractWithGrobid,
            });
          }}
        />
      )}
    </div>
  );
}
