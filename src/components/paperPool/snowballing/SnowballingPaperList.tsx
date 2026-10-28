import Button from "../../ui/Button";
import React, { useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Layers,
  BarChart3,
  Info,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { usePapersWithCandidates } from "../../../hooks/useSnowballCandidates";
import { cn } from "../../../utils/cn";
import type { PaperWithCandidateDto } from "../../../types/paper";
import ReferenceExtractionButton from "../../papers/ReferenceExtractionButton";
import Pagination from "../../ui/Pagination";
import Select from "../../ui/Select";
import { formatAuthors } from "./formatAuthors";

interface SnowballingPaperListProps {
  projectId: string;
  onPaperClick: (id: string) => void;
}

const SnowballingPaperList: React.FC<SnowballingPaperListProps> = ({
  projectId,
  onPaperClick,
}) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: response,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = usePapersWithCandidates(projectId, {
    pageNumber,
    pageSize,
  });

  const papers = response?.items || [];
  const totalRefs = papers.reduce((sum, p) => sum + p.candidateCount, 0);
  const totalSuggested = papers.reduce((sum, p) => sum + p.suggestedCount, 0);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-text-secondary">
        <Loader2 aria-hidden="true" className="w-10 h-10 motion-safe:animate-spin motion-reduce:animate-none mb-4 text-primary/40" />
        <p className="text-sm font-bold uppercase tracking-widest">
          Loading source papers...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-error/20 bg-error/10">
          <AlertCircle className="h-8 w-8 text-error" />
        </div>
        <h3 className="text-base font-black text-text-primary">
          Failed to load source papers
        </h3>
        <p className="text-xs text-text-secondary mt-1 mb-6">
          There was an error connecting to the candidate pool API.
        </p>
        <Button
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="w-3 h-3" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-secondary/50 overflow-hidden">
      {/* Top Stats Bar */}
      <div className="w-full min-w-0 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-white p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary-light p-2 text-primary">
                <Layers className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-text-secondary">
                Overall Coverage
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h4 className="text-3xl font-bold tabular-nums text-text-primary">{totalRefs}</h4>
              <span className="text-sm text-text-secondary">
                Extracted References
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-border bg-surface-white p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-3 text-text-secondary">
              <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">
                Suggested Count
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h4 className="text-3xl font-bold tabular-nums text-text-primary">
                {totalSuggested}
              </h4>
              <span className="text-sm text-text-secondary">
                Suggested Matches
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Info className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-medium">
                Workspace View
              </span>
            </div>
            <p className="text-xs text-text-secondary font-medium leading-relaxed">
              The table below lists all papers used as extraction sources. Click
              on any row to enter the dedicated Workspace and review individual
              candidate references.
            </p>
          </div>
        </div>

        {/* Paper List Table */}
        <div className="bg-surface-white border border-border rounded-xl overflow-hidden shadow-none">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-bg-secondary/50 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-text-primary tracking-tight">
                  Source Papers
                </h2>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">
                  {response?.totalCount || 0} Papers Identified
                </p>
              </div>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-transparent transition-colors hover:border-border hover:bg-surface-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 motion-reduce:transition-none"
                title="Refresh paper list"
              >
                <RefreshCw
                  className={cn(
                    "w-4 h-4 text-text-secondary group-hover:text-primary transition-colors",
                    isFetching && "motion-safe:animate-spin motion-reduce:animate-none text-primary",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {papers.map((paper: PaperWithCandidateDto) => (
              <article key={paper.id} className="p-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => onPaperClick(paper.id)}
                  className="group flex w-full min-w-0 items-start gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary transition-colors group-hover:bg-primary-light group-hover:text-primary">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold leading-5 text-text-primary group-hover:text-primary">
                      {paper.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-text-secondary">
                      {formatAuthors(paper.authors)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-text-secondary">
                    {paper.publicationYear || "—"}
                  </span>
                </button>

                <dl className="mt-3 grid grid-cols-3 divide-x divide-border rounded-lg bg-bg-primary py-2 text-center">
                  <div className="px-1">
                    <dd className="text-sm font-semibold tabular-nums text-text-primary">{paper.candidateCount}</dd>
                    <dt className="text-[11px] text-text-secondary">Detected</dt>
                  </div>
                  <div className="px-1">
                    <dd className="text-sm font-semibold tabular-nums text-text-primary">{paper.suggestedCount}</dd>
                    <dt className="text-[11px] text-text-secondary">Suggested</dt>
                  </div>
                  <div className="px-1">
                    <dd className="text-sm font-semibold tabular-nums text-text-primary">{paper.duplicateCount}</dd>
                    <dt className="text-[11px] text-text-secondary">Duplicates</dt>
                  </div>
                </dl>

                <div className="mt-2 flex justify-end gap-1">
                  <ReferenceExtractionButton
                    paperId={paper.id}
                    hasPdf={!!paper.pdfUrl}
                    variant="icon"
                    className="text-text-secondary hover:text-primary transition-colors"
                  />
                  {paper.doi && (
                    <a
                      href={paper.doi.startsWith("http") ? paper.doi : `https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary"
                      title="Open source DOI"
                      aria-label="Open source DOI"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/30">
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Source Paper
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Year
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">
                    Detected
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">
                    Suggested
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">
                    Dups
                  </th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {papers.map((paper: PaperWithCandidateDto) => (
                  <tr
                    key={paper.id}
                    onClick={() => onPaperClick(paper.id)}
                    className="group cursor-pointer transition-colors hover:bg-bg-secondary/50 motion-reduce:transition-none"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate max-w-md">
                            {paper.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-secondary font-medium truncate max-w-[200px]">
                              {formatAuthors(paper.authors)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-text-secondary">
                        {paper.publicationYear}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onPaperClick(paper.id);
                        }}
                        aria-label={`Show ${paper.candidateCount} detected references for ${paper.title}`}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-bg-secondary px-3 text-xs font-semibold tabular-nums text-text-primary transition-colors hover:bg-primary-light hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {paper.candidateCount}
                        <span className="font-medium">Detected</span>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ShieldCheck
                          className={cn(
                            "w-3.5 h-3.5",
                            paper.suggestedCount > 0
                              ? "text-success"
                              : "text-text-secondary/50",
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-black",
                            paper.suggestedCount > 0
                              ? "text-success"
                              : "text-text-secondary",
                          )}
                        >
                          {paper.suggestedCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <AlertCircle
                          className={cn(
                            "w-3.5 h-3.5",
                            paper.duplicateCount > 0
                              ? "text-warning"
                              : "text-text-secondary/40",
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-black",
                            paper.duplicateCount > 0
                              ? "text-warning"
                              : "text-text-secondary/50",
                          )}
                        >
                          {paper.duplicateCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ReferenceExtractionButton
                          paperId={paper.id}
                          hasPdf={!!paper.pdfUrl}
                          variant="icon"
                          className="text-text-secondary hover:text-primary transition-colors"
                        />
                        {paper.doi && (
                          <a
                            href={
                              paper.doi.startsWith("http")
                                ? paper.doi
                                : `https://doi.org/${paper.doi}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-secondary text-text-secondary shadow-none transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
                            title="Open Source DOI"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-border bg-surface-white px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                Showing {papers.length} of {response?.totalCount || 0} papers
              </div>
              <div className="flex items-center gap-2 lg:border-l lg:border-border lg:pl-6">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                  Per Page:
                </span>
                <Select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageNumber(1);
                  }}
                  className="w-[72px]"
                  options={[
                    { value: "5", label: "5" },
                    { value: "10", label: "10" },
                    { value: "20", label: "20" },
                    { value: "50", label: "50" },
                    { value: "100", label: "100" },
                  ]}
                />
              </div>
            </div>
            <Pagination
              currentPage={pageNumber}
              totalPages={response?.totalPages || 1}
              onPageChange={setPageNumber}
              disabled={isFetching}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnowballingPaperList;
