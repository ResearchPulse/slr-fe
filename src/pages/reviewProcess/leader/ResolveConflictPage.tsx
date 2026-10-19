import React, { useState, useEffect } from "react";
import gsap from "gsap";
import {
  FileText,
  Layout,
  Settings,
  Search,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import ConflictResolutionModal from "../../../components/reviewProcess/leader/ConflictResolutionModal";
import { useParams } from "react-router-dom";
import { useConflictsByPhase } from "../../../hooks/useStudySelection";
import {
  PaperPhase,
  PaperSelectionStatus,
  type ConflictPaperItem,
} from "../../../types/studySelection";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import Pagination from "../../../components/ui/Pagination";
import { useDebounce } from "../../../hooks/useDebounce";

// Detailed mock data for the modal
// ... removed mock data ...

const ResolveConflictPage: React.FC = () => {
  const { screeningProcessId } = useParams<{ screeningProcessId: string }>();
  const [activeTab, setActiveTab] = useState<"title-abstract" | "full-text">(
    "title-abstract",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Conflict" | "Resolved"
  >("All");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

  // Fetch data using hook
  const phaseValue =
    activeTab === "title-abstract"
      ? PaperPhase.TitleAbstract
      : PaperPhase.FullText;
  const statusValue =
    statusFilter === "All"
      ? null
      : statusFilter === "Conflict"
        ? PaperSelectionStatus.Conflict
        : PaperSelectionStatus.Resolved;

  const { data: conflictsData, isLoading } = useConflictsByPhase(
    screeningProcessId,
    {
      phase: phaseValue,
      status: statusValue,
      search: debouncedSearch,
      pageNumber,
      pageSize,
    },
  );

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    gsap.from(".page-content", {
      opacity: 0,
      y: 6,
      duration: 0.18,
      ease: "power2.out",
    });
  }, []);

  // Reset page number when filters change
  useEffect(() => {
    setPageNumber(1);
  }, [activeTab, debouncedSearch, statusFilter]);

  const handleOpenDetailModal = (paper: ConflictPaperItem) => {
    setSelectedPaperId(paper.paperId);
    setIsModalOpen(true);
  };

  const papers = conflictsData?.items || [];
  const totalCount = conflictsData?.totalCount || 0;

  return (
    <div className="flex flex-col h-full overflow-hidden page-content p-6 max-w-7xl mx-auto">
      <div className="bg-surface-white rounded-xl shadow-none border border-border overflow-hidden flex flex-col flex-1 min-h-[500px]">
        {/* Tab Navigation */}
        <div className="bg-surface-white border-b border-border">
          <div className="flex px-4 sm:px-6">
            <button
              type="button"
              aria-pressed={activeTab === "title-abstract"}
              onClick={() => setActiveTab("title-abstract")}
              className={`inline-flex min-h-11 items-center border-b-2 px-5 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 motion-reduce:transition-none sm:px-8 ${
                activeTab === "title-abstract"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-secondary"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText
                  className={`w-4 h-4 ${activeTab === "title-abstract" ? "text-accent" : "text-text-secondary"}`}
                />
                TITLE/ABSTRACT SCREENING
              </div>
            </button>
            <button
              type="button"
              aria-pressed={activeTab === "full-text"}
              onClick={() => setActiveTab("full-text")}
              className={`inline-flex min-h-11 items-center border-b-2 px-5 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 motion-reduce:transition-none sm:px-8 ${
                activeTab === "full-text"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-secondary"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layout
                  className={`w-4 h-4 ${activeTab === "full-text" ? "text-accent" : "text-text-secondary"}`}
                />
                FULL-TEXT SCREENING
              </div>
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 border-b border-border bg-surface-white flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              aria-label="Search conflict papers by title, authors, or DOI"
              placeholder="Search by title, authors or DOI..."
              className="min-h-11 w-full rounded-xl border border-border bg-surface-white py-2.5 pl-12 pr-4 text-sm font-medium text-text-primary transition-[border-color,box-shadow] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-bg-primary p-1.5 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            {(["All", "Conflict", "Resolved"] as const).map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(status)}
                className={`min-h-11 whitespace-nowrap rounded-xl px-5 text-xs font-black uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none ${
                  statusFilter === status
                    ? "bg-surface-white text-accent shadow-none border border-border"
                    : "text-text-secondary hover:text-text-secondary"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto no-scrollbar relative">
          {isLoading && (
            <div className="absolute inset-0 bg-surface-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-bg-primary/50 backdrop-blur-md">
                <th className="px-6 py-5 text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] w-[35%]">
                  Title
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] w-[15%]">
                  Authors
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] w-[10%]">
                  Year
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] w-[15%]">
                  Source
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] w-[15%]">
                  Status
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] text-center w-[10%]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {papers.map((paper) => (
                <tr
                  key={paper.paperId}
                  className="group transition-colors hover:bg-primary-light/30 motion-reduce:transition-none"
                >
                  <td className="px-6 py-6">
                    <p className="text-sm font-bold text-text-primary leading-relaxed transition-colors group-hover:text-accent motion-reduce:transition-none">
                      {paper.title}
                    </p>
                    <p className="text-xs text-accent font-medium mt-1">
                      DOI: {paper.doi || "N/A"}
                    </p>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-xs font-semibold text-text-secondary break-words transition-colors group-hover:text-text-primary motion-reduce:transition-none">
                      {paper.authors || "Unknown Authors"}
                    </p>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs font-black text-text-secondary transition-colors group-hover:text-text-primary motion-reduce:transition-none">
                      {paper.year || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-6 font-medium">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary bg-bg-secondary px-2 py-1 rounded-md border border-border transition-colors group-hover:bg-primary-light group-hover:text-accent group-hover:border-primary/30 motion-reduce:transition-none">
                      {paper.source || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-sm">
                    {paper.status === PaperSelectionStatus.Conflict ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning border border-warning/20 text-[10px] font-black uppercase tracking-widest">
                        <AlertCircle className="w-3 h-3" />
                        Conflict
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success border border-success/20 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" />
                        Resolved
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenDetailModal(paper)}
                      aria-label={`Review conflict for ${paper.title}`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent text-text-secondary transition-colors hover:border-primary/30 hover:bg-surface-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && papers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="p-6 bg-bg-primary rounded-full mb-4">
                {statusFilter === "Resolved" ? (
                  <AlertCircle className="w-10 h-10 text-text-secondary/50" />
                ) : (
                  <CheckCircle2 className="w-10 h-10 text-text-secondary/50" />
                )}
              </div>
              <h3 className="text-lg font-bold text-text-primary">
                {statusFilter === "All"
                  ? "No papers found"
                  : `No ${statusFilter.toLowerCase()} papers`}
              </h3>
              <p className="text-text-secondary max-w-xs text-center mt-2">
                Try adjusting your filters or search query to find what you're
                looking for.
              </p>
              {statusFilter !== "All" && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("All")}
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-primary underline underline-offset-4 transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
                >
                  Reset status filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-4 py-4 bg-bg-primary/50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 sm:px-8">
          <p className="text-xs text-text-secondary font-medium font-mono uppercase tracking-wider">
            Showing {papers.length} of {totalCount} papers
          </p>
          <Pagination
            currentPage={pageNumber}
            totalPages={conflictsData?.totalPages || 1}
            onPageChange={setPageNumber}
          />
        </div>
      </div>

      <ConflictResolutionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        paperId={selectedPaperId}
        processId={screeningProcessId}
        phase={phaseValue}
      />
    </div>
  );
};

export default ResolveConflictPage;
