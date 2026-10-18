import React from "react";
import { cn } from "../../../utils/cn";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { FiBarChart2 } from "react-icons/fi";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  isEmpty?: boolean;
  emptyDescription?: string;
  children: React.ReactNode;
  height?: number;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  loading,
  isEmpty,
  emptyDescription = "No papers match the current filters.",
  children,
  height = 280,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-border bg-surface-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="mb-4 border-b border-border pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-text-primary sm:text-sm">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs leading-5 text-text-secondary">{description}</p>
        )}
      </div>

      <div className="flex-1 w-full" style={{ minHeight: height }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : isEmpty ? (
          <div className="flex h-full min-h-[170px] flex-col items-center justify-center px-5 py-6 text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary">
              <FiBarChart2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-text-primary">No chart data</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-text-secondary">
              {emptyDescription}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
