// PRISMA Summary Cards: Records Imported, Duplicates, After Deduplication

import {
  FiDatabase,
  FiFilter,
  FiCheck,
  FiSearch,
} from "react-icons/fi";
import type { TabType } from "../types";
import type { PrismaStatistics } from "../../../../types/identification";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import Button from "../../../../components/ui/Button";

interface PrismaSummaryCardsProps {
  prismaStats: PrismaStatistics;
  statsLoading: boolean;
  statsError: string | null;
  onTabChange: (tab: TabType) => void;
  onRetry: () => void;
}

export default function PrismaSummaryCards({
  prismaStats,
  statsLoading,
  statsError,
  onTabChange,
  onRetry,
}: PrismaSummaryCardsProps) {
  const formatCount = (count: number) => {
    if (statsLoading) return "--";
    if (statsError) return "--";
    return count.toLocaleString();
  };

  return (
    <div className="mb-6 space-y-3">
      {statsError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/25 bg-error/5 px-4 py-3">
          <p className="text-sm text-error">Statistics could not be loaded. Try refreshing the data.</p>
          <Button type="button" variant="outline" onClick={onRetry} className="min-h-9 px-3 py-1.5 text-sm">
            Retry
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Records Imported */}
        <button
          onClick={() => onTabChange("imports")}
          className="group min-h-28 rounded-xl border border-border bg-surface-white p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="mb-3 flex items-center justify-between">
            <FiDatabase className="h-5 w-5 text-accent" />
            {statsLoading && <LoadingSpinner size="sm" />}
          </div>
          <div className="mb-0.5 text-2xl font-bold leading-tight text-text-primary">
            {formatCount(prismaStats.totalRecordsImported)}
          </div>
          <div className="text-sm font-semibold text-text-primary">
            Records Imported
          </div>
          <div className="mt-1 text-xs text-text-secondary">From all batches</div>
        </button>

        {/* Pending Selections */}
        <button
          onClick={() => onTabChange("library")}
          className="group min-h-28 rounded-xl border border-border bg-surface-white p-4 text-left transition-colors hover:border-warning/50 hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="mb-3 flex items-center justify-between">
            <FiSearch className="h-5 w-5 text-warning" />
            {!statsError && prismaStats.pendingSelectionCount > 0 && (
              <div className="h-2 w-2 rounded-full bg-warning" />
            )}
          </div>
          <div className="mb-0.5 text-2xl font-bold leading-tight text-text-primary">
            {formatCount(prismaStats.pendingSelectionCount)}
          </div>
          <div className="text-sm font-semibold text-text-primary">
            Pending Selections
          </div>
          <div className="mt-1 text-xs text-text-secondary">Awaiting screening decisions</div>
        </button>

        {/* After Deduplication - Key Success Metric */}
        <button
          onClick={() => onTabChange("dataset")}
          className="group min-h-28 rounded-xl border border-success/25 bg-surface-white p-4 text-left transition-colors hover:border-success/50 hover:bg-success/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="mb-3 flex items-center justify-between">
            <FiFilter className="h-5 w-5 text-success" />
            <FiCheck className="h-4 w-4 text-success" />
          </div>
          <div className="mb-0.5 text-2xl font-bold leading-tight text-text-primary">
            {formatCount(prismaStats.uniqueRecords)}
          </div>
          <div className="text-sm font-semibold text-text-primary">
            After Deduplication
          </div>
          <div className="mt-1 text-xs text-text-secondary">
            Records available for screening
          </div>
        </button>
      </div>
    </div>
  );
}
