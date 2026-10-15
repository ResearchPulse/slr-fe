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
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      {/* Records Imported */}
      <button
        onClick={() => onTabChange("imports")}
        className="rounded-xl border border-border bg-surface-white p-5 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="flex items-center justify-between mb-3">
          <FiDatabase className="w-6 h-6 text-accent" />
          {statsLoading && (
            <LoadingSpinner size="sm" />
          )}
        </div>
        <div className="text-3xl font-bold text-text-primary mb-1">
          {statsLoading ? (
            <span className="text-text-secondary">--</span>
          ) : (
            prismaStats.totalRecordsImported.toLocaleString()
          )}
        </div>
        <div className="text-sm text-text-primary font-medium">
          Records Imported
        </div>
        <div className="text-xs text-text-secondary mt-1">From all batches</div>
      </button>

      {/* Pending Selections */}
      <button
        onClick={() => onTabChange("library")}
        className="rounded-xl border border-border bg-surface-white p-5 text-left transition-colors hover:border-warning/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="flex items-center justify-between mb-3">
          <FiSearch className="h-6 w-6 text-warning" />
          {prismaStats.pendingSelectionCount > 0 && (
            <div className="h-2 w-2 rounded-full bg-warning" />
          )}
        </div>
        <div className="text-3xl font-bold text-text-primary mb-1">
          {prismaStats.pendingSelectionCount}
        </div>
        <div className="text-sm text-text-primary font-medium">
          Pending Selections
        </div>
        <div className="text-xs text-text-secondary mt-1">Ready for select</div>
      </button>

      {/* After Deduplication - Key Success Metric */}
      <button
        onClick={() => onTabChange("dataset")}
        className="rounded-xl border border-success/30 bg-success/5 p-5 text-left transition-colors hover:border-success/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="flex items-center justify-between mb-3">
          <FiFilter className="h-6 w-6 text-success" />
          <FiCheck className="h-5 w-5 text-success" />
        </div>
        <div className="text-3xl font-bold text-text-primary mb-1">
          {statsLoading ? (
            <span className="text-text-secondary">--</span>
          ) : (
            prismaStats.uniqueRecords.toLocaleString()
          )}
        </div>
        <div className="text-sm font-semibold text-success">
          After Deduplication
        </div>
        <div className="mt-1 text-xs text-text-secondary">
          Records using for screening phase
        </div>
      </button>
    </div>
  );
}
