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
  FiLoader,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCrossrefWorks } from "../../hooks/useCrossrefWorks";
import { usePaperImport } from "../../hooks/usePaperImport";
import Button from "../ui/Button";
import Input from "../ui/Input";
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
  const [selectedWork, setSelectedWork] = useState<CrossrefWorkDto | null>(
    null,
  );
  const [loadingDetailDoi, setLoadingDetailDoi] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const selectedAbstract = selectedWork?.abstract?.trim();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(localParams);
  };

  const handleViewDetail = async (doi: string) => {
    setLoadingDetailDoi(doi);
    try {
      const response = await fetchDetail(doi);
      const searchWork = searchResults?.items.find((work) => work.DOI === doi);
      setSelectedWork({
        ...searchWork,
        ...response.data,
        abstract: response.data.abstract?.trim() || searchWork?.abstract,
      });
      setIsDetailOpen(true);
    } catch {
      // Error handled by mutation toast if added, or here
    } finally {
      setLoadingDetailDoi(null);
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
    <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end lg:gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary-light px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <FiBookOpen className="w-3 h-3" />
            Crossref Explorer
          </div>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">
            Query Academic <span className="text-accent">Works</span>
          </h2>
          <p className="max-w-xl text-[13px] leading-5 text-text-secondary">
            Directly search the Crossref database for papers. Explore metadata
            and import them into your project repository.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex w-full items-center gap-3 lg:w-auto"
        >
          <div className="group relative min-w-0 flex-1 lg:w-[300px] lg:flex-none">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-primary motion-reduce:transition-none" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search title, keywords..."
              value={localParams.query}
              onChange={(e) =>
                setLocalParams({ ...localParams, query: e.target.value })
              }
              className="h-9 min-h-9 w-full rounded-lg pl-9 pr-3 text-[13px] transition-[border-color,box-shadow] hover:border-primary/40"
            />
          </div>
          <Button
            type="submit"
            isLoading={isLoading}
            className="h-9 min-h-9 shrink-0 rounded-lg px-4 text-[13px] shadow-none hover:shadow-none"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Results Grid */}
      <div className="flex min-w-0 flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:gap-5">
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
        <div className="relative min-h-[300px] flex-1 space-y-3">
          {/* Refreshing Overlay */}
          <AnimatePresence>
            {isFetching && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-surface-white/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center pointer-events-none"
              >
                <div className="flex items-center gap-3 px-6 py-3 bg-surface-white rounded-xl shadow-none border border-accent/20 mb-20">
                  <FiRefreshCw className="w-5 h-5 text-accent motion-safe:animate-spin motion-reduce:animate-none" />
                  <span className="text-xs font-black text-text-primary uppercase tracking-widest">
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
                    className="p-6 bg-surface-white rounded-xl border border-border motion-safe:animate-pulse motion-reduce:animate-none flex flex-col md:flex-row gap-6 items-start md:items-center"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <div className="h-4 w-20 bg-bg-secondary rounded-md" />
                        <div className="h-4 w-32 bg-bg-secondary rounded-md" />
                      </div>
                      <div className="h-6 w-3/4 bg-bg-secondary rounded-md" />
                      <div className="flex gap-4">
                        <div className="h-4 w-32 bg-bg-primary rounded-md" />
                        <div className="h-4 w-24 bg-bg-primary rounded-md" />
                      </div>
                    </div>
                    <div className="h-10 w-24 bg-bg-primary rounded-xl self-end md:self-center" />
                  </div>
                ))}
              </div>
            ) : !searchResults?.items || searchResults.items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-dashed border-border bg-surface-white p-6 text-center sm:p-8 lg:p-10"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light text-primary">
                  <FiSearch className="h-6 w-6" aria-hidden="true" />
                </div>
                <h4 className="mb-1.5 text-sm font-semibold text-text-primary">
                  No works found
                </h4>
                <p className="mx-auto max-w-xs text-[13px] leading-5 text-text-secondary">
                  Try adjusting your search query or filters to find academic
                  works.
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
                    className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-surface-white p-3 transition-[border-color,box-shadow] hover:border-accent/40 hover:shadow-sm motion-reduce:transition-none md:flex-row md:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-bg-secondary text-text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest">
                          {work.type || "journal-article"}
                        </span>
                        <span className="text-[10px] font-bold text-text-secondary font-mono">
                          <a
                            className="hover:underline"
                            href={`https://doi.org/${work.DOI}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {work.DOI}
                          </a>
                        </span>
                        <span className="text-[10px] font-bold bg-primary-light text-accent px-2 py-0.5 rounded-xl">
                          Score: {work.score}
                        </span>
                      </div>
                      <h4 className="line-clamp-2 text-base font-semibold leading-snug text-text-primary transition-colors group-hover:text-accent motion-reduce:transition-none">
                        {work.title?.[0] || "Untitled Work"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                          <FiUser className="w-3.5 h-3.5 text-accent/70" />
                          <span className="truncate max-w-[200px]">
                            {work.author
                              ?.map((a) => `${a.given} ${a.family}`)
                              .join(", ") || "Unknown authors"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                          <FiCalendar className="w-3.5 h-3.5 text-accent/70" />
                          {work.published?.["date-parts"]?.[0]?.[0] || "N/A"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-accent font-black uppercase tracking-widest bg-primary-light border border-accent/20 px-2.5 py-0.5 rounded-full">
                          {work["is-referenced-by-count"] || 0} Citations
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleViewDetail(work.DOI)}
                        disabled={isFetchingDetail || loadingDetailDoi !== null}
                        aria-label={
                          loadingDetailDoi === work.DOI
                            ? "Loading metadata details"
                            : "View metadata details"
                        }
                        aria-busy={loadingDetailDoi === work.DOI || undefined}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
                        title={loadingDetailDoi === work.DOI ? "Loading metadata details" : "View Metadata Detail"}
                      >
                        {loadingDetailDoi === work.DOI ? (
                          <FiLoader className="motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        ) : (
                          <FiEye aria-hidden="true" />
                        )}
                      </button>
                      {isLeader && (
                        <Button
                          onClick={() => handleImport(work.DOI)}
                          isLoading={isImportingByDoi}
                          disabled={work.isImported}
                          className={cn(
                            "h-9 rounded-lg px-3 flex items-center gap-2 text-xs font-semibold",
                            work.isImported
                              ? "bg-bg-secondary text-text-secondary cursor-not-allowed border-border shadow-none"
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
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-white px-4 py-4 shadow-none sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex flex-col">
                  <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-accent rounded-full" />
                    Deep Paging (Cursor Mode)
                  </div>
                  <div className="text-xs font-bold text-text-primary">
                    Total:{" "}
                    <span className="text-accent font-black">
                      {searchResults["total-results"].toLocaleString()}
                    </span>{" "}
                    academic works found
                  </div>
                </div>

                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                      Page
                    </p>
                    <p className="text-sm font-black text-text-primary">
                      {cursorHistory.length + 1}{" "}
                      <span className="text-text-secondary/40 mx-1">/</span>{" "}
                      {Math.ceil(
                        searchResults["total-results"] /
                          (searchResults["items-per-page"] ||
                            queryParams.rows ||
                            10),
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-bg-secondary mx-2" />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={!canGoBack || isFetching}
                      aria-label="Previous page"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-bg-secondary text-text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
                      title="Previous Page"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <Button
                      onClick={handleNextPage}
                      disabled={!canGoNext || isFetching}
                      className="gap-2"
                    >
                      Next
                      <FiChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-2 bg-primary-light/50 rounded-xl border border-accent/20 text-center">
                <p className="text-[10px] font-medium text-text-secondary italic">
                  Note: Using cursors for consistent results across deep data
                  sets. Offset paging is limited to 10k results.
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
                <span className="px-3 py-1 bg-primary-light text-accent border border-accent/30 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {selectedWork.type}
                </span>
                <span className="text-xs font-mono text-text-secondary">
                  {selectedWork.DOI}
                </span>
              </div>
              <h3 className="text-2xl font-black text-text-primary leading-tight">
                {selectedWork.title?.[0]}
              </h3>
              <div className="p-4 bg-bg-secondary rounded-xl border border-border">
                <p className="text-xs font-black text-text-secondary uppercase tracking-widest mb-2">
                  Authors
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedWork.author?.map((a, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-surface-white border border-border rounded-xl text-xs font-bold text-text-primary shadow-none flex items-center gap-2"
                    >
                      <FiUser className="text-accent" />
                      {a.given} {a.family}
                      {a.ORCID && (
                        <FiExternalLink className="w-3 h-3 text-accent" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-white border border-border rounded-xl shadow-none">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">
                  Publisher
                </p>
                <p className="text-sm font-bold text-text-primary">
                  {selectedWork.publisher || "N/A"}
                </p>
              </div>
              <div className="p-4 bg-surface-white border border-border rounded-xl shadow-none">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">
                  Published Date
                </p>
                <p className="text-sm font-bold text-text-primary">
                  {selectedWork.published?.["date-parts"]?.[0]?.join("-") ||
                    "N/A"}
                </p>
              </div>
              <div className="p-4 bg-surface-white border border-border rounded-xl shadow-none">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">
                  Citations
                </p>
                <p className="text-sm font-bold text-text-primary">
                  {selectedWork["is-referenced-by-count"] || 0} citations
                </p>
              </div>
              <div className="p-4 bg-surface-white border border-border rounded-xl shadow-none">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">
                  Funding
                </p>
                <p className="text-sm font-bold text-text-primary">
                  {selectedWork.funder?.length || 0} funders
                </p>
              </div>
            </div>

            {selectedAbstract && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">
                  Abstract
                </p>
                <div className="p-6 bg-primary-light/30 rounded-xl border border-accent/20">
                  <div
                    className="text-sm text-text-primary leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: selectedAbstract }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-border"></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
