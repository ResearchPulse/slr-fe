// Search Strategies Panel - PRIMARY ENTRY PATH (with nested ImportBatch)
import { useState } from "react";
import {
  FiPlus,
  FiDatabase,
  FiUpload,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiFileText,
  FiChevronDown,
  FiChevronRight,
  FiFile,
  FiX,
} from "react-icons/fi";
import Button from "../../ui/Button";
import type {
  SearchExecution,
  ImportBatch,
} from "../../../types/identification";

interface SearchStrategiesPanelProps {
  identificationProcessId: string;
  strategies: SearchExecution[];
  importBatches: ImportBatch[]; // All import batches for filtering
  isLoading: boolean;
  onCreateStrategy: () => void;
  onImportToStrategy: (strategyId: string) => void;
  onEditStrategy: (strategyId: string) => void;
  onDeleteStrategy: (strategyId: string) => void;
  onViewImportPapers: (importBatchId: string) => void;
  onDeleteImportBatch?: (importBatchId: string) => void;
  canEdit: boolean;
}

export default function SearchStrategiesPanel({
  strategies,
  importBatches,
  isLoading,
  onCreateStrategy,
  onImportToStrategy,
  onEditStrategy,
  onDeleteStrategy,
  onViewImportPapers,
  onDeleteImportBatch,
  canEdit,
}: SearchStrategiesPanelProps) {
  const [expandedStrategyIds, setExpandedStrategyIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpand = (strategyId: string) => {
    setExpandedStrategyIds((prev) => {
      const next = new Set(prev);
      if (next.has(strategyId)) {
        next.delete(strategyId);
      } else {
        next.add(strategyId);
      }
      return next;
    });
  };

  const getImportBatchesForStrategy = (strategyId: string) => {
    return importBatches.filter(
      (batch) => batch.searchExecutionId === strategyId,
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading search strategies" className="space-y-4">
        {[0, 1].map((item) => (
          <div key={item} className="rounded-xl border border-border bg-surface-white p-4">
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 shrink-0 rounded-lg bg-bg-secondary" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-3 w-24 rounded bg-bg-secondary" />
                <div className="h-4 w-40 max-w-full rounded bg-bg-secondary" />
                <div className="h-3 w-full max-w-lg rounded bg-bg-secondary" />
                <div className="h-3 w-28 rounded bg-bg-secondary" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header with Primary CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-text-primary">
            Search Strategies
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Define search strategies and import papers into them
          </p>
        </div>
        <Button
          onClick={onCreateStrategy}
          className="w-full gap-2 sm:w-auto"
          size="md"
          disabled={!canEdit}
        >
          <FiPlus className="h-4 w-4" />
          Create Search Strategy
          {canEdit && (
            <span className="ml-1 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-primary">
              Recommended
            </span>
          )}
        </Button>
      </div>

      {/* Strategies Accordion List */}
      {strategies.length > 0 ? (
        <div className="space-y-4">
          {strategies.map((strategy) => {
            const strategyBatches = getImportBatchesForStrategy(strategy.id);
            const isExpanded = expandedStrategyIds.has(strategy.id);
            const hasImports = strategyBatches.length > 0;

            return (
              <div
                key={strategy.id}
                className="overflow-hidden rounded-xl border border-border bg-surface-white"
              >
                {/* SearchExecution Header (Always Visible) */}
                <div className="p-4 transition-colors hover:bg-bg-primary">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Expand Toggle + Strategy Info */}
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <button
                        onClick={() => toggleExpand(strategy.id)}
                        className="mt-0.5 rounded-lg p-1 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <FiChevronDown className="w-5 h-5 text-text-secondary" />
                        ) : (
                          <FiChevronRight className="w-5 h-5 text-text-secondary" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span className="break-all text-xs font-medium text-text-secondary">
                          {strategy.id}
                        </span>
                        <div className="mb-1 mt-1 flex flex-wrap items-center gap-2">
                          <FiDatabase className="h-4 w-4 shrink-0 text-accent" />
                          <h3 className="font-semibold text-text-primary">
                            {strategy.searchSource}
                          </h3>
                          <span className="rounded-full bg-bg-secondary px-2.5 py-1 text-xs text-text-secondary">
                            {strategy.executedAt ? formatDate(strategy.executedAt) : "Date unavailable"}
                          </span>
                          {strategy.resultCount > 0 && (
                            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                              {strategy.resultCount.toLocaleString()} results
                            </span>
                          )}
                        </div>

                        {/* Query Display */}
                        <div className="text-sm text-text-secondary">
                          {strategy.searchQuery ? (
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-text-primary">
                                Query:
                              </span>
                              <span
                                className="min-w-0 flex-1 truncate"
                                title={strategy.searchQuery}
                              >
                                {strategy.searchQuery}
                              </span>
                            </div>
                          ) : (
                            <span className="text-text-secondary italic">
                              Query not specified
                            </span>
                          )}
                        </div>

                        {/* Import Batch Count Badge */}
                        <div className="mt-2 flex items-center gap-2">
                          <FiFileText className="h-4 w-4 text-text-secondary" />
                          <span className="text-xs text-text-secondary">
                            {strategy.importBatchCount}{" "}
                            {strategy.importBatchCount === 1
                              ? "Import Batch"
                              : "Import Batches"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                      <Button
                        onClick={() => onImportToStrategy(strategy.id)}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={!canEdit}
                      >
                        <FiUpload className="w-4 h-4" />
                        Import RIS
                      </Button>
                      <button
                        onClick={() => onEditStrategy(strategy.id)}
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Edit search strategy"
                        title="Edit Strategy"
                        disabled={!canEdit}
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteStrategy(strategy.id)}
                        className="rounded-lg p-2 text-error transition-colors hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete search strategy"
                        title="Delete Strategy"
                        disabled={!canEdit}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nested ImportBatch List (Expandable) */}
                {isExpanded && (
                  <div className="border-t border-border bg-bg-primary">
                    {hasImports ? (
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-text-primary mb-3">
                          Import Batches ({strategy.importBatchCount})
                        </h4>
                        <div className="space-y-2">
                          {strategyBatches.map((batch) => (
                            <div
                              key={batch.id}
                              className="rounded-lg border border-border bg-surface-white p-3 transition-colors hover:border-accent/50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <FiFile className="w-4 h-4 text-accent" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-text-primary text-sm">
                                        {batch.fileName}
                                      </span>
                                      {batch.fileType && (
                                        <span className="rounded bg-primary-light px-2 py-0.5 text-xs text-primary">
                                          {batch.fileType.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                                      <span>
                                        {batch.totalRecords.toLocaleString()}{" "}
                                        records
                                      </span>
                                      <span>
                                        Imported: {formatDate(batch.importedAt)}{" "}
                                        at {formatTime(batch.importedAt)}
                                      </span>
                                      {batch.importedBy && <span>By: {batch.importedBy}</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => onViewImportPapers(batch.id)}
                                    variant="secondary"
                                    size="sm"
                                    className="flex items-center gap-1"
                                  >
                                    <FiEye className="w-3 h-3" />
                                    View Papers
                                  </Button>
                                  {onDeleteImportBatch && (
                                    <button
                                      onClick={() =>
                                        onDeleteImportBatch(batch.id)
                                      }
                                      className="rounded-lg p-1.5 text-error transition-colors hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:cursor-not-allowed disabled:opacity-50"
                                      aria-label="Delete import batch"
                                      title="Delete Import Batch"
                                      disabled={!canEdit}
                                    >
                                      <FiX className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <FiUpload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-text-secondary mb-3">
                          No imports yet
                        </p>
                        <Button
                          onClick={() => onImportToStrategy(strategy.id)}
                          size="sm"
                          variant="secondary"
                          className="flex items-center gap-2 mx-auto"
                        >
                          <FiUpload className="w-4 h-4" />
                          Import RIS to this strategy
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyStrategiesState
          onCreateStrategy={onCreateStrategy}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

// Empty State Component
function EmptyStrategiesState({
  onCreateStrategy,
  canEdit,
}: {
  onCreateStrategy: () => void;
  canEdit: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-bg-primary/50 px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
          <FiDatabase aria-hidden="true" className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text-primary">
          Create Your First Search Strategy
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-text-secondary">
          Record the database, query, and search date before importing papers. This keeps your review process clear and reproducible.
        </p>
        <Button
          onClick={onCreateStrategy}
          size="md"
          disabled={!canEdit}
        >
          <FiPlus className="h-4 w-4" />
          Create Search Strategy
        </Button>
      </div>
    </div>
  );
}
