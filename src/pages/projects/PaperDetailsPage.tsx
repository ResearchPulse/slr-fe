import { useState, useMemo } from "react";
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
  FiZap,
} from "react-icons/fi";
import { toastError, toastSuccess } from "../../utils/toast";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import Button from "../../components/ui/Button";
import type { ScreeningPaper } from "../reviewProcess/studySelection/titleAbstractScreening/types";
import { usePaperDetails } from "../../hooks/usePaperDetails";
import {
  usePaperCitations,
  usePaperGraph,
} from "../../hooks/usePaperDiscovery";
import { usePaperSpecificCandidates } from "../../hooks/useSnowballCandidates";
import type { PaperNodeDto } from "../../types/studySelection";

import { cn } from "../../utils/cn";
import {
  PaperHeroHeader,
  PaperInfoSummary,
  ContentSection,
  PublicationInfoCard,
  IdentifierSection,
  SystemMetadataCollapse,
  TabButton,
  GraphSection,
  PaperNodeList,
} from "../../components/shared/paper/PaperViewer/components";
import PdfJsViewer from "../../components/shared/paper/PdfJsViewer/PdfJsViewer";
import CitationGraphModal from "../reviewProcess/studySelection/titleAbstractScreening/components/graph/CitationGraphModal";
import UploadFullTextPdfModal from "../reviewProcess/studySelection/components/UploadFullTextPdfModal";
import { useProjectMember } from "../../hooks/useProjectMember";
import { usePaperActions } from "../../hooks/usePaperActions";
import MetadataSuggestionModal from "../reviewProcess/studySelection/components/MetadataSuggestionModal";

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
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { member } = useProjectMember(projectId || "");
  const isLeader = member?.isLeader ?? false;
  const {
    applyMetadataSuggestion,
    isApplyingMetadataSuggestion,
  } = usePaperActions();

  const {
    data: paper,
    isLoading: isPaperLoading,
    error: paperError,
  } = usePaperDetails(paperId);

  // Discovery Hooks
  const { data: candidateResponse, isLoading: isLoadingCandidates } =
    usePaperSpecificCandidates(paperId || "", { pageNumber: 1, pageSize: 100 });
  const snowballingReferences = useMemo<PaperNodeDto[]>(
    () =>
      (candidateResponse?.items ?? []).map((candidate) => ({
        id: candidate.candidateId,
        title: candidate.title || candidate.rawReference || "Untitled reference",
        year: candidate.publicationYear
          ? Number.parseInt(candidate.publicationYear, 10) || null
          : null,
        authors: candidate.authors || null,
        doi: candidate.doi || null,
        citationCount: 0,
      })),
    [candidateResponse?.items],
  );
  const { data: citations = [], isLoading: isCitationsLoading } =
    usePaperCitations(paperId);
  const { data: citationGraph, isLoading: isGraphLoading } = usePaperGraph(
    paperId,
    {
      depth: graphDepth,
      minConfidence,
    },
  );

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

  const isDiscoveryLoading = isCitationsLoading || isGraphLoading;

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

  const handleApplySuggestion = async (selectedFields: string[]) => {
    if (!paper?.extractionSuggestion || !paperId) return;
    await applyMetadataSuggestion(
      paperId,
      paper.extractionSuggestion.sourceMetadataId,
      selectedFields,
    );
    setIsSuggestionModalOpen(false);
  };

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
      referenceCount: candidateResponse?.totalCount ?? snowballingReferences.length,
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
  }, [paper, candidateResponse?.totalCount, snowballingReferences.length, citations]);

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
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-xl border border-error/20 bg-surface-white text-error">
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
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-white px-6 py-3 font-bold text-text-primary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
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
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
              title="Back"
              aria-label="Back to previous page"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Paper Details
              </h2>
              <p className="max-w-[min(70vw,64rem)] truncate text-xs text-text-secondary">
                {paper?.title || "Viewing detailed paper information"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {paper.url && (
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-white px-4 py-2 text-xs font-bold text-text-primary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
              >
                Source Link
                <FiExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {paper.extractionSuggestion && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/15 bg-primary-light px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary">
              <FiZap className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-text-primary">
              AI metadata suggestions available
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsSuggestionModalOpen(true)}
            className="min-h-9 rounded-lg px-3 text-xs"
          >
            Review suggestions
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn("space-y-2 px-4 py-3 sm:px-6")}>
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
          <div className="grid grid-cols-2 [grid-template-columns:repeat(2,minmax(0,1fr))] gap-1 rounded-xl border border-border bg-surface-white p-1 shadow-none md:flex md:items-center">
            <TabButton
              active={activeTab === "abstract"}
              onClick={() => setActiveTab("abstract")}
              icon={<FiFileText className="w-4 h-4" />}
              label="Overview"
              className="min-w-0 gap-1 px-2 text-[10px] tracking-normal md:gap-2 md:px-4 md:text-[11px] md:tracking-widest"
            />
            <TabButton
              active={activeTab === "references"}
              onClick={() => setActiveTab("references")}
              icon={<FiList className="w-4 h-4" />}
              label="References"
              count={candidateResponse?.totalCount ?? snowballingReferences.length}
              className="min-w-0 gap-1 px-2 text-[10px] tracking-normal md:gap-2 md:px-4 md:text-[11px] md:tracking-widest"
            />
            <TabButton
              active={activeTab === "citations"}
              onClick={() => setActiveTab("citations")}
              icon={<FiShare2 className="w-4 h-4" />}
              label="Citations"
              count={citations?.length}
              className="min-w-0 gap-1 px-2 text-[10px] tracking-normal md:gap-2 md:px-4 md:text-[11px] md:tracking-widest"
            />
            <TabButton
              active={activeTab === "graph"}
              onClick={() => setActiveTab("graph")}
              icon={<FiGitBranch className="w-4 h-4" />}
              label="Network"
              className="min-w-0 gap-1 px-2 text-[10px] tracking-normal md:gap-2 md:px-4 md:text-[11px] md:tracking-widest"
            />
            <TabButton
              active={activeTab === "fulltext"}
              onClick={() => setActiveTab("fulltext")}
              icon={<FiFileText className="w-4 h-4" />}
              label="Full Text"
              className="min-w-0 gap-1 px-2 text-[10px] tracking-normal md:gap-2 md:px-4 md:text-[11px] md:tracking-widest"
            />
          </div>

          {/* 2. Tab Content */}
          <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-reduce:animate-none">
            {activeTab === "abstract" && (
              <>
                {adaptedPaper && <PaperInfoSummary paper={adaptedPaper} />}
                <ContentSection
                  paper={paper}
                  isFieldUpdated={isFieldUpdated}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <PublicationInfoCard
                    paper={adaptedPaper!}
                    isFieldUpdated={isFieldUpdated}
                  />
                  <IdentifierSection
                    paper={adaptedPaper!}
                    isFieldUpdated={isFieldUpdated}
                  />
                </div>

                <SystemMetadataCollapse
                  paper={adaptedPaper!}
                  extras={{
                    importedAt: paper.importedAt ?? null,
                    createdAt: paper.createdAt ?? null,
                    modifiedAt: paper.modifiedAt ?? paper.updatedAt ?? null,
                    pdfFileName: paper.pdfFileName ?? paper.pdf?.fileName ?? null,
                    pdfSizeBytes: paper.pdf?.sizeBytes ?? null,
                    pdfUrl: paper.pdfUrl ?? null,
                    pdfProcessingStatus: paper.pdf?.processingStatus ?? null,
                    fullTextStatus: paper.pdf?.fullText?.status ?? null,
                    extractionError: paper.pdf?.processingError?.message ?? null,
                    sectionCount: paper.pdf?.fullText?.sectionCount ?? null,
                    referenceCount: paper.pdf?.fullText?.referenceCount ?? null,
                    figureCount: paper.pdf?.fullText?.figureCount ?? null,
                  }}
                />
              </>
            )}

            {activeTab === "references" && (
              <div className="bg-surface-white rounded-xl border border-border p-6 shadow-none">
                <h2 className="text-sm font-black text-text-primary uppercase tracking-tight mb-4">
                  Cited References
                </h2>
                <PaperNodeList
                  nodes={snowballingReferences}
                  isLoading={isLoadingCandidates}
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
                  <div className="flex flex-1 flex-col items-center justify-center bg-bg-secondary/30 p-12">
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

      {paper.extractionSuggestion && (
        <MetadataSuggestionModal
          isOpen={isSuggestionModalOpen}
          isApplying={isApplyingMetadataSuggestion}
          currentMetadata={{
            title: paper.title,
            authors: paper.authors ?? "",
            abstract: paper.abstract ?? "",
            doi: paper.doi ?? "",
            journal: paper.journal ?? "",
            volume: paper.volume ?? "",
            issue: paper.issue ?? "",
            pages: paper.pages ?? "",
            keywords: paper.keywords ?? "",
            year: paper.publicationYear?.toString(),
            publishedDate: paper.publicationDate ?? "",
            issn: paper.journalIssn ?? "",
            eissn: paper.journalEIssn ?? "",
            language: paper.language ?? "",
            md5: paper.md5 ?? "",
            publisher: paper.publisher,
          }}
          suggestion={paper.extractionSuggestion as any}
          onApply={handleApplySuggestion}
          onClose={() => setIsSuggestionModalOpen(false)}
        />
      )}
    </div>
  );
}
