import Select from "../../ui/Select";
// Duplicate Pairs Queue Panel — left sidebar with filtering, sorting, search

import { useMemo, useState, useCallback } from "react";
import { FiSearch, FiFilter } from "react-icons/fi";
import type {
  DuplicatePair,
  DuplicateFilterType,
  DuplicateSortType,
} from "../../../types/deduplication";
import {
  getSimilarityColor,
  getSimilarityTextColor,
  getConfidenceLevel,
} from "../../../pages/reviewProcess/identification/utils";
import {
  CONFIDENCE_LABELS,
  SIMILARITY_THRESHOLDS,
} from "../../../pages/reviewProcess/identification/constants";

interface DuplicateQueuePanelProps {
  duplicatePairs: DuplicatePair[];
  selectedPair: DuplicatePair | null;
  onSelectPair: (pair: DuplicatePair) => void;
}

export default function DuplicateQueuePanel({
  duplicatePairs,
  selectedPair,
  onSelectPair,
}: DuplicateQueuePanelProps) {
  const [filter, setFilter] = useState<DuplicateFilterType>("all");
  const [sort, setSort] = useState<DuplicateSortType>("similarity-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Memoized filter + sort + search
  const filteredPairs = useMemo(() => {
    let result = [...duplicatePairs];

    // Apply filter
    switch (filter) {
      case "unresolved":
        result = result.filter((p) => p.status === "pending");
        break;
      case "resolved":
        result = result.filter((p) => p.status === "resolved");
        break;
      case "high-confidence":
        result = result.filter(
          (p) => p.similarityScore >= SIMILARITY_THRESHOLDS.HIGH,
        );
        break;
    }

    // Apply search (searches in both paper titles)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.originalPaper.title.toLowerCase().includes(q) ||
          p.duplicatePaper.title.toLowerCase().includes(q),
      );
    }

    // Apply sort
    switch (sort) {
      case "similarity-desc":
        result.sort((a, b) => b.similarityScore - a.similarityScore);
        break;
      case "similarity-asc":
        result.sort((a, b) => a.similarityScore - b.similarityScore);
        break;
      case "newest":
        // Use pair id as proxy for order since we don't have timestamps
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
    }

    return result;
  }, [duplicatePairs, filter, sort, searchQuery]);

  const filterCounts = useMemo(() => {
    const unresolved = duplicatePairs.filter(
      (p) => p.status === "pending",
    ).length;
    const resolved = duplicatePairs.filter(
      (p) => p.status === "resolved",
    ).length;
    const highConf = duplicatePairs.filter(
      (p) => p.similarityScore >= SIMILARITY_THRESHOLDS.HIGH,
    ).length;
    return { all: duplicatePairs.length, unresolved, resolved, highConf };
  }, [duplicatePairs]);

  const handleFilterChange = useCallback((newFilter: DuplicateFilterType) => {
    setFilter(newFilter);
  }, []);

  const FILTER_BUTTONS: {
    key: DuplicateFilterType;
    label: string;
    count: number;
  }[] = [
    { key: "all", label: "All", count: filterCounts.all },
    { key: "unresolved", label: "Pending", count: filterCounts.unresolved },
    { key: "resolved", label: "Done", count: filterCounts.resolved },
    { key: "high-confidence", label: "High", count: filterCounts.highConf },
  ];

  return (
    <div className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-4 sm:px-5">
        <h3 className="font-semibold text-text-primary">
          Duplicate Pairs
          <span className="ml-2 text-xs font-normal text-text-secondary">
            {filteredPairs.length}
          </span>
        </h3>
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
            showFilters
              ? "bg-primary-light text-accent"
              : "text-text-secondary hover:text-text-secondary hover:bg-bg-secondary"
          }`}
          title="Toggle filters"
          aria-label="Toggle filters"
          aria-pressed={showFilters}
        >
          <FiFilter className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative px-4 pb-3 sm:px-5">
        <FiSearch className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by paper title..."
          className="min-h-10 w-full rounded-lg border border-border bg-surface-white py-2 pl-9 pr-3 text-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
        />
      </div>

      {/* Filter & Sort controls */}
      {showFilters && (
        <div className="mx-4 mb-3 space-y-2 rounded-lg bg-bg-primary p-3 sm:mx-5">
          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_BUTTONS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => handleFilterChange(key)}
                className={`min-h-9 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none ${
                  filter === key
                    ? "bg-primary-light text-accent border border-accent/30"
                    : "bg-surface-white text-text-secondary border border-border hover:bg-bg-primary"
                }`}
              >
                {label}
                <span className="ml-1 opacity-70">{count}</span>
              </button>
            ))}
          </div>

          {/* Sort */}
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as DuplicateSortType)}
            className="min-h-10 w-full rounded-xl border border-border bg-surface-white px-3 py-1.5 text-xs text-text-primary outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
          >
            <option value="similarity-desc">Highest similarity first</option>
            <option value="similarity-asc">Lowest similarity first</option>
            <option value="newest">Newest first</option>
          </Select>
        </div>
      )}

      {/* Pairs list */}
      <div className="max-h-[440px] flex-1 overflow-y-auto px-2 pb-2 sm:px-3 lg:max-h-[620px]">
        {filteredPairs.length > 0 ? (
          filteredPairs.map((pair) => {
            const isSelected = selectedPair?.id === pair.id;
            const isResolved = pair.status === "resolved";
            const confidence = getConfidenceLevel(pair.similarityScore);
            const confidenceInfo = CONFIDENCE_LABELS[confidence];
            const confidenceColor =
              confidence === "high"
                ? "text-accent"
                : confidence === "medium"
                  ? "text-warning"
                  : "text-text-secondary";

            return (
              <button
                key={pair.id}
                onClick={() => onSelectPair(pair)}
                className={`group w-full border-0 border-b border-border border-l-2 px-3 py-3 text-left transition-[border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 motion-reduce:transition-none ${
                  isSelected
                    ? "border-l-accent bg-primary-light/70"
                    : isResolved
                      ? "border-l-transparent bg-bg-primary/50 hover:bg-bg-primary"
                      : "border-l-transparent bg-surface-white hover:bg-bg-primary/60"
                }`}
              >
                {/* Top row: score + confidence + status */}
                <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-14 h-1.5 rounded-full ${getSimilarityColor(pair.similarityScore)}`}
                    />
                    <span
                      className={`text-xs font-bold ${getSimilarityTextColor(pair.similarityScore)}`}
                    >
                      {pair.similarityScore}%
                    </span>
                  </div>
                  <div className="ml-auto">
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium text-accent">
                      {pair.methodText}
                    </span>
                  </div>
                  {isResolved ? (
                    pair.resolvedDecision === "cancel" ? (
                      <span className="rounded-full bg-error/10 px-2 py-0.5 text-[11px] font-medium text-error">
                        Duplicate Removed
                      </span>
                    ) : (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                        Not Duplicate
                      </span>
                    )
                  ) : (
                    <span
                      className={`text-[11px] font-medium ${confidenceColor}`}
                    >
                      {confidenceInfo.label}
                    </span>
                  )}
                </div>

                {/* Paper title (Original) */}
                <p
                  className={`mb-2 line-clamp-2 text-sm font-medium ${
                    isResolved ? "text-text-secondary" : "text-text-primary"
                  }`}
                >
                  {pair.originalPaper.title}
                </p>

                {/* Source badges */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="max-w-[45%] truncate rounded bg-primary-light px-2 py-0.5">
                    {pair.originalPaper.source}
                  </span>
                  <span className="text-text-secondary">vs</span>
                  <span className="max-w-[45%] truncate rounded bg-bg-secondary px-2 py-0.5 text-text-secondary">
                    {pair.duplicatePaper.source}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-8 text-text-secondary">
            <FiSearch className="w-8 h-8 mx-auto mb-2 text-text-secondary/50" />
            <p className="text-sm">No pairs match your filters</p>
            <button
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
              }}
              className="mt-1 min-h-11 rounded-lg px-3 text-xs text-accent hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
