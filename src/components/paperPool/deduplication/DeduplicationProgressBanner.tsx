// Enhanced Deduplication Progress Banner with metrics, ETA, and animated progress

import { useMemo } from "react";
import { FiClock, FiTrendingUp, FiRefreshCw } from "react-icons/fi";
import Button from "../../ui/Button";
import { estimateRemainingTime } from "../../../pages/reviewProcess/identification/utils";
import { SIMILARITY_THRESHOLDS } from "../../../pages/reviewProcess/identification/constants";
import type { DuplicatePair } from "../../../types/deduplication";

interface DeduplicationProgressBannerProps {
  duplicatePairs: DuplicatePair[];
  pendingCount: number;
  resolvedCount: number;
  /** Timestamp when user started resolving (first resolution in this session) */
  sessionStartTime: number | null;
  /** Number resolved in this session (for ETA calculation) */
  sessionResolvedCount: number;
  onRunDeduplication?: () => void;
  isRunningDeduplication?: boolean;
  canEdit?: boolean;
}

export default function DeduplicationProgressBanner({
  duplicatePairs,
  pendingCount,
  resolvedCount,
  sessionStartTime,
  sessionResolvedCount,
  onRunDeduplication,
  isRunningDeduplication = false,
  canEdit = true,
}: DeduplicationProgressBannerProps) {
  const total = duplicatePairs.length;
  const progressPercent =
    total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const stats = useMemo(() => {
    const highConfidence = duplicatePairs.filter(
      (p) =>
        p.status === "pending" &&
        p.similarityScore >= SIMILARITY_THRESHOLDS.HIGH,
    ).length;

    const eta = estimateRemainingTime(
      sessionResolvedCount,
      total,
      sessionStartTime,
    );

    return { highConfidence, eta };
  }, [duplicatePairs, sessionResolvedCount, total, sessionStartTime]);

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-4 sm:gap-8">
          <MetricBlock value={total} label="Total pairs" />
          <Divider />
          <MetricBlock
            value={resolvedCount}
            label="Resolved"
            className="text-success"
            emoji="✓"
          />
          <MetricBlock
            value={pendingCount}
            label="Pending"
            className="text-warning"
            emoji="⏳"
          />
          <Divider />

          {/* Progress bar */}
          <div>
            <div className="text-sm text-text-primary font-medium mb-2 flex items-center gap-2">
              <FiTrendingUp className="w-3.5 h-3.5" />
              Progress
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-bg-secondary sm:w-48">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-text-secondary">
                {progressPercent}% complete
              </span>
              {stats.eta && (
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {stats.eta} remaining
                </span>
              )}
            </div>
          </div>
        </div>

        {canEdit && onRunDeduplication && (
          <Button
            size="md"
            className="flex items-center gap-2 shadow-none ml-auto"
            onClick={onRunDeduplication}
            disabled={isRunningDeduplication}
            isLoading={isRunningDeduplication}
          >
            <FiRefreshCw className={`w-4 h-4 ${isRunningDeduplication ? "animate-spin" : ""}`} />
            Run Deduplication
          </Button>
        )}
      </div>

      {/* Contextual tips */}
      {pendingCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-text-primary">
            <span className="font-semibold">💡 Tip:</span> Use keyboard
            shortcuts{" "}
            <kbd className="px-1.5 py-0.5 bg-surface-white border border-border rounded text-xs font-mono">
              1
            </kbd>{" "}
            <kbd className="px-1.5 py-0.5 bg-surface-white border border-border rounded text-xs font-mono">
              2
            </kbd>{" "}
            for faster review.{" "}
            <kbd className="px-1.5 py-0.5 bg-surface-white border border-border rounded text-xs font-mono">
              N
            </kbd>{" "}
            jumps to next unresolved pair.
          </p>
          {stats.highConfidence > 0 && (
            <span className="rounded-full bg-error/10 px-2.5 py-1 text-xs font-medium text-error">
              {stats.highConfidence} high-confidence pending
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function MetricBlock({
  value,
  label,
  className = "text-text-primary",
  emoji,
}: {
  value: number;
  label: string;
  className?: string;
  emoji?: string;
}) {
  return (
    <div>
      <div className={`text-3xl font-bold ${className}`}>{value}</div>
      <div className="text-sm text-text-secondary">
        {emoji && <span className="mr-1">{emoji}</span>}
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="hidden h-10 w-px bg-border sm:block" />;
}
