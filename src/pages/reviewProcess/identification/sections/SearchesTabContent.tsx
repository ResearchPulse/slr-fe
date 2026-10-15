// Searches (Strategy Documentation) Tab Content

import { useMemo, useState } from "react";
import {
  FiSearch,
  FiFileText,
  FiDatabase,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import Button from "../../../../components/ui/Button";

import type { SearchExecutionResponse } from "../../../../types/searchExecution";
import { SearchExecutionType } from "../../../../types/identification";
import { formatRelativeTime } from "../../../../utils/dateFormat";
import EmptyState from "../../../../components/ui/EmptyState";

interface SearchesTabContentProps {
  searchExecutions: SearchExecutionResponse[];
  onCreateStrategy: () => void;
}

export default function SearchesTabContent({
  searchExecutions,
  onCreateStrategy,
}: SearchesTabContentProps) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const filteredSearches = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return searchExecutions.filter((search) => {
      const matchesQuery =
        !normalizedQuery ||
        `${search.searchSource} ${search.searchQuery ?? ""}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      return matchesQuery && (!source || search.searchSource === source);
    });
  }, [query, searchExecutions, source]);

  return (
    <div>
      {/* Info Banner */}
      <div className="bg-bg-primary border border-border rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <FiFileText className="w-5 h-5 text-text-secondary mt-0.5" />
          <div>
            <h4 className="font-semibold text-text-primary mb-1">
              Search Strategy Documentation
            </h4>
            <p className="text-sm text-text-secondary">
              This section is for documenting your literature search strategies
              for audit and reporting purposes. Records are imported via RIS
              files in the Import Batches tab.
            </p>
          </div>
        </div>
      </div>

      {/* Minimal Toolbar - Documentation Focus */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              aria-label="Filter documented searches"
              placeholder="Filter documented searches..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-border py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-[300px]"
            />
          </div>
          <select
            aria-label="Filter by search source"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="min-h-11 rounded-xl border border-border bg-surface-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">All sources</option>
            {[...new Set(searchExecutions.map((item) => item.searchSource))]
              .sort((a, b) => a.localeCompare(b))
              .map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onCreateStrategy}
          className="flex items-center gap-2"
        >
          <FiFileText className="w-4 h-4" />
          Document Search Strategy
        </Button>
      </div>

      {filteredSearches.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Source
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Query Summary
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Executed Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Results
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSearches.map((search) => (
                <tr
                  key={search.id}
                  className="border-b border-border hover:bg-bg-primary transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <FiDatabase className="w-4 h-4 text-accent" />
                      <span className="font-medium text-text-primary">
                        {search.searchSource}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="max-w-md">
                      <p
                        className="text-sm text-text-primary truncate"
                        title={search.searchQuery || ""}
                      >
                        {search.searchQuery}
                      </p>
                      <button
                        type="button"
                        aria-label={`Copy query from ${search.searchSource}`}
                        onClick={() =>
                          void navigator.clipboard
                            ?.writeText(search.searchQuery ?? "")
                            .catch(() => undefined)
                        }
                        className="mt-1 flex items-center gap-1 rounded text-xs text-accent hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <FiCopy className="w-3 h-3" />
                        Copy query
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-text-secondary">
                    {formatRelativeTime(search.executedAt)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-lg font-semibold text-green-600">
                      {search.resultCount}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700`}
                    >
                      <FiCheck className="w-3 h-3" />
                      {search.type === SearchExecutionType.DatabaseSearch
                        ? "Database Search"
                        : "Manual Import"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<FiFileText className="w-16 h-16 text-gray-300" />}
          title={searchExecutions.length > 0 && (query || source) ? "No Matching Searches" : "No Search Strategy Documented Yet"}
          description={searchExecutions.length > 0 && (query || source)
            ? "Try changing the search text or source filter."
            : "Document your literature search strategies here for audit and reporting purposes. Imported records remain available in the Import Batches tab."}
          actionLabel="Document Search Strategy"
          onAction={onCreateStrategy}
        />
      )}
    </div>
  );
}
