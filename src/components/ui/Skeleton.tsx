import React from "react";
import { cn } from "../../utils/cn";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Base primitive for creating customized skeletons.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-border/60", className)}
      {...props}
    />
  );
};

/**
 * Premium Card Skeleton loader - matches Project List layouts.
 */
export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-[4px] border border-border bg-surface-white p-6 space-y-4 shadow-none">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-2/3 rounded" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="pt-4 flex justify-between items-center border-t border-border/40">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-24 rounded-[4px]" />
      </div>
    </div>
  );
};

/**
 * Premium Table Skeleton loader - matches row lists.
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full border border-border rounded-[4px] overflow-hidden bg-surface-white">
      {/* Header */}
      <div className="bg-bg-secondary px-6 py-4 border-b border-border flex justify-between gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-12" />
      </div>
      {/* Rows */}
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-5 flex items-center justify-between gap-4">
            <div className="space-y-2 w-1/4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Premium Sidebar Menu Skeleton.
 */
export const SidebarSkeleton: React.FC = () => {
  return (
    <div className="w-64 bg-bg-secondary border-r border-border h-full p-4 space-y-6">
      <div className="space-y-2 pb-4 border-b border-border">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full shrink-0" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
