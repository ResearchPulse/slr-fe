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
      <aside className="w-16 flex flex-col items-center py-6 bg-surface-white border border-border rounded-[4px] sticky top-24 h-fit max-h-[calc(100vh-8rem)] shadow-none transition-all duration-300">
        <button
          onClick={onToggleCollapse}
          className="p-3 bg-blue-50 text-accent border border-blue-200 rounded-[4px] hover:bg-blue-100 transition-colors mb-8"
          title="Expand Explorer Filters"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
        <div className="flex flex-col gap-6 text-gray-300">
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
    <aside className="w-80 flex flex-col bg-surface-white border border-border rounded-[4px] sticky top-24 h-fit max-h-[calc(100vh-8rem)] shadow-none overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border flex items-center justify-between bg-blue-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-[4px] flex items-center justify-center text-accent">
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
          onClick={onToggleCollapse}
          className="p-2 hover:bg-blue-50 rounded-[4px] text-text-secondary hover:text-accent transition-colors"
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
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="e.g. Kitchenham"
              value={localParams.queryAuthor || ""}
              onChange={(e) =>
                setLocalParams({ ...localParams, queryAuthor: e.target.value })
              }
              className="w-full bg-bg-primary border-none focus:bg-surface-white focus:ring-2 focus:ring-accent/20 rounded-[4px] pl-11 pr-4 py-3 text-sm font-bold text-text-primary transition-all outline-none"
            />
          </div>
        </div>

        {/* Title Keywords */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
            Title Keywords
          </label>
          <div className="relative group">
            <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="e.g. Software Quality"
              value={localParams.queryTitle || ""}
              onChange={(e) =>
                setLocalParams({ ...localParams, queryTitle: e.target.value })
              }
              className="w-full bg-bg-primary border-none focus:bg-surface-white focus:ring-2 focus:ring-accent/20 rounded-[4px] pl-11 pr-4 py-3 text-sm font-bold text-text-primary transition-all outline-none"
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
            className="w-full bg-bg-primary border-none focus:bg-surface-white focus:ring-2 focus:ring-accent/20 rounded-[4px] px-4 py-3 text-sm font-bold text-text-primary transition-all outline-none cursor-pointer appearance-none shadow-inner"
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
              className="w-full bg-bg-primary border-none focus:bg-surface-white focus:ring-2 focus:ring-accent/20 rounded-[4px] px-4 py-3 text-sm font-bold text-text-primary transition-all outline-none cursor-pointer appearance-none"
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
            <div className="flex bg-bg-primary p-1 rounded-[4px]">
              <button
                type="button"
                onClick={() =>
                  setLocalParams({ ...localParams, order: "desc" })
                }
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-[4px] transition-all",
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
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-[4px] transition-all",
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
            className="w-full bg-slate-900 text-white border-none rounded-[4px] px-4 py-4 text-xs font-bold focus:ring-2 focus:ring-accent transition-all outline-none shadow-none shadow-slate-200"
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
          className="w-full py-4 bg-accent hover:bg-primary-hover text-white rounded-[4px] font-black uppercase tracking-widest text-[10px] shadow-sm flex items-center justify-center gap-2"
        >
          <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
          Apply Explorer Filters
        </Button>
      </div>
    </aside>
  );
}
