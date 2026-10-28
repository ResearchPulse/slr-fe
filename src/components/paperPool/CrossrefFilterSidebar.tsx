import Select from "../ui/Select";
import React from "react";
import {
  FiFilter,
  FiUser,
  FiType,
  FiList,
  FiTarget,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
  FiZap,
} from "react-icons/fi";
import type { CrossrefQueryParameters } from "../../types/paper";
import Button from "../ui/Button";
import { cn } from "../../utils/cn";

interface CrossrefFilterSidebarProps {
  localParams: CrossrefQueryParameters;
  setLocalParams: (params: CrossrefQueryParameters) => void;
  selectedSourceId: string;
  setSelectedSourceId: (id: string) => void;
  availableSources: { label: string; value: string }[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSearch: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export default function CrossrefFilterSidebar({
  localParams,
  setLocalParams,
  selectedSourceId,
  setSelectedSourceId,
  availableSources,
  isCollapsed,
  onToggleCollapse,
  onSearch,
  isLoading,
}: CrossrefFilterSidebarProps) {
  if (isCollapsed) {
    return (
      <aside className="flex h-fit w-full items-center justify-between rounded-xl border border-border bg-surface-white px-2 py-2 motion-safe:transition-[width] motion-safe:duration-300 motion-reduce:transition-none lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:w-14 lg:flex-col lg:justify-start lg:px-0 lg:py-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-accent/30 bg-primary-light text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none lg:mb-5"
          title="Expand Explorer Filters"
          aria-label="Expand Explorer Filters"
        >
          <FiChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="hidden flex-col gap-4 text-text-secondary/50 lg:flex">
          <FiFilter className="w-5 h-5" />
          <FiUser className="w-5 h-5" />
          <FiType className="w-5 h-5" />
          <FiList className="w-5 h-5" />
          <FiTarget className="w-5 h-5" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-fit w-full flex-col overflow-hidden rounded-xl border border-border bg-surface-white motion-safe:transition-[width] motion-safe:duration-300 motion-reduce:transition-none lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:w-72">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-primary-light/30 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/15 bg-primary-light text-primary">
            <FiFilter className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-primary">
              Explorer
            </h3>
            <p className="text-[10px] text-text-secondary">
              Refine Search
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-primary-light hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          title="Collapse Explorer Filters"
          aria-label="Collapse Explorer Filters"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5 overflow-y-auto p-4 custom-scrollbar">
        {/* Author Query */}
        <div className="space-y-2">
          <label className="px-0.5 text-[11px] font-semibold text-text-secondary">
            Author
          </label>
          <div className="relative group">
            <FiUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60 transition-colors group-focus-within:text-primary motion-reduce:transition-none" />
            <input
              type="text"
              placeholder="e.g. Kitchenham"
              value={localParams.queryAuthor || ""}
              onChange={(e) =>
                setLocalParams({ ...localParams, queryAuthor: e.target.value })
              }
              className="h-10 min-h-10 w-full rounded-lg border border-border bg-surface-white py-2 pl-9 pr-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            />
          </div>
        </div>

        {/* Title Keywords */}
        <div className="space-y-2">
          <label className="px-0.5 text-[11px] font-semibold text-text-secondary">
            Title Keywords
          </label>
          <div className="relative group">
            <FiType className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60 transition-colors group-focus-within:text-primary motion-reduce:transition-none" />
            <input
              type="text"
              placeholder="e.g. Software Quality"
              value={localParams.queryTitle || ""}
              onChange={(e) =>
                setLocalParams({ ...localParams, queryTitle: e.target.value })
              }
              className="h-10 min-h-10 w-full rounded-lg border border-border bg-surface-white py-2 pl-9 pr-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            />
          </div>
        </div>

        {/* Results Limit */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 px-0.5 text-[11px] font-semibold text-text-secondary">
            <FiList className="w-3 h-3" />
            Results Limit
          </label>
          <Select
            value={localParams.rows}
            onChange={(e) =>
              setLocalParams({ ...localParams, rows: parseInt(e.target.value) })
            }
            className="h-10 min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface-white px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value={10}>10 Results per page</option>
            <option value={20}>20 Results per page</option>
            <option value={50}>50 Results per page</option>
            <option value={100}>100 Results per page</option>
          </Select>
        </div>

        {/* Sorting */}
        <div className="space-y-5 border-t border-border pt-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 px-0.5 text-[11px] font-semibold text-text-secondary">
              <FiZap className="w-3 h-3" />
              Sort By
            </label>
            <Select
              value={localParams.sort || "relevance"}
              onChange={(e) =>
                setLocalParams({ ...localParams, sort: e.target.value })
              }
              className="h-10 min-h-10 w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface-white px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="relevance">Relevance</option>
              <option value="is-referenced-by-count">Citation Count</option>
              <option value="published">Publication Date</option>
              <option value="issued">Issued Date</option>
              <option value="references-count">References Count</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 px-0.5 text-[11px] font-semibold text-text-secondary">
              {localParams.order === "asc" ? (
                <FiArrowUp className="w-3 h-3" />
              ) : (
                <FiArrowDown className="w-3 h-3" />
              )}
              Sort Order
            </label>
            <div className="flex rounded-lg bg-bg-primary p-1">
              <button
                type="button"
                onClick={() =>
                  setLocalParams({ ...localParams, order: "desc" })
                }
                className={cn(
                  "min-h-9 flex-1 rounded-md py-1.5 text-[10px] font-semibold uppercase tracking-wide motion-safe:transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50",
                  localParams.order === "desc" || !localParams.order
                    ? "bg-surface-white text-accent shadow-sm"
                    : "text-text-secondary hover:text-text-secondary",
                )}
              >
                Descending
              </button>
              <button
                type="button"
                onClick={() => setLocalParams({ ...localParams, order: "asc" })}
                className={cn(
                  "min-h-9 flex-1 rounded-md py-1.5 text-[10px] font-semibold uppercase tracking-wide motion-safe:transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50",
                  localParams.order === "asc"
                    ? "bg-surface-white text-accent shadow-sm"
                    : "text-text-secondary hover:text-text-secondary",
                )}
              >
                Ascending
              </button>
            </div>
          </div>
        </div>

        {/* Target Source */}
        <div className="space-y-2 border-t border-border pt-4">
          <label className="flex items-center gap-2 px-0.5 text-[11px] font-semibold text-text-secondary">
            <FiTarget className="w-3 h-3" />
            Import Destination
          </label>
          <Select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="h-10 min-h-10 w-full rounded-lg border border-border bg-surface-white px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select source to import to...</option>
            {availableSources.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <p className="px-1 text-[11px] leading-4 text-text-secondary">
            Imported papers will be associated with this search source.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border bg-bg-primary/50 p-4">
        <Button
          onClick={onSearch}
          isLoading={isLoading}
          className="min-h-10 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-none hover:bg-primary-hover hover:shadow-none"
        >
          <FiRefreshCw />
          Apply Explorer Filters
        </Button>
      </div>
    </aside>
  );
}
