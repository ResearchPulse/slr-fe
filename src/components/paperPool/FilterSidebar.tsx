import Select from "../ui/Select";
import { useEffect, useRef, useState } from "react";
import {
  FiChevronDown,
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
  availablePaperSources: string[];
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
  availablePaperSources,
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
  const [isFullTextOpen, setIsFullTextOpen] = useState(false);
  const fullTextDropdownRef = useRef<HTMLDivElement>(null);
  const fullTextOptions = [
    { value: "all", label: "Any Fulltext Status" },
    { value: "has", label: "Has Fulltext PDF" },
    { value: "missing", label: "Missing Fulltext PDF" },
  ] as const;

  useEffect(() => {
    if (!isFullTextOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!fullTextDropdownRef.current?.contains(event.target as Node)) {
        setIsFullTextOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullTextOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isFullTextOpen]);

  if (isCollapsed) {
    return (
      <aside className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-white p-3 shadow-sm motion-safe:transition-[width] motion-safe:duration-300 motion-reduce:transition-none lg:sticky lg:top-4 lg:w-16 lg:h-full lg:flex-col lg:py-6">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex min-h-11 lg:min-h-10 min-w-11 items-center justify-center rounded-xl border border-border bg-surface-white text-text-secondary motion-safe:transition-colors motion-reduce:transition-none hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:mb-8"
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
      <aside className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-surface-white motion-safe:transition-[width] motion-safe:duration-300 motion-reduce:transition-none lg:sticky lg:top-4 lg:h-full lg:w-[272px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3.5 py-3 sm:px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/20 bg-primary-light text-accent">
            <FiFilter className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Filters
            </h3>
            <p className="text-xs text-text-secondary">
              Refine Paper Pool
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex min-h-11 lg:min-h-10 min-w-11 items-center justify-center rounded-xl text-text-secondary motion-safe:transition-colors motion-reduce:transition-none hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Collapse filters"
        >
          <FiChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Filter Content */}
      <div className="space-y-2.5 p-3">
        {/* Search Input */}
        <div className="space-y-1.5">
          <label className="px-0.5 text-xs font-medium text-text-secondary">
            Keywords
          </label>
          <div className="relative group">
            <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted motion-safe:transition-colors motion-reduce:transition-none group-focus-within:text-accent" />
            <input
              value={filters.keyword}
              onChange={(e) =>
                onChange({ ...filters, keyword: e.target.value })
              }
              placeholder="Search concepts..."
              className="min-h-11 lg:min-h-10 w-full rounded-xl border border-border bg-surface-white pl-10 pr-3.5 text-sm text-text-primary outline-none motion-safe:transition-colors motion-reduce:transition-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        {/* Year Range */}
        <div className="space-y-1.5">
          <label className="px-0.5 text-xs font-medium text-text-secondary">
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
                className="min-h-11 lg:min-h-10 w-full rounded-xl border border-border bg-surface-white px-3.5 text-sm text-text-primary outline-none motion-safe:transition-colors motion-reduce:transition-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
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
                className="min-h-11 lg:min-h-10 w-full rounded-xl border border-border bg-surface-white px-3.5 text-sm text-text-primary outline-none motion-safe:transition-colors motion-reduce:transition-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Source & Batch */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="px-0.5 text-xs font-medium text-text-secondary">
              Paper Source
            </label>
            <Select
              value={filters.paperSource}
              onChange={(e) =>
                onChange({ ...filters, paperSource: e.target.value })
              }
              className="min-h-11 lg:min-h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface-white px-3.5 text-sm font-medium text-text-primary outline-none motion-safe:transition-colors motion-reduce:transition-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="all">All Paper Sources</option>
              {availablePaperSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="px-0.5 text-xs font-medium text-text-secondary">
              Search Source
            </label>
            <Select
              value={filters.searchSourceId}
              onChange={(e) =>
                onChange({ ...filters, searchSourceId: e.target.value })
              }
              className="min-h-11 lg:min-h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface-white px-3.5 text-sm font-medium text-text-primary outline-none motion-safe:transition-colors motion-reduce:transition-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="all">All Sources</option>
              {availableSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="px-0.5 text-xs font-medium text-text-secondary">
              Import Batch
            </label>
            <Select
              value={filters.importBatchId}
              onChange={(e) =>
                onChange({ ...filters, importBatchId: e.target.value })
              }
              className="min-h-11 lg:min-h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface-white px-3.5 text-sm font-medium text-text-primary outline-none motion-safe:transition-colors motion-reduce:transition-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="all">All Batches</option>
              {availableBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="px-0.5 text-xs font-medium text-text-secondary">
              DOI Availability
            </label>
            <Select
              value={filters.doiState}
              onChange={(e) =>
                onChange({
                  ...filters,
                  doiState: e.target.value as PaperPoolFilters["doiState"],
                })
              }
              className="min-h-11 lg:min-h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface-white px-3.5 text-sm font-medium text-text-primary outline-none motion-safe:transition-colors motion-reduce:transition-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="all">Any DOI Status</option>
              <option value="has">Has DOI</option>
              <option value="missing">Missing DOI</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="px-0.5 text-xs font-medium text-text-secondary">
              Fulltext Availability
            </label>
            <div className="relative" ref={fullTextDropdownRef}>
              <button
                type="button"
                aria-label="Fulltext Availability"
                aria-haspopup="listbox"
                aria-expanded={isFullTextOpen}
                aria-controls="fulltext-status-options"
                onClick={() => setIsFullTextOpen((open) => !open)}
                className="flex min-h-11 lg:min-h-10 w-full items-center justify-between rounded-xl border border-border bg-surface-white px-3.5 text-left text-sm font-medium text-text-primary outline-none motion-safe:transition-colors motion-reduce:transition-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <span>
                  {fullTextOptions.find(
                    (option) => option.value === filters.fullTextState,
                  )?.label}
                </span>
                <FiChevronDown className="h-4 w-4 text-text-secondary" />
              </button>
              {isFullTextOpen && (
                <div
                  id="fulltext-status-options"
                  role="listbox"
                  aria-label="Fulltext status"
                  className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface-white p-1 shadow-lg"
                >
                  {fullTextOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={filters.fullTextState === option.value}
                      onClick={() => {
                        onChange({ ...filters, fullTextState: option.value });
                        setIsFullTextOpen(false);
                      }}
                      className={`min-h-11 lg:min-h-10 w-full rounded-lg px-3.5 py-2 text-left text-sm motion-safe:transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 ${
                        filters.fullTextState === option.value
                          ? "bg-primary text-white"
                          : "text-text-primary hover:bg-bg-secondary"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* State Filters */}
        <div className="space-y-1 border-t border-border pt-3">
          <label className="group flex min-h-11 lg:min-h-10 cursor-pointer items-center gap-3 rounded-xl p-2 motion-safe:transition-colors motion-reduce:transition-none hover:bg-bg-secondary focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary/30">
            <input
              type="checkbox"
              checked={filters.onlyUnused}
              onChange={(e) =>
                onChange({ ...filters, onlyUnused: e.target.checked })
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-text-secondary motion-safe:transition-colors motion-reduce:transition-none group-hover:text-text-primary">
              Only Unused Papers
            </span>
          </label>
          <label className="group flex min-h-11 lg:min-h-10 cursor-pointer items-center gap-3 rounded-xl p-2 motion-safe:transition-colors motion-reduce:transition-none hover:bg-bg-secondary focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary/30">
            <input
              type="checkbox"
              checked={filters.recentlyImported}
              onChange={(e) =>
                onChange({ ...filters, recentlyImported: e.target.checked })
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-text-secondary motion-safe:transition-colors motion-reduce:transition-none group-hover:text-text-primary">
              Recently Imported
            </span>
          </label>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="space-y-1.5 border-t border-border bg-bg-primary p-3">
        <Button
          variant="secondary"
          onClick={onAddToProcess}
          className="min-h-11 lg:min-h-10 w-full rounded-xl text-xs font-semibold"
        >
          <FiLayers className="w-4 h-4 mr-2" />
          Add to Review Process
        </Button>
        <Button
          onClick={onSaveCurrent}
          isLoading={isSaving}
          className="min-h-11 lg:min-h-10 w-full rounded-xl text-xs font-semibold"
        >
          <FiSave className="w-4 h-4 mr-2" />
          Save As Collection
        </Button>
        <button
          onClick={onReset}
          className="flex min-h-11 lg:min-h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-medium text-text-secondary motion-safe:transition-colors motion-reduce:transition-none hover:bg-surface-white hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
        >
          <FiRotateCcw className="w-3.5 h-3.5" />
          Reset All Filters
        </button>
      </div>
    </aside>
  );
}
