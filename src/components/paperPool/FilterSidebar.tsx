import {
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRotateCcw,
  FiSave,
  FiSearch,
  FiCalendar,
  FiDatabase,
  FiLayers,
} from "react-icons/fi";
import Button from "../ui/Button";
import type { PaperPoolFilterOption, PaperPoolFilters } from "./types";

interface FilterSidebarProps {
  filters: PaperPoolFilters;
  availableSources: PaperPoolFilterOption[];
  availableBatches: PaperPoolFilterOption[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onChange: (next: PaperPoolFilters) => void;
  onReset: () => void;
  onSaveCurrent: () => void;
  onAddToProcess: () => void;
  isSaving?: boolean;
}

export default function FilterSidebar({
  filters,
  availableSources,
  availableBatches,
  isCollapsed,
  onToggleCollapse,
  onChange,
  onReset,
  onSaveCurrent,
  onAddToProcess,
  isSaving = false,
}: FilterSidebarProps) {
  if (isCollapsed) {
    return (
      <aside className="w-16 flex flex-col items-center py-6 bg-surface-white border border-border rounded-[4px] sticky top-4 h-[calc(100vh-120px)] shadow-none transition-all duration-300">
        <button
          onClick={onToggleCollapse}
          className="p-3 bg-bg-secondary text-text-primary border border-border rounded-[4px] hover:bg-surface-white transition-colors mb-8"
          title="Expand Filters"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
        <div className="flex flex-col gap-6 text-text-secondary">
          <FiFilter className="w-5 h-5" />
          <FiSearch className="w-5 h-5" />
          <FiCalendar className="w-5 h-5" />
          <FiDatabase className="w-5 h-5" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 flex flex-col bg-surface-white border border-border rounded-[4px] sticky top-4 h-[calc(100vh-120px)] shadow-none overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-white border border-border rounded-[4px] flex items-center justify-center text-accent shadow-sm">
            <FiFilter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">
              Filters
            </h3>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
              Refine Paper Pool
            </p>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-bg-primary rounded-[4px] text-text-secondary hover:text-text-primary transition-colors"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Search Input */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
            Keywords
          </label>
          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-accent transition-colors" />
            <input
              value={filters.keyword}
              onChange={(e) =>
                onChange({ ...filters, keyword: e.target.value })
              }
              placeholder="Search concepts..."
              className="w-full bg-surface-white border border-border focus:border-accent shadow-sm rounded-[4px] pl-11 pr-4 py-3 text-sm font-bold text-text-primary transition-all outline-none shadow-inner"
            />
          </div>
        </div>

        {/* Year Range */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
            Publication Year
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative group">
              <input
                type="number"
                value={filters.yearFrom ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    yearFrom: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="From"
                className="w-full bg-surface-white border border-border focus:border-accent shadow-sm rounded-[4px] px-4 py-3 text-sm font-bold text-text-primary transition-all outline-none"
              />
            </div>
            <div className="relative group">
              <input
                type="number"
                value={filters.yearTo ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    yearTo: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="To"
                className="w-full bg-surface-white border border-border focus:border-accent shadow-sm rounded-[4px] px-4 py-3 text-sm font-bold text-text-primary transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Source & Batch */}
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
              Search Source
            </label>
            <select
              value={filters.searchSourceId}
              onChange={(e) =>
                onChange({ ...filters, searchSourceId: e.target.value })
              }
              className="w-full bg-surface-white border border-border focus:border-accent shadow-sm rounded-[4px] px-4 py-3 text-sm font-bold text-text-primary transition-all outline-none cursor-pointer appearance-none"
            >
              <option value="all">All Sources</option>
              {availableSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
              Import Batch
            </label>
            <select
              value={filters.importBatchId}
              onChange={(e) =>
                onChange({ ...filters, importBatchId: e.target.value })
              }
              className="w-full bg-surface-white border border-border focus:border-accent shadow-sm rounded-[4px] px-4 py-3 text-sm font-bold text-text-primary transition-all outline-none cursor-pointer appearance-none"
            >
              <option value="all">All Batches</option>
              {availableBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
              DOI Availability
            </label>
            <select
              value={filters.doiState}
              onChange={(e) =>
                onChange({
                  ...filters,
                  doiState: e.target.value as PaperPoolFilters["doiState"],
                })
              }
              className="w-full bg-surface-white border border-border focus:border-accent shadow-sm rounded-[4px] px-4 py-3 text-sm font-bold text-text-primary transition-all outline-none cursor-pointer appearance-none"
            >
              <option value="all">Any DOI Status</option>
              <option value="has">Has DOI</option>
              <option value="missing">Missing DOI</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">
              Fulltext Availability
            </label>
            <select
              value={filters.fullTextState}
              onChange={(e) =>
                onChange({
                  ...filters,
                  fullTextState: e.target
                    .value as PaperPoolFilters["fullTextState"],
                })
              }
              className="w-full bg-surface-white border border-border focus:border-accent shadow-sm rounded-[4px] px-4 py-3 text-sm font-bold text-text-primary transition-all outline-none cursor-pointer appearance-none"
            >
              <option value="all">Any Fulltext Status</option>
              <option value="has">Has Fulltext PDF</option>
              <option value="missing">Missing Fulltext PDF</option>
            </select>
          </div>
        </div>

        {/* State Filters */}
        <div className="space-y-3 pt-4 border-t border-border">
          <label className="flex items-center gap-3 p-3 rounded-[4px] hover:bg-bg-primary transition-colors cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.onlyUnused}
              onChange={(e) =>
                onChange({ ...filters, onlyUnused: e.target.checked })
              }
              className="w-5 h-5 rounded-[4px] border border-border text-accent focus:ring-accent transition-all"
            />
            <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">
              Only Unused Papers
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-[4px] hover:bg-bg-primary transition-colors cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.recentlyImported}
              onChange={(e) =>
                onChange({ ...filters, recentlyImported: e.target.checked })
              }
              className="w-5 h-5 rounded-[4px] border border-border text-accent focus:ring-accent transition-all"
            />
            <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">
              Recently Imported
            </span>
          </label>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-bg-primary/50 border-t border-border space-y-3">
        <Button
          variant="secondary"
          onClick={onAddToProcess}
          className="w-full py-4 rounded-[4px] font-black uppercase tracking-widest text-[10px] border-border"
        >
          <FiLayers className="w-4 h-4 mr-2" />
          Add to Review Process
        </Button>
        <Button
          onClick={onSaveCurrent}
          isLoading={isSaving}
          className="w-full py-4 rounded-[4px] font-black uppercase tracking-widest text-[10px] shadow-none shadow-blue-500/20"
        >
          <FiSave className="w-4 h-4 mr-2" />
          Save As Collection
        </Button>
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black text-text-secondary hover:text-text-secondary uppercase tracking-widest transition-colors"
        >
          <FiRotateCcw className="w-3.5 h-3.5" />
          Reset All Filters
        </button>
      </div>
    </aside>
  );
}
