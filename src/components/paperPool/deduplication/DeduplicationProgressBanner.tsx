import { useMemo } from "react";
import { FiClock } from "react-icons/fi";
import { estimateRemainingTime } from "../../../pages/reviewProcess/identification/utils";
import type { DuplicatePair } from "../../../types/deduplication";

interface DeduplicationProgressBannerProps {
  duplicatePairs: DuplicatePair[];
  pendingCount: number;
  resolvedCount: number;
  sessionStartTime: number | null;
  sessionResolvedCount: number;
}

export default function DeduplicationProgressBanner({
  duplicatePairs,
  pendingCount,
  resolvedCount,
  sessionStartTime,
  sessionResolvedCount,
}: DeduplicationProgressBannerProps) {
  const total = duplicatePairs.length;
  const progressPercent = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
  const eta = useMemo(
    () => estimateRemainingTime(sessionResolvedCount, total, sessionStartTime),
    [sessionResolvedCount, total, sessionStartTime],
  );

  return (
    <section
      aria-label="Duplicate review progress"
      className="grid grid-cols-2 items-center gap-y-4 rounded-xl border border-border bg-surface-white px-4 py-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_minmax(220px,1.45fr)] sm:gap-0 sm:px-5"
    >
      <Metric value={total} label="Total pairs" />
      <Metric value={resolvedCount} label="Resolved" tone="success" />
      <Metric value={pendingCount} label="Pending" tone="warning" />

      <div className="col-span-2 border-t border-border pt-3 sm:col-span-1 sm:ml-5 sm:border-t-0 sm:pl-5 sm:pt-0">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-text-primary">Review progress</span>
          <span className="tabular-nums text-text-secondary">{progressPercent}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-bg-secondary"
          role="progressbar"
          aria-label="Review progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {eta && pendingCount > 0 && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-text-secondary">
            <FiClock aria-hidden="true" className="h-3 w-3" />
            About {eta} remaining at this pace
          </p>
        )}
      </div>
    </section>
  );
}

function Metric({
  value,
  label,
  tone = "default",
}: {
  value: number;
  label: string;
  tone?: "default" | "success" | "warning";
}) {
  const valueColor =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-text-primary";

  return (
    <div className="min-w-0 sm:border-r sm:border-border sm:px-4 first:sm:pl-0">
      <p className={`text-xl font-semibold leading-6 tabular-nums ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{label}</p>
    </div>
  );
}
