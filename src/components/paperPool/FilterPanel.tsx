import type { PaperPoolFilterOption, PaperPoolFilters } from "./types";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Button from "../ui/Button";

interface FilterPanelProps {
  filters: PaperPoolFilters;
  availableSources: PaperPoolFilterOption[];
  availableBatches: PaperPoolFilterOption[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onChange: (next: PaperPoolFilters) => void;
  onReset: () => void;
}

export default function FilterPanel({
  filters,
  availableSources,
  availableBatches,
  isCollapsed,
  onToggleCollapse,
  onChange,
  onReset,
}: FilterPanelProps) {
  if (isCollapsed) {
    return (
      <aside className="bg-surface-white border border-border rounded-[4px] p-2 sticky top-4 h-fit">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-1 rounded-[4px] px-2 py-3 text-xs font-semibold text-text-secondary hover:bg-bg-secondary"
          aria-label="Expand filters"
        >
          <FiChevronRight className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="bg-surface-white border border-border rounded-[4px] p-4 space-y-4 sticky top-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
          <p className="text-xs text-text-secondary">
            Refine project paper pool
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex items-center justify-center rounded-[4px] p-1.5 text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          aria-label="Collapse filters"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-text-primary">Keyword</label>
        <input
          value={filters.keyword}
          onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
          placeholder="e.g. machine learning"
          className="w-full rounded-[4px] border border-border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-primary">
            Year From
          </label>
          <input
            type="number"
            value={filters.yearFrom ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                yearFrom: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full rounded-[4px] border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-primary">
            Year To
          </label>
          <input
            type="number"
            value={filters.yearTo ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                yearTo: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full rounded-[4px] border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-text-primary">
          Search Source ID
        </label>
        <select
          value={filters.searchSourceId}
          onChange={(e) =>
            onChange({ ...filters, searchSourceId: e.target.value })
          }
          className="w-full rounded-[4px] border border-border px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          {availableSources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-text-primary">
          Import Batch
        </label>
        <select
          value={filters.importBatchId}
          onChange={(e) =>
            onChange({ ...filters, importBatchId: e.target.value })
          }
          className="w-full rounded-[4px] border border-border px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          {availableBatches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-text-primary">
          DOI State
        </label>
        <select
          value={filters.doiState}
          onChange={(e) =>
            onChange({
              ...filters,
              doiState: e.target.value as PaperPoolFilters["doiState"],
            })
          }
          className="w-full rounded-[4px] border border-border px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="has">Has DOI</option>
          <option value="missing">Missing DOI</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-text-primary">
          Full-text
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
          className="w-full rounded-[4px] border border-border px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="has">Has PDF</option>
          <option value="missing">No PDF</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={filters.onlyUnused}
            onChange={(e) =>
              onChange({ ...filters, onlyUnused: e.target.checked })
            }
          />
          Papers not yet used in any review
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={filters.recentlyImported}
            onChange={(e) =>
              onChange({ ...filters, recentlyImported: e.target.checked })
            }
          />
          Recently imported batches only
        </label>
      </div>

      <Button variant="outline" className="w-full" onClick={onReset}>
        Reset Filters
      </Button>
    </aside>
  );
}
