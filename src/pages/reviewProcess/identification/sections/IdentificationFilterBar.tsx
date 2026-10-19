import { FiSearch } from "react-icons/fi";
import Select from "../../../../components/ui/Select";

type FilterTone = "blue" | "emerald";

interface IdentificationFilterBarProps {
  protocolId?: string;
  searchInput: string;
  yearInput: string;
  searchSourceInput: string;
  onSearchInputChange: (value: string) => void;
  onYearInputChange: (value: string) => void;
  onSearchSourceInputChange: (value: string) => void;
  onSearch: (value: string) => void;
  onYearFilter: (value: number | undefined) => void;
  onSearchSourceFilter: (value: string | undefined) => void;
  onClearFilters: () => void;
  searchPlaceholder?: string;
  tone?: FilterTone;
}

const toneClasses: Record<
  FilterTone,
  { ring: string; border: string; button: string }
> = {
  blue: {
    ring: "focus-visible:ring-primary/20",
    border: "focus-visible:border-primary",
    button: "bg-primary hover:bg-primary-hover",
  },
  emerald: {
    ring: "focus-visible:ring-success/20",
    border: "focus-visible:border-success",
    button: "bg-success hover:bg-success/90",
  },
};

export default function IdentificationFilterBar({
  searchInput,
  yearInput,
  searchSourceInput,
  onSearchInputChange,
  onYearInputChange,
  onSearchSourceInputChange,
  onSearch,
  onYearFilter,
  onSearchSourceFilter,
  onClearFilters,
  searchPlaceholder = "Search by title, author, DOI...",
  tone = "blue",
}: IdentificationFilterBarProps) {
  const hasFilters = !!(searchInput || yearInput || searchSourceInput);
  const styles = toneClasses[tone];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-60">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          aria-label="Search papers by title, author, or DOI"
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch(searchInput);
            }
          }}
          className={`min-h-11 w-full rounded-xl border border-border bg-surface-white py-2 pl-10 pr-4 text-sm text-text-primary outline-none focus-visible:ring-2 motion-reduce:transition-none ${styles.ring} ${styles.border}`}
        />
      </div>

      <button
        type="button"
        onClick={() => onSearch(searchInput)}
        className={`inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none ${styles.ring} ${styles.button}`}
      >
        Search
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        aria-label="Filter by year"
        placeholder="Year"
        value={yearInput}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
          onYearInputChange(digits);
          const parsedYear = digits.length === 4 ? Number(digits) : undefined;
          onYearFilter(
            parsedYear !== undefined && parsedYear >= 1900 && parsedYear < 2100
              ? parsedYear
              : undefined,
          );
        }}
        className={`min-h-11 w-24 rounded-xl border border-border bg-surface-white px-3 py-2 text-sm text-text-primary outline-none focus-visible:ring-2 motion-reduce:transition-none ${styles.ring} ${styles.border}`}
      />

      <Select
        aria-label="Filter by source"
        value={searchSourceInput}
        onChange={(e) => {
          const nextValue = e.target.value;
          onSearchSourceInputChange(nextValue);
          onSearchSourceFilter(nextValue || undefined);
        }}
        options={[{ value: "", label: "All sources" }]}
        className="min-w-[190px] max-w-[280px]"
      />

      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
