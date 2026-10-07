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
    <div className="bg-surface-white p-8 rounded-2xl border border-border shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-none shadow-slate-200">
          <FiFilter className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">
            Dashboard <span className="text-blue-600">Filters</span>
          </h2>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-0.5">
            Refine data across all visualizations
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-6">
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
              className="rounded-xl border-2 border-slate-50 focus:border-blue-500 transition-all font-bold text-sm"
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
              value={filters.yearFrom || ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  yearFrom: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="w-24 rounded-xl border-2 border-slate-50 focus:border-blue-500 font-bold"
            />
            <span className="text-slate-300 font-bold">-</span>
            <Input
              type="number"
              placeholder="To"
              value={filters.yearTo || ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  yearTo: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-24 rounded-xl border-2 border-slate-50 focus:border-blue-500 font-bold"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={onReset}
          className="rounded-xl text-text-secondary hover:text-blue-600 hover:bg-blue-50 h-11 px-4 font-bold uppercase tracking-widest text-[10px]"
        >
          <FiRefreshCw className="mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
