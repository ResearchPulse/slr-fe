import { useEffect } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiFileText,
  FiSearch,
} from "react-icons/fi";
import type { PaperSortBy } from "../../../../types/studySelection";
import type { ScreeningStats, StatusFilter } from "../titleAbstractScreening/types";
import { SORT_OPTIONS, STATUS_FILTER_OPTIONS, STATUS_CONFIG } from "../titleAbstractScreening/constants";
import { cn } from "../../../../utils/cn";
import Select from "../../../../components/ui/Select";

export interface StudySelectionListPaper {
  id: string;
  title: string;
  authors: string | null;
  publicationYear: number | null;
  journal?: string | null;
  source?: string | null;
  doi: string | null;
  screeningStatus: string;
  decisions: Array<{ reviewerId: string; reviewerName: string; decision: string; phase?: number }>;
  assignedReviewers?: Array<{ reviewerId?: string; reviewerName?: string }>;
  aiReviewSubmitted?: boolean;
  pdfUrl?: string | null;
  hasConflict?: boolean;
}

interface Props {
  title: string;
  subtitle: string;
  processName: string;
  projectName?: string;
  activeStage: "title-abstract" | "full-text";
  papers: StudySelectionListPaper[];
  stats: ScreeningStats;
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: { search: string; status: StatusFilter; sortBy: PaperSortBy; hasFullText?: boolean; hasConflict?: boolean; decidedByMe?: boolean };
  isLoading?: boolean;
  contextKey?: string;
  onBack: () => void;
  onOpenPaper: (paperId: string) => void;
  onStageChange: (stage: "title-abstract" | "full-text") => void;
  headerActionLabel?: string;
  onHeaderAction?: () => void;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  onSortChange: (sort: PaperSortBy) => void;
  onFullTextChange?: (value: boolean) => void;
  onConflictChange?: (value: boolean) => void;
  onDecidedByMeChange?: (value: boolean) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  "in-progress": "bg-blue-50 text-blue-700",
  included: "bg-emerald-50 text-emerald-700",
  excluded: "bg-rose-50 text-rose-700",
  conflicted: "bg-amber-50 text-amber-800",
};

export default function StudySelectionPaperList(props: Props) {
  const {
    title, subtitle, processName, projectName, activeStage, papers, stats, pagination, filters,
    isLoading, contextKey, onBack, onOpenPaper, onStageChange, onSearchChange, onStatusChange,
    onSortChange, onFullTextChange, onConflictChange, onDecidedByMeChange, onPageChange, onPageSizeChange,
  } = props;
  useEffect(() => {
    if (!contextKey) return;
    try {
      const saved = sessionStorage.getItem(contextKey);
      const scrollY = saved ? JSON.parse(saved).scrollY : undefined;
      if (typeof scrollY === "number") requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "instant" }));
    } catch { /* browser restoration is best effort */ }
  }, [contextKey]);
  const clearFilters = () => {
    onSearchChange("");
    onStatusChange("all");
    onFullTextChange?.(false);
    onConflictChange?.(false);
    onDecidedByMeChange?.(false);
  };

  const includedLabel = activeStage === "title-abstract" ? "Passed to Full Text" : "Included";
  const metrics = [
    { label: "Total papers", value: stats.total, tone: "text-slate-800", dot: "bg-slate-300" },
    { label: "Pending", value: stats.pending, tone: "text-slate-700", dot: "bg-slate-400" },
    { label: includedLabel, value: stats.included, tone: "text-emerald-700", dot: "bg-emerald-500" },
    { label: "Excluded", value: stats.excluded, tone: "text-rose-700", dot: "bg-rose-400" },
    { label: "Conflicts", value: stats.conflicted, tone: "text-amber-700", dot: "bg-amber-400" },
    { label: "Complete", value: `${Math.round(stats.completionPercentage)}%`, tone: "text-blue-700", dot: "bg-blue-500" },
  ];

  return (
    <main className="h-full min-h-0 overflow-y-auto bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-20 border-b border-border bg-surface-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 pb-4 pt-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <button onClick={onBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-text-secondary hover:bg-bg-secondary" aria-label="Back to project workspace">
              <FiArrowLeft />
            </button>
            <div className="min-w-0">
              <div title={`Study selection · ${projectName || processName}`} className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Study selection · {projectName || processName}</div>
              <h1 className="truncate text-xl font-semibold">{title}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-xs text-text-secondary">Overall progress</span>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-bg-secondary">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, stats.completionPercentage))}%` }} />
              </div>
              <span className="text-xs font-semibold tabular-nums">{Math.round(stats.completionPercentage)}%</span>
            </div>
            {props.headerActionLabel && props.onHeaderAction && <button onClick={props.onHeaderAction} className="whitespace-nowrap rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-95">{props.headerActionLabel}</button>}
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 pb-3 pt-2 lg:px-10" aria-label="Screening stage">
          <div className="flex min-w-0 items-center">
            <button
              onClick={() => onStageChange("title-abstract")}
              aria-current={activeStage === "title-abstract" ? "step" : undefined}
              className={cn("group flex min-h-12 items-center gap-3 border-b-2 px-2 py-2 text-left transition sm:px-4", activeStage === "title-abstract" ? "border-blue-600 text-blue-700" : "border-transparent text-text-secondary hover:text-text-primary")}
            >
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", activeStage === "title-abstract" ? "border-blue-600 text-blue-700" : "border-slate-300 text-slate-500")}>1</span>
              <span className="whitespace-nowrap"><span className="block text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Step 1</span><span className="text-sm font-medium">Title &amp; Abstract</span></span>
            </button>
            <FiChevronRight aria-hidden="true" className="mx-1 shrink-0 text-slate-400 sm:mx-3" />
            <button
              onClick={() => onStageChange("full-text")}
              aria-current={activeStage === "full-text" ? "step" : undefined}
              className={cn("group flex min-h-12 items-center gap-3 border-b-2 px-2 py-2 text-left transition sm:px-4", activeStage === "full-text" ? "border-blue-600 text-blue-700" : "border-transparent text-text-secondary hover:text-text-primary")}
            >
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", activeStage === "full-text" ? "border-blue-600 text-blue-700" : "border-slate-300 text-slate-500")}>2</span>
              <span className="whitespace-nowrap"><span className="block text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Step 2</span><span className="text-sm font-medium">Full Text</span></span>
            </button>
          </div>
          <button onClick={() => onStatusChange(filters.status === "included" ? "all" : "included")} className={cn("whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-medium transition", filters.status === "included" ? "border-emerald-300 text-emerald-700" : "border-border text-text-secondary hover:border-emerald-300 hover:text-emerald-700")}>{activeStage === "title-abstract" ? "Review Passed Papers" : "Review Included"}</button>
        </nav>
      </header>

      <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm text-text-secondary">{subtitle}</p><p className="mt-1 text-xs text-text-secondary">{processName} · {pagination.totalCount.toLocaleString()} papers</p></div>
          <button onClick={onBack} className="hidden rounded-lg border border-border bg-surface-white px-3 py-2 text-sm text-text-secondary hover:bg-bg-secondary md:block">Project workspace</button>
        </div>

        <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6" aria-label="Screening statistics">
          {metrics.map((metric) => <div key={metric.label} className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)]"><div className="flex items-center gap-2"><span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", metric.dot)} /><span className="text-[13px] font-medium text-slate-500">{metric.label}</span></div><div className={cn("mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums", metric.tone)}>{metric.value}</div></div>)}
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-surface-white">
          <div className="flex flex-wrap items-center justify-start gap-x-2.5 gap-y-3 border-b border-border bg-surface-white p-4">
            <label className="relative min-w-[220px] max-w-[560px] flex-[1_1_420px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input value={filters.search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search title, author, or keyword" className="h-12 w-full rounded-xl border border-border bg-surface-white pl-10 pr-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
            </label>
            <div className="min-w-[178px] flex-1">
              <Select aria-label="Filter by review status" value={filters.status} onChange={(event) => onStatusChange(event.target.value as StatusFilter)} options={STATUS_FILTER_OPTIONS} containerClassName="block w-full" className="h-12 w-full rounded-xl px-4" />
            </div>
            <div className="min-w-[202px] flex-1">
              <Select aria-label="Sort papers" value={String(filters.sortBy)} onChange={(event) => onSortChange(Number(event.target.value) as PaperSortBy)} options={SORT_OPTIONS.map((option) => ({ label: option.label, value: String(option.value) }))} containerClassName="block w-full" className="h-12 w-full rounded-xl px-4" />
            </div>
            {onFullTextChange && <button onClick={() => onFullTextChange(!filters.hasFullText)} className={cn("h-12 whitespace-nowrap rounded-xl border px-4 text-sm font-medium transition", filters.hasFullText ? "border-blue-200 bg-blue-50 text-blue-700" : "border-border bg-surface-white text-text-secondary hover:border-slate-300 hover:bg-bg-primary")}>Has full text</button>}
            {onConflictChange && <button onClick={() => onConflictChange(!filters.hasConflict)} className={cn("h-12 whitespace-nowrap rounded-xl border px-4 text-sm font-medium transition", filters.hasConflict ? "border-amber-200 bg-amber-50 text-amber-800" : "border-border bg-surface-white text-text-secondary hover:border-slate-300 hover:bg-bg-primary")}>Conflicts</button>}
            {onDecidedByMeChange && <button onClick={() => onDecidedByMeChange(!filters.decidedByMe)} className={cn("h-12 whitespace-nowrap rounded-xl border px-4 text-sm font-medium transition", filters.decidedByMe ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border bg-surface-white text-text-secondary hover:border-slate-300 hover:bg-bg-primary")}>Decided by me</button>}
            {(filters.search || filters.status !== "all" || filters.hasFullText || filters.hasConflict || filters.decidedByMe) && <button onClick={clearFilters} className="h-12 whitespace-nowrap rounded-xl px-3 text-sm font-medium text-accent transition hover:bg-blue-50">Clear filters</button>}
          </div>

          <div className="w-full min-w-0 max-w-full overflow-x-clip">
            <table className="w-full min-w-0 max-w-full table-fixed border-collapse text-left">
              <colgroup><col className="w-[28%]"/><col className="w-[6%]"/><col className="w-[9%]"/><col className="w-[12%]"/><col className="w-[12%]"/><col className="w-[11%]"/><col className="w-[13%]"/><col className="w-[9%]"/></colgroup>
              <thead className="bg-bg-primary text-[11px] uppercase tracking-wide text-text-secondary"><tr><th className="px-2 py-3 font-semibold lg:px-3">Paper</th><th className="px-1 py-3 font-semibold lg:px-2">Year</th><th className="px-1 py-3 font-semibold lg:px-2">Source</th><th className="px-1 py-3 font-semibold lg:px-2">DOI</th><th className="px-1 py-3 font-semibold lg:px-2">Review status</th><th className="px-1 py-3 font-semibold lg:px-2">Assignment</th><th className="whitespace-nowrap px-1 py-3 font-semibold lg:px-2">Review progress</th><th className="whitespace-nowrap px-1 py-3 font-semibold lg:px-2">Action</th></tr></thead>
              <tbody className="divide-y divide-border">
                {isLoading && papers.length === 0 ? <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-text-secondary">Loading papers…</td></tr> : papers.length === 0 ? <tr><td colSpan={8} className="px-4 py-16 text-center"><FiFileText className="mx-auto mb-3 h-7 w-7 text-text-secondary/50"/><p className="text-sm font-medium">No papers found</p><p className="mt-1 text-xs text-text-secondary">Try changing the search or filters.</p></td></tr> : papers.map((paper) => {
                  const state = paper.screeningStatus;
                  const assignedReviewers = (paper.assignedReviewers ?? []).slice(0, 2);
                  const assignedCount = assignedReviewers.length;
                  const assignedNames = assignedReviewers.map((reviewer) => reviewer.reviewerName).filter(Boolean);
                  const assignmentLabel = [...new Set(assignedNames)].join(", ");
                  const phase = activeStage === "full-text" ? 1 : 0;
                  const assignedReviewerIds = new Set(assignedReviewers.map((reviewer) => String(reviewer.reviewerId ?? "")));
                  const phaseDecisions = paper.decisions?.filter((decision) =>
                    decision.phase === phase &&
                    (!assignedReviewerIds.size || assignedReviewerIds.has(String(decision.reviewerId))),
                  ) ?? [];
                  const humanDecisionCount = Math.min(2, new Set(phaseDecisions.map((decision) => decision.reviewerId)).size);
                  const hasHumanReviewActivity = assignedCount > 0 || humanDecisionCount > 0;
                  const displayState = state === "pending" && hasHumanReviewActivity ? "in-progress" : state;
                  const statusLabel = displayState === "in-progress"
                    ? "In progress"
                    : state === "included" && activeStage === "title-abstract"
                      ? "Passed to Full Text"
                      : STATUS_CONFIG[state as keyof typeof STATUS_CONFIG]?.label ?? state;
                  return <tr key={paper.id} tabIndex={0} role="link" onClick={() => onOpenPaper(paper.id)} onKeyDown={(event) => { if (event.key === "Enter") onOpenPaper(paper.id); }} className="cursor-pointer transition hover:bg-bg-primary/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                    <td className="min-w-0 overflow-hidden px-2 py-4 lg:px-3"><div className="line-clamp-2 text-sm font-semibold text-text-primary">{paper.title || "Untitled paper"}</div><div className="mt-1 truncate text-xs text-text-secondary">{paper.authors || "Authors unavailable"}{paper.journal || paper.source ? ` · ${paper.journal || paper.source}` : ""}</div></td>
                    <td className="px-2 py-4 text-sm tabular-nums">{paper.publicationYear ?? "—"}</td>
                    <td className="max-w-0 truncate px-2 py-4 text-sm text-text-secondary">{paper.journal || paper.source || "—"}</td>
                    <td className="min-w-0 max-w-0 overflow-hidden px-1 py-4 lg:px-2">{paper.doi ? <a href={`https://doi.org/${paper.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "")}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="flex min-w-0 max-w-full items-center gap-1 text-xs text-accent hover:underline"><span className="min-w-0 truncate">{paper.doi}</span><FiExternalLink className="shrink-0"/></a> : <span className="text-sm text-text-secondary">—</span>}</td>
                    <td className="overflow-hidden px-2 py-4"><span className={cn("inline-flex max-w-full items-center whitespace-nowrap gap-1.5 rounded-full px-2 py-1 text-xs font-medium", STATUS_STYLES[displayState] ?? STATUS_STYLES[state] ?? "bg-slate-100 text-slate-700")}>{state === "conflicted" && <FiAlertTriangle/>}{statusLabel}</span></td>
                    <td className="max-w-0 truncate px-2 py-4 text-xs text-text-secondary" title={assignmentLabel || undefined}>{assignmentLabel || "Unassigned"}</td>
                    <td className="whitespace-nowrap px-2 py-4 text-xs text-text-secondary">{humanDecisionCount}/2 human reviews</td>
                    <td className="whitespace-nowrap px-2 py-4"><button onClick={(event) => { event.stopPropagation(); onOpenPaper(paper.id); }} className="min-w-[96px] whitespace-nowrap rounded-lg bg-accent px-2 py-2 text-xs font-semibold text-white hover:brightness-95">Open review</button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4">
            <div className="flex items-center gap-3 text-xs text-text-secondary"><span>{pagination.totalCount ? `${(pagination.pageNumber - 1) * pagination.pageSize + 1}–${Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} of ${pagination.totalCount}` : "0 papers"}</span>{onPageSizeChange && <label className="flex items-center gap-2">Rows<select value={pagination.pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="rounded-md border border-border bg-surface-white px-2 py-1"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>}</div>
            <div className="flex items-center gap-2"><button aria-label="Previous page" disabled={!pagination.hasPreviousPage} onClick={() => onPageChange(pagination.pageNumber - 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><FiChevronLeft/></button><span className="min-w-20 text-center text-xs text-text-secondary">Page {pagination.pageNumber} of {Math.max(1, pagination.totalPages)}</span><button aria-label="Next page" disabled={!pagination.hasNextPage} onClick={() => onPageChange(pagination.pageNumber + 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><FiChevronRight/></button></div>
          </footer>
        </section>
      </div>
    </main>
  );
}
