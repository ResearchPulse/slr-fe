import React from "react";
import { cn } from "../../../utils/cn";
import LoadingSpinner from "../../ui/LoadingSpinner";
import EmptyState from "../../ui/EmptyState";
import { FiBarChart2 } from "react-icons/fi";

interface ChartCardProps {
  title: string;
  loading?: boolean;
  isEmpty?: boolean;
  children: React.ReactNode;
  height?: number;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  loading,
  isEmpty,
  children,
  height = 350,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-surface-white rounded-2xl border border-border p-8 shadow-none h-full flex flex-col",
        className,
      )}
    >
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">
        {title}
      </h3>

      <div className="flex-1 w-full" style={{ minHeight: height }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              title="No Data"
              description="No information available for this chart."
              onAction={() => {}}
              icon={<FiBarChart2 />}
              actionLabel=""
            />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
