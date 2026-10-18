import React from "react";
import { FiFilter, FiRefreshCw } from "react-icons/fi";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import type { PaperStatisticsFilter } from "../../../types/paperStatistics";

interface FilterPanelProps {
  filters: PaperStatisticsFilter;
  onFilterChange: (filters: PaperStatisticsFilter) => void;
  onReset: () => void;
  availableSources: string[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableSources,
}) => {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:gap-6">
      <div className="flex min-w-0 items-center gap-3 lg:w-[min(36%,20rem)] lg:shrink-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-accent">
          <FiFilter className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-text-primary sm:text-base">
            Dashboard filters
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            Refine data across all visualizations
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-end gap-x-3 gap-y-3 p-3 sm:justify-end lg:ml-auto lg:flex-none lg:justify-end">
        <div className="flex min-w-[150px] flex-1 flex-col gap-1.5 sm:max-w-48">
          <label htmlFor="paper-statistics-source" className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.12em]">
            Source
          </label>
          <Select
            id="paper-statistics-source"
            value={filters.source || ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                source: e.target.value || undefined,
              })
            }
            options={[
              { label: "All Sources", value: "" },
              ...availableSources.map((s) => ({ label: s, value: s })),
            ]}
            className="w-full rounded-lg border border-border text-sm focus:border-accent"
          />
        </div>

        <fieldset className="flex min-w-0 flex-col gap-1.5">
          <legend className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.12em]">
            Year Range
          </legend>
          <div className="flex items-center gap-2">
            <Input
              aria-label="Start year"
              type="number"
              placeholder="From"
              min={1900}
              max={2100}
              step={1}
              value={filters.yearFrom != null && filters.yearFrom >= 0 ? filters.yearFrom : ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value && !/^\d{0,4}$/.test(value)) return;
                onFilterChange({
                  ...filters,
                  yearFrom: value ? parseInt(value, 10) : undefined,
                });
              }}
              className="w-[4.5rem] rounded-lg border border-border text-sm focus:border-accent"
            />
            <span aria-hidden="true" className="text-xs text-text-muted">to</span>
            <Input
              aria-label="End year"
              type="number"
              placeholder="To"
              min={1900}
              max={2100}
              step={1}
              value={filters.yearTo != null && filters.yearTo >= 0 ? filters.yearTo : ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value && !/^\d{0,4}$/.test(value)) return;
                onFilterChange({
                  ...filters,
                  yearTo: value ? parseInt(value, 10) : undefined,
                });
              }}
              className="w-[4.5rem] rounded-lg border border-border text-sm focus:border-accent"
            />
          </div>
        </fieldset>

        <Button
          variant="ghost"
          size="md"
          onClick={onReset}
          className="h-10 px-3 normal-case tracking-normal text-text-secondary hover:bg-surface-white hover:text-primary-hover"
        >
          <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
          Reset
        </Button>
      </div>
    </section>
  );
};

export default FilterPanel;
