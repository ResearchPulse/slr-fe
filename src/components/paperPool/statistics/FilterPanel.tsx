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
    <div className="bg-surface-white p-5 rounded-xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 bg-slate-900 text-white rounded-xl flex items-center justify-center">
          <FiFilter className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary uppercase tracking-tight">
            Dashboard <span className="text-accent">Filters</span>
          </h2>
          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.12em] mt-0.5">
            Refine data across all visualizations
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">
            Source
          </label>
          <div className="w-56">
            <Select
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
              className="rounded-xl border border-border focus:border-accent transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">
            Year Range
          </label>
          <div className="flex items-center gap-2">
            <Input
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
              className="w-24 rounded-xl border border-border focus:border-accent text-sm"
            />
            <span className="text-slate-300 font-bold">-</span>
            <Input
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
              className="w-24 rounded-xl border border-border focus:border-accent text-sm"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={onReset}
          className="rounded-xl text-text-secondary hover:text-primary-hover hover:bg-primary-light h-10 px-3 font-semibold uppercase tracking-[0.1em] text-[10px]"
        >
          <FiRefreshCw className="mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
