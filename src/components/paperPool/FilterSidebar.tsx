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
      <aside className="flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm transition-all duration-300 lg:sticky lg:top-4 lg:w-16 lg:h-full lg:flex-col lg:py-6">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-xl border border-border bg-white p-2.5 text-text-secondary transition-colors hover:bg-slate-50 hover:text-accent lg:mb-8"
          title="Expand Filters"
          aria-label="Expand filters"
        >
          <FiChevronRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-5 text-text-muted lg:flex-col lg:gap-6">
          <FiFilter className="h-5 w-5" />
          <FiSearch className="h-5 w-5" />
          <FiCalendar className="h-5 w-5" />
          <FiDatabase className="h-5 w-5" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 lg:sticky lg:top-4 lg:w-80 lg:h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-primary-light text-accent">
            <FiFilter className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Filters
            </h3>
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-secondary">
              Refine Paper Pool
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-slate-50 hover:text-text-primary"
          aria-label="Collapse filters"
        >
          <FiChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Filter Content */}
      <div className="space-y-3 p-3 sm:p-4">
        {/* Search Input */}
        <div className="space-y-1.5">
          <label className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Keywords
          </label>
          <div className="relative group">
            <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent" />
            <input
              value={filters.keyword}
              onChange={(e) =>
                onChange({ ...filters, keyword: e.target.value })
              }
              placeholder="Search concepts..."
              className="h-10 w-full rounded-xl border border-border bg-surface-white pl-10 pr-3.5 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        {/* Year Range */}
        <div className="space-y-1.5">
          <label className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Publication Year
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative group">
              <input
                type="number"
                min={1900}
                max={2100}
                step={1}
                value={filters.yearFrom != null && filters.yearFrom >= 0 ? filters.yearFrom : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !/^\d{0,4}$/.test(value)) return;
                  onChange({
                    ...filters,
                    yearFrom: value ? Number(value) : null,
                  });
                }}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (e.target.value && (value < 1900 || value > 2100)) {
                    onChange({ ...filters, yearFrom: null });
                  }
                }}
                placeholder="From"
                className="h-10 w-full rounded-xl border border-border bg-surface-white px-3.5 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="relative group">
              <input
                type="number"
                min={1900}
                max={2100}
                step={1}
                value={filters.yearTo != null && filters.yearTo >= 0 ? filters.yearTo : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !/^\d{0,4}$/.test(value)) return;
                  onChange({
                    ...filters,
                    yearTo: value ? Number(value) : null,
                  });
                }}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (e.target.value && (value < 1900 || value > 2100)) {
                    onChange({ ...filters, yearTo: null });
                  }
                }}
                placeholder="To"
                className="h-10 w-full rounded-xl border border-border bg-surface-white px-3.5 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
        </div>

        {/* Source & Batch */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              Search Source
            </label>
            <select
              value={filters.searchSourceId}
              onChange={(e) =>
                onChange({ ...filters, searchSourceId: e.target.value })
              }
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface-white px-3.5 text-sm font-medium text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All Sources</option>
              {availableSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              Import Batch
            </label>
            <select
              value={filters.importBatchId}
              onChange={(e) =>
                onChange({ ...filters, importBatchId: e.target.value })
              }
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface-white px-3.5 text-sm font-medium text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All Batches</option>
              {availableBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
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
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface-white px-3.5 text-sm font-medium text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">Any DOI Status</option>
              <option value="has">Has DOI</option>
              <option value="missing">Missing DOI</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
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
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface-white px-3.5 text-sm font-medium text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">Any Fulltext Status</option>
              <option value="has">Has Fulltext PDF</option>
              <option value="missing">Missing Fulltext PDF</option>
            </select>
          </div>
        </div>

        {/* State Filters */}
        <div className="space-y-1 border-t border-border pt-3">
          <label           className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50">
            <input
              type="checkbox"
              checked={filters.onlyUnused}
              onChange={(e) =>
                onChange({ ...filters, onlyUnused: e.target.checked })
              }
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent/20"
            />
            <span className="text-sm text-text-secondary transition-colors group-hover:text-text-primary">
              Only Unused Papers
            </span>
          </label>
          <label           className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50">
            <input
              type="checkbox"
              checked={filters.recentlyImported}
              onChange={(e) =>
                onChange({ ...filters, recentlyImported: e.target.checked })
              }
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent/20"
            />
            <span className="text-sm text-text-secondary transition-colors group-hover:text-text-primary">
              Recently Imported
            </span>
          </label>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="space-y-1.5 border-t border-border bg-slate-50/70 p-3">
        <Button
          variant="secondary"
          onClick={onAddToProcess}
          className="w-full rounded-xl text-xs font-semibold"
        >
          <FiLayers className="w-4 h-4 mr-2" />
          Add to Review Process
        </Button>
        <Button
          onClick={onSaveCurrent}
          isLoading={isSaving}
          className="w-full rounded-xl text-xs font-semibold"
        >
          <FiSave className="w-4 h-4 mr-2" />
          Save As Collection
        </Button>
        <button
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-white hover:text-text-primary"
        >
          <FiRotateCcw className="w-3.5 h-3.5" />
          Reset All Filters
        </button>
      </div>
    </aside>
  );
}
