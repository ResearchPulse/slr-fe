import React from "react";
import { Search } from "lucide-react";
import Select from "../../ui/Select";

interface FiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  year: string;
  onYearChange: (value: string) => void;
  years: string[];
}

const FiltersBar: React.FC<FiltersBarProps> = ({
  searchTerm,
  onSearchChange,
  status,
  onStatusChange,
  year,
  onYearChange,
  years,
}) => {
  return (
    <div className="sticky top-0 z-20 border-b border-border bg-surface-white p-3 sm:p-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4 text-text-muted" />
          </div>
          <input
            type="text"
            aria-label="Search references"
            placeholder="Search title, authors, or origin paper..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block h-11 w-full rounded-xl border border-border bg-surface-white py-2.5 pl-10 pr-4 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-text-tertiary"
          />
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[260px] sm:gap-3">
          <Select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Filter by status"
            className="h-11 text-sm"
            options={[
              { value: "all", label: "All statuses" },
              { value: "0", label: "Detected" },
              { value: "1", label: "Matched" },
              { value: "2", label: "Rejected" },
              { value: "3", label: "Suggested" },
            ]}
          />

          <Select
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
            aria-label="Filter by year"
            className="h-11 text-sm"
            options={[
              { value: "all", label: "All years" },
              ...years.map((value) => ({ value, label: value })),
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;
