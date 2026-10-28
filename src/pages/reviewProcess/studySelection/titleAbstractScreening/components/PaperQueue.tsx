import { useState, useRef, useEffect, forwardRef } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiList,
  FiShare2,
} from "react-icons/fi";
import type {
  ScreeningPaper,
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

interface PaperQueueProps {
  papers: ScreeningPaper[];
  selectedPaperId: string | null;
  pagination: PaginationInfo;
  filters: PaperFilters;
  onSelectPaper: (paperId: string) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sortBy: PaperSortBy) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function PaperQueue({
  papers,
  selectedPaperId,
  pagination,
  filters,
  onSelectPaper,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
  onPageChange,
  onPageSizeChange,
}: PaperQueueProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const selectedRef = useRef<HTMLDivElement>(null);

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
          <h2 className="text-sm font-semibold text-text-primary">
            Paper Queue
          </h2>
          <span className="text-xs text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full font-medium">
            {pagination.totalCount}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-3.5 h-3.5" />
          <input
            type="text"
            aria-label="Search papers by title, author, or year"
            placeholder="Search by title, author, year..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-border bg-surface-white py-2 pl-9 pr-3 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
          />
        </div>

        {/* Sort & Filter Row */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative flex-1">
            <button
              type="button"
              aria-expanded={showSortDropdown}
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowFilterDropdown(false);
              }}
              className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border px-2.5 text-xs transition-colors hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
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

          {/* Filter Dropdown */}
          <div className="relative flex-1">
            <button
              type="button"
              aria-expanded={showFilterDropdown}
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown);
                setShowSortDropdown(false);
              }}
              className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border px-2.5 text-xs transition-colors hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
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
      </div>

      {/* Paper List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FiSearch className="w-8 h-8 text-text-secondary/30 mb-3" />
            <p className="text-sm font-medium text-text-primary">
              No papers found
            </p>
            <p className="text-xs text-text-secondary mt-1 max-w-[180px] mx-auto">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
            {(filters.search || filters.status !== "all") && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  onStatusFilterChange("all");
                }}
                className="mt-3 inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
              >
                Clear all filters
              </button>
            )}
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

      <div className="px-4 py-2 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            disabled={!pagination.hasPreviousPage}
            onClick={() => onPageChange(pagination.pageNumber - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-30"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-text-secondary">
            Page {pagination.pageNumber} of {pagination.totalPages}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={!pagination.hasNextPage}
            onClick={() => onPageChange(pagination.pageNumber + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-30"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
            Show
          </span>
          <select
            value={pagination.pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="min-h-11 rounded-lg border border-border bg-surface-white px-2 text-xs font-medium text-text-secondary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Paper List Item
// ============================================

interface PaperListItemProps {
  paper: ScreeningPaper;
  isSelected: boolean;
  onClick: () => void;
}

const PaperListItem = forwardRef<HTMLDivElement, PaperListItemProps>(
  ({ paper, isSelected, onClick }, ref) => {
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
          "w-full text-left px-4 py-3 border-b border-border cursor-pointer transition-colors outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent select-none overflow-hidden",
          isSelected
            ? "bg-primary-light/70 border-l-2 border-l-accent"
            : "hover:bg-bg-primary border-l-2 border-l-transparent",
        )}
      >
        {/* Status indicator + Title */}
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
              {paper.source && (
                <span className="text-[10px] text-text-secondary truncate">
                  · {paper.source}
                </span>
              )}
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {paper.referenceCount !== undefined &&
                  paper.referenceCount > 0 && (
                    <span className="flex items-center gap-0.5 rounded bg-primary-light px-1 text-[9px] font-bold text-accent">
                      <FiList className="w-2.5 h-2.5" />
                      {paper.referenceCount}
                    </span>
                  )}
                {paper.citationCount !== undefined &&
                  paper.citationCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-accent bg-bg-secondary px-1 rounded">
                      <FiShare2 className="w-2.5 h-2.5" />
                      {paper.citationCount}
                    </span>
                  )}
              </div>
            </div>

            {/* Reviewer decisions */}
            {paper.decisions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {paper.decisions.map((d) => (
                  <span
                    key={d.id}
                    title={`${d.reviewerName}: ${d.decision}`}
                    className={cn(
                      "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors motion-reduce:transition-none",
                      d.decision === "included"
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-error/10 text-error border-error/20",
                    )}
                  >
                    {d.decision === "included" ? (
                      <FiCheck className="w-2.5 h-2.5 shrink-0 text-success" />
                    ) : (
                      <FiX className="w-2.5 h-2.5 shrink-0 text-error" />
                    )}
                    <span className="truncate max-w-[100px]">{d.reviewerName}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Conflict badge */}
            {paper.screeningStatus === "conflicted" && (
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-warning">
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
    pending: "bg-text-secondary/50",
    included: "bg-success",
    excluded: "bg-error",
    conflicted: "bg-warning",
  };

  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full mt-1.5 shrink-0",
        dotColors[status] ?? "bg-text-secondary/50",
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
      className="absolute top-full left-0 right-0 mt-1 bg-surface-white border border-border rounded-xl shadow-none z-30 py-1"
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
