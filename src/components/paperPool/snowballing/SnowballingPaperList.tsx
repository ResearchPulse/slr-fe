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
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary/40" />
        <p className="text-sm font-bold uppercase tracking-widest">
          Loading source papers...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 border border-rose-100">
          <AlertCircle className="w-8 h-8 text-rose-500" />
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
    <div className="flex flex-col h-full bg-bg-secondary/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Stats Bar */}
      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-accent rounded-xl p-8 text-white shadow-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-surface-white/20 rounded-xl backdrop-blur-md">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-100">
                Overall Coverage
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-4xl font-black">{totalRefs}</h4>
              <span className="text-sm font-bold text-indigo-200">
                Extracted References
              </span>
            </div>
          </div>

          <div className="bg-surface-white border border-border rounded-xl p-8 shadow-none flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4 text-text-secondary">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">
                Suggested Count
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-4xl font-black text-text-primary">
                {totalSuggested}
              </h4>
              <span className="text-sm font-bold text-text-secondary">
                Suggested Matches
              </span>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border rounded-xl p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-accent mb-2">
              <Info className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">
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
          <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-bg-secondary/50">
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
                className="group p-2 hover:bg-surface-white border border-transparent hover:border-border rounded-xl transition-all disabled:opacity-50"
                title="Refresh paper list"
              >
                <RefreshCw
                  className={cn(
                    "w-4 h-4 text-text-secondary group-hover:text-primary transition-colors",
                    isFetching && "animate-spin text-primary",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/30">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Source Paper
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Year
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">
                    Detected
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">
                    Suggested
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">
                    Dups
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {papers.map((paper: PaperWithCandidateDto) => (
                  <tr
                    key={paper.id}
                    onClick={() => onPaperClick(paper.id)}
                    className="group hover:bg-bg-secondary/50 cursor-pointer transition-colors"
                  >
                    <td className="px-8 py-5">
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
                              {paper.authors}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-text-secondary">
                        {paper.publicationYear}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-bg-secondary text-text-primary text-xs font-black">
                        {paper.candidateCount}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <ShieldCheck
                          className={cn(
                            "w-3.5 h-3.5",
                            paper.suggestedCount > 0
                              ? "text-emerald-500"
                              : "text-slate-300",
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-black",
                            paper.suggestedCount > 0
                              ? "text-emerald-600"
                              : "text-text-secondary",
                          )}
                        >
                          {paper.suggestedCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <AlertCircle
                          className={cn(
                            "w-3.5 h-3.5",
                            paper.duplicateCount > 0
                              ? "text-amber-500"
                              : "text-slate-200",
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-black",
                            paper.duplicateCount > 0
                              ? "text-amber-600"
                              : "text-slate-300",
                          )}
                        >
                          {paper.duplicateCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
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
                            className="p-2 bg-bg-secondary border border-border hover:border-border rounded-xl text-text-secondary hover:text-primary transition-all shadow-none"
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
          <div className="px-8 py-4 border-t border-border flex items-center justify-between bg-surface-white">
            <div className="flex items-center gap-6">
              <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                Showing {papers.length} of {response?.totalCount || 0} papers
              </div>
              <div className="flex items-center gap-2 border-l border-border pl-6">
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
