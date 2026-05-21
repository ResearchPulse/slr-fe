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
      <aside className="w-16 flex flex-col items-center py-6 bg-white border border-gray-100 rounded-[2rem] sticky top-24 h-[calc(100vh-200px)] shadow-sm transition-all duration-300">
        <button
          onClick={onToggleCollapse}
          className="p-3 bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-100 transition-colors mb-8"
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
    <aside className="w-80 flex flex-col bg-white border border-gray-100 rounded-[2.5rem] sticky top-24 h-[calc(100vh-200px)] shadow-sm overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between bg-purple-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
            <FiFilter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Explorer</h3>
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">
              Refine Search
            </p>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-purple-50 rounded-lg text-gray-400 hover:text-purple-600 transition-colors"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Author Query */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
            Author
          </label>
          <div className="relative group">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="e.g. Kitchenham"
              value={localParams.queryAuthor || ""}
              onChange={(e) => setLocalParams({ ...localParams, queryAuthor: e.target.value })}
              className="w-full bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-900 transition-all outline-none"
            />
          </div>
        </div>

        {/* Title Keywords */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
            Title Keywords
          </label>
          <div className="relative group">
            <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="e.g. Software Quality"
              value={localParams.queryTitle || ""}
              onChange={(e) => setLocalParams({ ...localParams, queryTitle: e.target.value })}
              className="w-full bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-900 transition-all outline-none"
            />
          </div>
        </div>

        {/* Results Limit */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <FiList className="w-3 h-3" />
            Results Limit
          </label>
          <select
            value={localParams.rows}
            onChange={(e) => setLocalParams({ ...localParams, rows: parseInt(e.target.value) })}
            className="w-full bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 transition-all outline-none cursor-pointer appearance-none shadow-inner"
          >
            <option value={10}>10 Results per page</option>
            <option value={20}>20 Results per page</option>
            <option value={50}>50 Results per page</option>
            <option value={100}>100 Results per page</option>
          </select>
        </div>

        {/* Sorting */}
        <div className="space-y-6 pt-6 border-t border-gray-50">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <FiZap className="w-3 h-3" />
              Sort By
            </label>
            <select
              value={localParams.sort || "relevance"}
              onChange={(e) => setLocalParams({ ...localParams, sort: e.target.value })}
              className="w-full bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 transition-all outline-none cursor-pointer appearance-none"
            >
              <option value="relevance">Relevance</option>
              <option value="is-referenced-by-count">Citation Count</option>
              <option value="published">Publication Date</option>
              <option value="issued">Issued Date</option>
              <option value="references-count">References Count</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
              {localParams.order === "asc" ? (
                <FiArrowUp className="w-3 h-3" />
              ) : (
                <FiArrowDown className="w-3 h-3" />
              )}
              Sort Order
            </label>
            <div className="flex bg-gray-50 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setLocalParams({ ...localParams, order: "desc" })}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  localParams.order === "desc" || !localParams.order
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                Descending
              </button>
              <button
                type="button"
                onClick={() => setLocalParams({ ...localParams, order: "asc" })}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  localParams.order === "asc"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                Ascending
              </button>
            </div>
          </div>
        </div>

        {/* Target Source */}
        <div className="space-y-3 pt-6 border-t border-gray-50">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <FiTarget className="w-3 h-3" />
            Import Destination
          </label>
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="w-full bg-slate-900 text-white border-none rounded-2xl px-4 py-4 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all outline-none shadow-xl shadow-slate-200"
          >
            <option value="">Select source to import to...</option>
            {availableSources.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-[9px] text-gray-400 px-1 italic">
            Imported papers will be associated with this search source.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-gray-50/50 border-t border-gray-50">
        <Button
          onClick={onSearch}
          isLoading={isLoading}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
        >
          <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
          Apply Explorer Filters
        </Button>
      </div>
    </aside>
  );
}
