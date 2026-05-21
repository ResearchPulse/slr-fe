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
  FiLoader,
  FiUploadCloud,
} from "react-icons/fi";
import toast from "react-hot-toast";
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
  const { projectId, paperId } = useParams<{ projectId: string; paperId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("abstract");
  const [openGraph, setOpenGraph] = useState(false);
  const [graphDepth, setGraphDepth] = useState(1);
  const [minConfidence, setMinConfidence] = useState(0.1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { member } = useProjectMember(projectId || "");
  const isLeader = member?.isLeader ?? false;

  const { data: paper, isLoading: isPaperLoading, error: paperError } = usePaperDetails(paperId);

  // Discovery Hooks
  const { data: references = [], isLoading: isReferencesLoading } = usePaperReferences(paperId);
  const { data: citations = [], isLoading: isCitationsLoading } = usePaperCitations(paperId);
  const { data: citationGraph, isLoading: isGraphLoading } = usePaperGraph(paperId, {
    depth: graphDepth,
    minConfidence,
  });

  const [sidebarWidth, setSidebarWidth] = useState(200);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [activeSection, setActiveSection] = useState<any>(null);

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

  const isDiscoveryLoading = isReferencesLoading || isCitationsLoading || isGraphLoading;

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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.papers.detail(paperId!) });
      toast.success("PDF uploaded successfully.");
      setIsUploadModalOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to upload PDF. Please try again.");
    },
  });

  // Adapt PaperDetailsResponse to include calculated discovery counts
  const adaptedPaper = useMemo(() => {
    if (!paper) return null;
    return {
      ...paper,
      referenceCount: references?.length || 0,
      citationCount: citations?.length || 0,
    };
  }, [paper, references, citations]);

  const isFieldUpdated = () => false; // No suggestions view in this standalone page for now

  if (isPaperLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <FiLoader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading paper details...</p>
      </div>
    );
  }

  if (paperError || !paper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 px-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6 border border-red-100">
          <FiFileText className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Paper Not Found</h1>
        <p className="text-slate-500 max-w-md mb-8">
          The paper you are looking for might have been removed or you don't have permission to view
          it.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
        >
          <FiArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Header / Navigation */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className=" flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
              title="Back"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Paper Details
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all"
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
              paper={adaptedPaper as any}
              isLeaderView={true} // Hide status badge for general view
              isFieldUpdated={isFieldUpdated}
            />
          )}

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
                <ContentSection paper={paper as any} isFieldUpdated={isFieldUpdated} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PublicationInfoCard paper={paper as any} isFieldUpdated={isFieldUpdated} />
                  <IdentifierSection paper={paper as any} isFieldUpdated={isFieldUpdated} />
                </div>

                <SystemMetadataCollapse paper={paper as any} />
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
                      {paper.pdfUrl ? (
                        <PdfJsViewer
                          fileUrl={paper.pdfUrl}
                          coordinateStr={activeSectionCoords}
                          scale={1.5}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-400 p-8 text-center">
                          <FiUploadCloud className="w-12 h-12 mb-4 opacity-20" />
                          <p className="font-bold text-lg">No PDF Available</p>
                          <p className="text-sm max-w-xs mt-2">
                            Full-text content was not found or could not be extracted for this
                            paper.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/30">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 text-slate-300 border border-slate-100">
                      <FiFileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No PDF attached yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm text-center mb-8 leading-relaxed">
                      PDF is not available for this paper.
                    </p>
                    {isLeader && (
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
