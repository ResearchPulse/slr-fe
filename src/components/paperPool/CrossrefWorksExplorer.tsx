import React, { useState } from "react";
import {
  FiSearch,
  FiEye,
  FiPlus,
  FiExternalLink,
  FiBookOpen,
  FiUser,
  FiCalendar,
  FiChevronRight,
  FiChevronLeft,
  FiRefreshCw,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCrossrefWorks } from "../../hooks/useCrossrefWorks";
import { usePaperImport } from "../../hooks/usePaperImport";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import type { CrossrefWorkDto } from "../../types/paper";

import CrossrefFilterSidebar from "./CrossrefFilterSidebar";
import { cn } from "../../utils/cn";
import { BookmarkCheck } from "lucide-react";

interface CrossrefWorksExplorerProps {
  projectId: string;
  availableSources: { label: string; value: string }[];
  isLeader?: boolean;
}

export default function CrossrefWorksExplorer({
  projectId,
  availableSources,
  isLeader = false,
}: CrossrefWorksExplorerProps) {
  const {
    searchResults,
    isLoading,
    isFetching,
    queryParams,
    canGoBack,
    canGoNext,
    search,
    handleNextPage,
    handlePrevPage,
    fetchDetail,
    isFetchingDetail,
    cursorHistory,
  } = useCrossrefWorks(projectId);
  const { importByDoi, isImportingByDoi } = usePaperImport(projectId);

  const [localParams, setLocalParams] = useState(queryParams);
  const [selectedWork, setSelectedWork] = useState<CrossrefWorkDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(localParams);
  };

  const handleViewDetail = async (doi: string) => {
    try {
      const response = await fetchDetail(doi);
      setSelectedWork(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      // Error handled by mutation toast if added, or here
    }
  };

  const handleImport = async (doi: string) => {
    await importByDoi({
      doi,
      projectId,
      searchSourceId: selectedSourceId || undefined,
    });
  };

  return (
    <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <FiBookOpen className="w-3 h-3" />
            Crossref Explorer
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            Query Academic <span className="text-purple-600">Works</span>
          </h2>
          <p className="text-sm text-gray-500 font-medium max-w-xl">
            Directly search the Crossref database for papers. Explore metadata and import them into
            your project repository.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-[1.5rem] border border-gray-100 shadow-sm"
        >
          <div className="relative group min-w-[240px]">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="Search title, keywords..."
              value={localParams.query}
              onChange={(e) => setLocalParams({ ...localParams, query: e.target.value })}
              className="w-full bg-gray-50 border-none focus:bg-white rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-gray-900 transition-all outline-none"
            />
          </div>
          <Button
            type="submit"
            isLoading={isLoading}
            className="rounded-xl px-6 bg-purple-600 hover:bg-purple-700 shadow-purple-200"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Results Grid */}
      <div className="flex gap-8 items-start">
        {/* Advanced Filters Sidebar */}
        <CrossrefFilterSidebar
          localParams={localParams}
          setLocalParams={setLocalParams}
          selectedSourceId={selectedSourceId}
          setSelectedSourceId={setSelectedSourceId}
          availableSources={availableSources}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        {/* Results List */}
        <div className="flex-1 space-y-4 relative min-h-[400px]">
          {/* Refreshing Overlay */}
          <AnimatePresence>
            {isFetching && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] rounded-[2.5rem] flex items-center justify-center pointer-events-none"
              >
                <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-xl border border-purple-100 mb-20">
                  <FiRefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="text-xs font-black text-gray-900 uppercase tracking-widest">
                    Refreshing Results...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-6 bg-white rounded-[1.5rem] border border-gray-100 animate-pulse flex flex-col md:flex-row gap-6 items-start md:items-center"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <div className="h-4 w-20 bg-gray-100 rounded-md" />
                        <div className="h-4 w-32 bg-gray-100 rounded-md" />
                      </div>
                      <div className="h-6 w-3/4 bg-gray-100 rounded-md" />
                      <div className="flex gap-4">
                        <div className="h-4 w-32 bg-gray-50 rounded-md" />
                        <div className="h-4 w-24 bg-gray-50 rounded-md" />
                      </div>
                    </div>
                    <div className="h-10 w-24 bg-gray-50 rounded-xl self-end md:self-center" />
                  </div>
                ))}
              </div>
            ) : !searchResults?.items || searchResults.items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] p-20 text-center"
              >
                <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FiSearch className="w-10 h-10 text-purple-200" />
                </div>
                <h4 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                  No works found
                </h4>
                <p className="text-gray-400 font-medium max-w-xs mx-auto">
                  Try adjusting your search query or filters to find academic works.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {searchResults.items.map((work, idx) => (
                  <motion.div
                    key={work.DOI}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-[1.5rem] p-6 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] font-black uppercase tracking-widest">
                          {work.type || "journal-article"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 font-mono">
                          <a
                            className="hover:underline"
                            href={`https://doi.org/${work.DOI}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {work.DOI}
                          </a>
                        </span>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">
                          Score: {work.score}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-gray-900 leading-tight group-hover:text-purple-600 transition-colors line-clamp-2">
                        {work.title?.[0] || "Untitled Work"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                          <FiUser className="w-3.5 h-3.5 text-purple-400" />
                          <span className="truncate max-w-[200px]">
                            {work.author?.map((a) => `${a.given} ${a.family}`).join(", ") ||
                              "Unknown authors"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                          <FiCalendar className="w-3.5 h-3.5 text-purple-400" />
                          {work.published?.["date-parts"]?.[0]?.[0] || "N/A"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-purple-600 font-black uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded-full">
                          {work["is-referenced-by-count"] || 0} Citations
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleViewDetail(work.DOI)}
                        disabled={isFetchingDetail}
                        className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                        title="View Metadata Detail"
                      >
                        <FiEye />
                      </button>
                       {isLeader && (
                        <Button
                          onClick={() => handleImport(work.DOI)}
                          isLoading={isImportingByDoi}
                          disabled={work.isImported}
                          className={cn(
                            "rounded-xl px-5 flex items-center gap-2 text-xs font-black uppercase tracking-widest h-11",
                            work.isImported
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 shadow-none"
                              : "",
                          )}
                        >
                          {work.isImported ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              Imported
                            </>
                          ) : (
                            <>
                              <FiPlus />
                              Import
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {searchResults && searchResults.items.length > 0 && (
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center justify-between px-6 py-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
                <div className="flex flex-col">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    Deep Paging (Cursor Mode)
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    Total:{" "}
                    <span className="text-purple-600">
                      {searchResults["total-results"].toLocaleString()}
                    </span>{" "}
                    academic works found
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Page
                    </p>
                    <p className="text-sm font-black text-gray-900">
                      {cursorHistory.length + 1} <span className="text-gray-300 mx-1">/</span>{" "}
                      {Math.ceil(
                        searchResults["total-results"] /
                          (searchResults["items-per-page"] || queryParams.rows || 10),
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-slate-100 mx-2" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={!canGoBack || isFetching}
                      className="p-2.5 bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white disabled:opacity-30 rounded-xl transition-all"
                      title="Previous Page"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={!canGoNext || isFetching}
                      className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-30 rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-purple-200"
                    >
                      Next
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-2 bg-purple-50/50 rounded-xl border border-purple-100/50 text-center">
                <p className="text-[10px] font-medium text-purple-400 italic">
                  Note: Using cursors for consistent results across deep data sets. Offset paging is
                  limited to 10k results.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Work Metadata Details"
        size="lg"
      >
        {selectedWork && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {selectedWork.type}
                </span>
                <span className="text-xs font-mono text-gray-400">{selectedWork.DOI}</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 leading-tight">
                {selectedWork.title?.[0]}
              </h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Authors
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedWork.author?.map((a, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center gap-2"
                    >
                      <FiUser className="text-purple-500" />
                      {a.given} {a.family}
                      {a.ORCID && <FiExternalLink className="w-3 h-3 text-blue-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Publisher
                </p>
                <p className="text-sm font-bold text-gray-900">{selectedWork.publisher || "N/A"}</p>
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Published Date
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {selectedWork.published?.["date-parts"]?.[0]?.join("-") || "N/A"}
                </p>
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Citations
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {selectedWork["is-referenced-by-count"] || 0} citations
                </p>
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Funding
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {selectedWork.funder?.length || 0} funders
                </p>
              </div>
            </div>

            {selectedWork.abstract && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Abstract
                </p>
                <div className="p-6 bg-purple-50/30 rounded-[2rem] border border-purple-100/50">
                  <div
                    className="text-sm text-gray-700 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: selectedWork.abstract }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100"></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
