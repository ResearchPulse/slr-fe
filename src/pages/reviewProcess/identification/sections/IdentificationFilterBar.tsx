import { FiSearch } from "react-icons/fi";

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
    ring: "focus:ring-accent",
    border: "focus:border-accent",
    button: "bg-primary hover:bg-primary-hover",
  },
  emerald: {
    ring: "focus:ring-emerald-500",
    border: "focus:border-emerald-500",
    button: "bg-emerald-600 hover:bg-emerald-700",
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
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch(searchInput);
            }
          }}
          className={`w-full pl-10 pr-4 py-2 border border-border rounded-xl text-sm focus:ring-2 ${styles.ring} ${styles.border}`}
        />
      </div>

      <button
        onClick={() => onSearch(searchInput)}
        className={`px-3 py-2 text-sm text-white rounded-xl transition-colors ${styles.button}`}
      >
        Search
      </button>

      <input
        type="number"
        placeholder="Year"
        value={yearInput}
        onChange={(e) => {
          onYearInputChange(e.target.value);
          const parsedValue = e.target.value
            ? parseInt(e.target.value, 10)
            : undefined;
          if (
            !e.target.value ||
            (parsedValue && parsedValue >= 1900 && parsedValue < 2100)
          ) {
            onYearFilter(parsedValue);
          }
        }}
        className={`w-24 px-3 py-2 border border-border rounded-xl text-sm focus:ring-2 ${styles.ring} ${styles.border}`}
      />

      <select
        value={searchSourceInput}
        onChange={(e) => {
          const nextValue = e.target.value;
          onSearchSourceInputChange(nextValue);
          onSearchSourceFilter(nextValue || undefined);
        }}
        className={`min-w-[190px] max-w-[280px] px-3 py-2 border border-border rounded-xl text-sm focus:ring-2 ${styles.ring} ${styles.border}`}
      >
        <option value="">All sources</option>
      </select>

      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-xl transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
