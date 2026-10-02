import { useState, useRef, useEffect, forwardRef } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiFile,
} from "react-icons/fi";
import type {
  FullTextPaper,
  PaperFilters,
  PaginationInfo,
  StatusFilter,
} from "../types";
import type { PaperSortBy } from "../../../../../types/studySelection";
import {
  STATUS_CONFIG,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "../constants";
import { cn } from "../../../../../utils/cn";

interface FullTextPaperQueueProps {
  papers: FullTextPaper[];
  selectedPaperId: string | null;
  pagination: PaginationInfo;
  filters: PaperFilters;
  onSelectPaper: (paperId: string) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sortBy: PaperSortBy) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onHasFullTextFilterChange: (enabled: boolean) => void;
  onHasConflictFilterChange: (enabled: boolean) => void;
  onDecidedByMeFilterChange: (enabled: boolean) => void;
  onPageChange: (page: number) => void;
}

export default function FullTextPaperQueue({
  papers,
  selectedPaperId,
  pagination,
  filters,
  onSelectPaper,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
  onHasFullTextFilterChange,
  onHasConflictFilterChange,
  onDecidedByMeFilterChange,
  onPageChange,
}: FullTextPaperQueueProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const selectedRef = useRef<HTMLDivElement>(null);
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.status !== "all" ||
    filters.hasFullText ||
    filters.hasConflict ||
    filters.decidedByMe;

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [selectedPaperId]);

  const currentSort = SORT_OPTIONS.find((o) => o.value === filters.sortBy);

  return (
    <div className="flex flex-col h-full bg-surface-white border-r border-border min-w-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiFile className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              Paper Queue
            </h2>
          </div>
          <span className="text-xs text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full font-medium">
            {pagination.totalCount}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search title, author, keyword..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-[4px] bg-bg-primary focus:bg-surface-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none transition-colors"
          />
        </div>

        {/* Sort & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowFilterDropdown(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs border border-border rounded-[4px] hover:bg-bg-primary transition-colors"
            >
              <span className="text-text-secondary truncate">
                {currentSort?.label ?? "Sort"}
              </span>
              <FiChevronDown className="w-3 h-3 text-text-secondary shrink-0" />
            </button>
            {showSortDropdown && (
              <DropdownMenu
                items={SORT_OPTIONS.map((o) => ({
                  label: o.label,
                  value: o.value,
                }))}
                onSelect={(val) => {
                  onSortChange(val);
                  setShowSortDropdown(false);
                }}
                onClose={() => setShowSortDropdown(false)}
              />
            )}
          </div>

          <div className="relative flex-1">
            <button
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowSortDropdown(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs border border-border rounded-[4px] hover:bg-bg-primary transition-colors"
            >
              <span className="text-text-secondary truncate">
                {STATUS_FILTER_OPTIONS.find((f) => f.value === filters.status)
                  ?.label ?? "Filter"}
              </span>
              <FiChevronDown className="w-3 h-3 text-text-secondary shrink-0" />
            </button>
            {showFilterDropdown && (
              <DropdownMenu
                items={STATUS_FILTER_OPTIONS.map((o) => ({
                  label: o.label,
                  value: o.value,
                }))}
                onSelect={(val) => {
                  onStatusFilterChange(val as StatusFilter);
                  setShowFilterDropdown(false);
                }}
                onClose={() => setShowFilterDropdown(false)}
              />
            )}
          </div>
        </div>

        {/* Advanced server-side filters */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => onHasFullTextFilterChange(!filters.hasFullText)}
            className={cn(
              "px-2 py-1 text-[10px] rounded-md border transition-colors",
              filters.hasFullText
                ? "bg-bg-secondary text-indigo-700 border-indigo-200"
                : "bg-surface-white text-text-secondary border-border hover:bg-bg-primary",
            )}
          >
            Has Full Text
          </button>
          <button
            onClick={() => onHasConflictFilterChange(!filters.hasConflict)}
            className={cn(
              "px-2 py-1 text-[10px] rounded-md border transition-colors",
              filters.hasConflict
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-surface-white text-text-secondary border-border hover:bg-bg-primary",
            )}
          >
            Has Conflict
          </button>
          <button
            onClick={() => onDecidedByMeFilterChange(!filters.decidedByMe)}
            className={cn(
              "px-2 py-1 text-[10px] rounded-md border transition-colors",
              filters.decidedByMe
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-surface-white text-text-secondary border-border hover:bg-bg-primary",
            )}
          >
            Decided By Me
          </button>
        </div>
      </div>

      {/* Paper List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FiSearch className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm text-text-secondary">
              {hasActiveFilters
                ? "No papers found"
                : "No papers have been included from Title/Abstract screening yet."}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Included papers from Step 1 will appear here for full-text screening."}
            </p>
          </div>
        ) : (
          papers.map((paper) => (
            <PaperListItem
              key={paper.id}
              ref={paper.id === selectedPaperId ? selectedRef : undefined}
              paper={paper}
              isSelected={paper.id === selectedPaperId}
              onClick={() => onSelectPaper(paper.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-2 border-t border-border flex items-center justify-between">
          <button
            disabled={!pagination.hasPreviousPage}
            onClick={() => onPageChange(pagination.pageNumber - 1)}
            className="p-1.5 rounded text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-text-secondary">
            Page {pagination.pageNumber} of {pagination.totalPages}
          </span>
          <button
            disabled={!pagination.hasNextPage}
            onClick={() => onPageChange(pagination.pageNumber + 1)}
            className="p-1.5 rounded text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Paper List Item
// ============================================

interface PaperListItemProps {
  paper: FullTextPaper;
  isSelected: boolean;
  onClick: () => void;
}

const PaperListItem = forwardRef<HTMLDivElement, PaperListItemProps>(
  ({ paper, isSelected, onClick }, ref) => {
    const hasPdf = !!paper.pdfUrl || !!paper.url;

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter") onClick();
        }}
        className={cn(
          "w-full text-left px-4 py-3 border-b border-border cursor-pointer transition-colors outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-indigo-500 select-none overflow-hidden",
          isSelected
            ? "bg-bg-secondary border-l-2 border-l-indigo-500"
            : "hover:bg-bg-primary border-l-2 border-l-transparent",
        )}
      >
        <div className="flex items-start gap-2 min-w-0">
          <StatusDot status={paper.screeningStatus} />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-text-primary leading-snug line-clamp-2 break-words">
              {paper.title}
            </h3>
            <p className="text-xs text-text-secondary mt-1 truncate">
              {paper.authors ?? "Unknown authors"}
            </p>
            <div className="flex items-center gap-2 mt-1.5 min-w-0">
              {paper.publicationYear && (
                <span className="text-[10px] text-text-secondary font-medium shrink-0">
                  {paper.publicationYear}
                </span>
              )}
              {(paper.journal || paper.source) && (
                <span className="text-[10px] text-text-secondary truncate">
                  · {paper.journal || paper.source}
                </span>
              )}
            </div>

            {/* PDF availability indicator */}
            {!hasPdf && (
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-amber-600 font-medium">
                <FiAlertTriangle className="w-3 h-3 shrink-0" />
                <span className="truncate">Full text missing</span>
              </div>
            )}

            {/* Reviewer decisions */}
            {paper.decisions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {paper.decisions.map((d) => (
                  <span
                    key={d.id}
                    title={`${d.reviewerName}: ${d.decision}`}
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border max-w-full font-medium transition-colors",
                      d.decision === "included"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200",
                    )}
                  >
                    {d.decision === "included" ? (
                      <FiCheck className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                    ) : (
                      <FiX className="w-2.5 h-2.5 shrink-0 text-rose-600" />
                    )}
                    <span className="truncate max-w-[100px]">{d.reviewerName}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Conflict badge */}
            {paper.screeningStatus === "conflicted" && (
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-amber-600 font-medium">
                <FiAlertTriangle className="w-3 h-3 shrink-0" />
                <span className="truncate">Conflict — needs resolution</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

PaperListItem.displayName = "PaperListItem";

// ============================================
// Status Dot
// ============================================

function StatusDot({ status }: { status: string }) {
  const dotColors: Record<string, string> = {
    pending: "bg-emerald-400",
    included: "bg-green-500",
    excluded: "bg-red-500",
    conflicted: "bg-amber-500",
  };

  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full mt-1.5 shrink-0",
        dotColors[status] ?? "bg-gray-400",
      )}
      title={
        STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label ?? status
      }
    />
  );
}

// ============================================
// Dropdown Menu
// ============================================

function DropdownMenu<T>({
  items,
  onSelect,
  onClose,
}: {
  items: { label: string; value: T }[];
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 mt-1 bg-surface-white border border-border rounded-[4px] shadow-none z-30 py-1"
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onSelect(item.value)}
          className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-primary transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
