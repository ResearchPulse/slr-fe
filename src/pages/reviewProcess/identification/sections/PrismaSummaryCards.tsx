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

interface PrismaSummaryCardsProps {
  prismaStats: PrismaStatistics;
  statsLoading: boolean;
  onTabChange: (tab: TabType) => void;
}

export default function PrismaSummaryCards({
  prismaStats,
  statsLoading,
  onTabChange,
}: PrismaSummaryCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Records Imported */}
      <button
        onClick={() => onTabChange("imports")}
        className="group min-h-28 rounded-xl border border-border bg-surface-white p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="flex items-center justify-between mb-3">
          <FiDatabase className="h-5 w-5 text-accent" />
          {statsLoading && (
            <LoadingSpinner size="sm" />
          )}
        </div>
        <div className="mb-0.5 text-2xl font-bold leading-tight text-text-primary">
          {statsLoading ? (
            <span className="text-text-secondary">--</span>
          ) : (
            prismaStats.totalRecordsImported.toLocaleString()
          )}
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
        <div className="flex items-center justify-between mb-3">
          <FiSearch className="h-5 w-5 text-warning" />
          {prismaStats.pendingSelectionCount > 0 && (
            <div className="h-2 w-2 rounded-full bg-warning" />
          )}
        </div>
        <div className="mb-0.5 text-2xl font-bold leading-tight text-text-primary">
          {prismaStats.pendingSelectionCount}
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
        <div className="flex items-center justify-between mb-3">
          <FiFilter className="h-5 w-5 text-success" />
          <FiCheck className="h-4 w-4 text-success" />
        </div>
        <div className="mb-0.5 text-2xl font-bold leading-tight text-text-primary">
          {statsLoading ? (
            <span className="text-text-secondary">--</span>
          ) : (
            prismaStats.uniqueRecords.toLocaleString()
          )}
        </div>
        <div className="text-sm font-semibold text-text-primary">
          After Deduplication
        </div>
        <div className="mt-1 text-xs text-text-secondary">
          Records available for screening
        </div>
      </button>
    </div>
  );
}
