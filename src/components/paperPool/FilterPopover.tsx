import Select from "../ui/Select";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import {
  FiChevronDown,
  FiFilter,
  FiRotateCcw,
  FiSearch,
  FiLayers,
  FiCheck,
  FiPlus,
  FiSettings,
  FiX,
} from "react-icons/fi";
import Button from "../ui/Button";
import type {
  PaperPoolFilterOption,
  PaperPoolFilterSetting,
  PaperPoolFilters,
} from "./types";

interface FilterPopoverProps {
  filters: PaperPoolFilters;
  availablePaperSources: string[];
  availableSources: PaperPoolFilterOption[];
  availableBatches: PaperPoolFilterOption[];
  onChange: (next: PaperPoolFilters) => void;
  onReset: () => void;
  onSaveCurrent: () => void;
  onAddToProcess: () => void;
  savedFilters: PaperPoolFilterSetting[];
  selectedFilterId: string | null;
  onSelectSavedFilter: (filter: PaperPoolFilterSetting) => void;
  onManageSavedFilters: () => void;
  isSaving?: boolean;
}

export default function FilterPopover({
  filters,
  availablePaperSources,
  availableSources,
  availableBatches,
  onChange,
  onReset,
  onSaveCurrent,
  onAddToProcess,
  savedFilters,
  selectedFilterId,
  onSelectSavedFilter,
  onManageSavedFilters,
  isSaving = false,
}: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 640,
    maxHeight: 640,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [isFullTextOpen, setIsFullTextOpen] = useState(false);
  const fullTextDropdownRef = useRef<HTMLDivElement>(null);
  const fullTextOptions = [
    { value: "all", label: "Any Fulltext Status" },
    { value: "has", label: "Has Fulltext PDF" },
    { value: "missing", label: "Missing Fulltext PDF" },
  ] as const;
  const activeFilterCount = [
    Boolean(filters.keyword.trim()),
    filters.yearFrom != null,
    filters.yearTo != null,
    filters.paperSource !== "all",
    filters.searchSourceId !== "all",
    filters.importBatchId !== "all",
    filters.doiState !== "all",
    filters.fullTextState !== "all",
    filters.onlyUnused,
    filters.recentlyImported,
  ].filter(Boolean).length;

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

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(640, window.innerWidth - 24);
      const left = Math.max(
        12,
        Math.min(rect.right - width, window.innerWidth - width - 12),
      );
      let top = rect.bottom + 8;
      let maxHeight = Math.min(680, window.innerHeight - top - 12);
      if (maxHeight < 360) {
        maxHeight = Math.min(680, window.innerHeight - 24);
        top = Math.max(12, window.innerHeight - maxHeight - 12);
      }
      setPosition({ top, left, width, maxHeight });
    };

    updatePosition();
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setIsFullTextOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      setIsFullTextOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="paper-pool-filter-popover"
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none ${
          isOpen || activeFilterCount > 0
            ? "border-primary bg-primary-light text-primary"
            : "border-border bg-white text-text-primary hover:border-primary/40 hover:bg-bg-secondary"
        }`}
      >
        <FiFilter className="h-4 w-4" aria-hidden="true" />
        Filters
        {activeFilterCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] text-white">
            {activeFilterCount}
          </span>
        )}
        <FiChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen &&
        createPortal(
          <aside
        ref={panelRef}
        id="paper-pool-filter-popover"
        role="dialog"
        aria-label="Paper pool filters and saved views"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: position.maxHeight,
        }}
        className="fixed z-(--z-index-popover) flex flex-col overflow-hidden rounded-xl border border-border bg-surface-white shadow-[0_8px_24px_rgba(18,35,49,0.12)] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none"
      >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
            <FiFilter className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
            <p className="text-xs text-text-secondary">Refine papers and manage saved views</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          aria-label="Close filters"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      <section className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-bg-secondary/40 px-3 py-2" aria-label="Saved views">
        <h4 className="shrink-0 text-[11px] font-semibold text-text-secondary">Saved views</h4>
        <div className="dropdown-scroll-area flex min-w-24 flex-1 items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {savedFilters.length > 0 ? savedFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                onSelectSavedFilter(filter);
                setIsOpen(false);
              }}
              aria-pressed={selectedFilterId === filter.id}
              className={`inline-flex min-h-7 max-w-40 shrink-0 items-center gap-1.5 rounded-md border px-2 text-left text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none ${
                selectedFilterId === filter.id
                  ? "border-primary/30 bg-primary-light text-primary"
                  : "border-border bg-white text-text-secondary hover:border-primary/30 hover:text-text-primary"
              }`}
            >
              <span className="max-w-32 truncate font-medium">{filter.name}</span>
              {selectedFilterId === filter.id && <FiCheck className="h-3 w-3 shrink-0" aria-hidden="true" />}
            </button>
          )) : (
            <span className="text-[11px] text-text-muted">None saved</span>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => {
              onSaveCurrent();
              setIsOpen(false);
            }}
            disabled={isSaving}
            title="Save current view"
            className="inline-flex min-h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          >
            <FiPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              onManageSavedFilters();
              setIsOpen(false);
            }}
            title="Manage saved views"
            className="inline-flex min-h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-text-secondary transition-colors hover:bg-white hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          >
            <FiSettings className="h-3 w-3" aria-hidden="true" />
            Manage
          </button>
        </div>
      </section>

      {/* Filter Content */}
      <div className="dropdown-scroll-area min-h-0 flex-1 grid grid-cols-1 gap-x-4 gap-y-3 overflow-y-auto p-4 custom-scrollbar sm:grid-cols-2">
        {/* Search Input */}
        <div className="space-y-1.5 sm:col-span-2">
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
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:col-span-2 sm:grid-cols-2">
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
        <div className="grid grid-cols-1 gap-2 border-t border-border pt-3 sm:col-span-2 sm:grid-cols-2">
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
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-bg-secondary/50 p-3">
        <Button
          variant="secondary"
          onClick={() => {
            onAddToProcess();
            setIsOpen(false);
          }}
          className="min-h-9 rounded-lg px-3 text-xs font-semibold"
        >
          <FiLayers className="h-4 w-4" aria-hidden="true" />
          Add to Review Process
        </Button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-white hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
        >
          <FiRotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset All Filters
        </button>
      </div>
          </aside>,
          document.body,
        )}
    </>
  );
}
