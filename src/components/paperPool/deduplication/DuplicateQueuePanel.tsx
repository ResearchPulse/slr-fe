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
    <div className="lg:col-span-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary">
          Duplicate Pairs
          <span className="ml-2 text-sm font-normal text-text-secondary">
            ({filteredPairs.length})
          </span>
        </h3>
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className={`p-1.5 rounded-xl transition-colors ${
            showFilters
              ? "bg-blue-100 text-accent"
              : "text-text-secondary hover:text-text-secondary hover:bg-bg-secondary"
          }`}
          title="Toggle filters"
        >
          <FiFilter className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by paper title..."
          className="rounded-xl border border-border bg-surface-white py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full pl-9 pr-3"
        />
      </div>

      {/* Filter & Sort controls */}
      {showFilters && (
        <div className="space-y-2 mb-3 p-3 bg-bg-primary rounded-xl border border-border">
          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_BUTTONS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => handleFilterChange(key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === key
                    ? "bg-blue-100 text-accent border border-accent/30"
                    : "bg-surface-white text-text-secondary border border-border hover:bg-bg-primary"
                }`}
              >
                {label}
                <span className="ml-1 opacity-70">{count}</span>
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as DuplicateSortType)}
            className="rounded-xl border border-border bg-surface-white px-2 py-1.5 text-xs focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full"
          >
            <option value="similarity-desc">Highest similarity first</option>
            <option value="similarity-asc">Lowest similarity first</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      )}

      {/* Pairs list */}
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {filteredPairs.length > 0 ? (
          filteredPairs.map((pair) => {
            const isSelected = selectedPair?.id === pair.id;
            const isResolved = pair.status === "resolved";
            const confidence = getConfidenceLevel(pair.similarityScore);
            const confidenceInfo = CONFIDENCE_LABELS[confidence];

            return (
              <button
                key={pair.id}
                onClick={() => onSelectPair(pair)}
                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all group ${
                  isSelected
                    ? "border-accent bg-primary-light shadow-none"
                    : isResolved
                      ? "border-border bg-bg-primary hover:border-border"
                      : "border-border hover:border-border bg-surface-white"
                }`}
              >
                {/* Top row: score + confidence + status */}
                <div className="flex items-center justify-between mb-2">
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
                  <div>
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                      {pair.methodText}
                    </span>
                  </div>
                  {isResolved ? (
                    pair.resolvedDecision === "cancel" ? (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                        Duplicate Removed
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                        Not Duplicate
                      </span>
                    )
                  ) : (
                    <span
                      className={`text-xs font-medium ${confidenceInfo.color}`}
                    >
                      {confidenceInfo.label}
                    </span>
                  )}
                </div>

                {/* Paper title (Original) */}
                <p
                  className={`text-sm font-medium line-clamp-2 mb-1.5 ${
                    isResolved ? "text-text-secondary" : "text-text-primary"
                  }`}
                >
                  {pair.originalPaper.title}
                </p>

                {/* Source badges */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="px-2 py-0.5 bg-primary-light text-accent rounded">
                    {pair.originalPaper.source}
                  </span>
                  <span className="text-text-secondary">vs</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">
                    {pair.duplicatePaper.source}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-8 text-text-secondary">
            <FiSearch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No pairs match your filters</p>
            <button
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
              }}
              className="text-xs text-accent hover:text-primary-hover mt-1"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
