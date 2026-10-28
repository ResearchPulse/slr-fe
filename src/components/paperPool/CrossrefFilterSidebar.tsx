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
      <aside className="flex h-fit w-full items-center justify-between rounded-xl border border-border bg-surface-white px-2 py-2 motion-safe:transition-[width] motion-safe:duration-300 motion-reduce:transition-none lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:w-16 lg:flex-col lg:justify-start lg:px-0 lg:py-6">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-accent/30 bg-primary-light text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none lg:mb-8"
          title="Expand Explorer Filters"
          aria-label="Expand Explorer Filters"
        >
          <FiChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="hidden flex-col gap-6 text-text-secondary/50 lg:flex">
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
    <aside className="flex h-fit w-full flex-col overflow-hidden rounded-xl border border-border bg-surface-white motion-safe:transition-[width] motion-safe:duration-300 motion-reduce:transition-none lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:w-80">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border flex items-center justify-between bg-primary-light/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-light border border-accent/30 rounded-xl flex items-center justify-center text-accent">
            <FiFilter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">
              Explorer
            </h3>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
              Refine Search
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-primary-light hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          title="Collapse Explorer Filters"
          aria-label="Collapse Explorer Filters"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Author Query */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
            Author
          </label>
          <div className="relative group">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50 transition-colors group-focus-within:text-accent motion-reduce:transition-none" />
            <input
              type="text"
              placeholder="e.g. Kitchenham"
              value={localParams.queryAuthor || ""}
              onChange={(e) =>
                setLocalParams({ ...localParams, queryAuthor: e.target.value })
              }
              className="min-h-11 w-full rounded-xl border border-border bg-surface-white py-2.5 pl-11 pr-4 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            />
          </div>
        </div>

        {/* Title Keywords */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
            Title Keywords
          </label>
          <div className="relative group">
            <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/50 transition-colors group-focus-within:text-accent motion-reduce:transition-none" />
            <input
              type="text"
              placeholder="e.g. Software Quality"
              value={localParams.queryTitle || ""}
              onChange={(e) =>
                setLocalParams({ ...localParams, queryTitle: e.target.value })
              }
              className="min-h-11 w-full rounded-xl border border-border bg-surface-white py-2.5 pl-11 pr-4 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            />
          </div>
        </div>

        {/* Results Limit */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1 flex items-center gap-2">
            <FiList className="w-3 h-3" />
            Results Limit
          </label>
          <select
            value={localParams.rows}
            onChange={(e) =>
              setLocalParams({ ...localParams, rows: parseInt(e.target.value) })
            }
            className="rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full text-text-primary cursor-pointer appearance-none"
          >
            <option value={10}>10 Results per page</option>
            <option value={20}>20 Results per page</option>
            <option value={50}>50 Results per page</option>
            <option value={100}>100 Results per page</option>
          </select>
        </div>

        {/* Sorting */}
        <div className="space-y-6 pt-6 border-t border-border">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1 flex items-center gap-2">
              <FiZap className="w-3 h-3" />
              Sort By
            </label>
            <select
              value={localParams.sort || "relevance"}
              onChange={(e) =>
                setLocalParams({ ...localParams, sort: e.target.value })
              }
              className="rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full text-text-primary cursor-pointer appearance-none"
            >
              <option value="relevance">Relevance</option>
              <option value="is-referenced-by-count">Citation Count</option>
              <option value="published">Publication Date</option>
              <option value="issued">Issued Date</option>
              <option value="references-count">References Count</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1 flex items-center gap-2">
              {localParams.order === "asc" ? (
                <FiArrowUp className="w-3 h-3" />
              ) : (
                <FiArrowDown className="w-3 h-3" />
              )}
              Sort Order
            </label>
            <div className="flex bg-bg-primary p-1 rounded-xl">
              <button
                type="button"
                onClick={() =>
                  setLocalParams({ ...localParams, order: "desc" })
                }
                className={cn(
                  "min-h-11 flex-1 rounded-xl py-2 text-[10px] font-black uppercase tracking-widest motion-safe:transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50",
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
                  "min-h-11 flex-1 rounded-xl py-2 text-[10px] font-black uppercase tracking-widest motion-safe:transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50",
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
        <div className="space-y-3 pt-6 border-t border-border">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1 flex items-center gap-2">
            <FiTarget className="w-3 h-3" />
            Import Destination
          </label>
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
          >
            <option value="">Select source to import to...</option>
            {availableSources.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-[9px] text-text-secondary px-1 italic">
            Imported papers will be associated with this search source.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-bg-primary/50 border-t border-border">
        <Button
          onClick={onSearch}
          isLoading={isLoading}
          className="w-full py-4 bg-accent hover:bg-primary-hover text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm flex items-center justify-center gap-2"
        >
          <FiRefreshCw />
          Apply Explorer Filters
        </Button>
      </div>
    </aside>
  );
}
