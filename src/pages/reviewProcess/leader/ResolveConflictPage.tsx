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
    gsap.from(".page-content", {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: "power3.out",
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
      <div className="bg-surface-white rounded-[4px] shadow-none border border-border overflow-hidden flex flex-col flex-1 min-h-[500px]">
        {/* Tab Navigation */}
        <div className="bg-surface-white border-b border-border">
          <div className="flex px-4 sm:px-6">
            <button
              onClick={() => setActiveTab("title-abstract")}
              className={`px-8 py-5 text-sm font-bold border-b-2 transition-all ${
                activeTab === "title-abstract"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-text-secondary hover:text-text-secondary"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText
                  className={`w-4 h-4 ${activeTab === "title-abstract" ? "text-blue-600" : "text-text-secondary"}`}
                />
                TITLE/ABSTRACT SCREENING
              </div>
            </button>
            <button
              onClick={() => setActiveTab("full-text")}
              className={`px-8 py-5 text-sm font-bold border-b-2 transition-all ${
                activeTab === "full-text"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-text-secondary hover:text-text-secondary"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layout
                  className={`w-4 h-4 ${activeTab === "full-text" ? "text-blue-600" : "text-text-secondary"}`}
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
              placeholder="Search by title, authors or DOI..."
              className="w-full pl-12 pr-4 py-3 bg-bg-primary border-none rounded-[4px] text-sm focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-bg-primary p-1.5 rounded-[4px] w-full sm:w-auto overflow-x-auto no-scrollbar">
            {(["All", "Conflict", "Resolved"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-[4px] transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-surface-white text-blue-600 shadow-none border border-border"
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
            <tbody className="divide-y divide-gray-50">
              {papers.map((paper) => (
                <tr
                  key={paper.paperId}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-6 py-6">
                    <p className="text-sm font-bold text-text-primary leading-relaxed group-hover:text-blue-900 transition-colors">
                      {paper.title}
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      DOI: {paper.doi || "N/A"}
                    </p>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors break-words">
                      {paper.authors || "Unknown Authors"}
                    </p>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs font-black text-text-secondary group-hover:text-text-primary transition-colors">
                      {paper.year || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-6 font-medium">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary bg-bg-secondary px-2 py-1 rounded-md border border-border group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                      {paper.source || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-sm">
                    {paper.status === PaperSelectionStatus.Conflict ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black uppercase tracking-widest">
                        <AlertCircle className="w-3 h-3" />
                        Conflict
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" />
                        Resolved
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <button
                      onClick={() => handleOpenDetailModal(paper)}
                      className="p-2.5 text-text-secondary hover:text-blue-600 hover:bg-surface-white rounded-[4px] transition-all shadow-none group-hover:shadow-none hover:scale-105 active:scale-95 border border-transparent hover:border-blue-100"
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
                  <AlertCircle className="w-10 h-10 text-gray-300" />
                ) : (
                  <CheckCircle2 className="w-10 h-10 text-gray-300" />
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
                  onClick={() => setStatusFilter("All")}
                  className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4"
                >
                  Reset status filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-8 py-4 bg-bg-primary/50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
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
