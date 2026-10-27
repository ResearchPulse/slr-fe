import React, { type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface DataTableToolbarProps {
  search: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  filterPlacement?: "left" | "right";
  filtersClassName?: string;
}

const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  search,
  filters,
  actions,
  filterPlacement = "left",
  filtersClassName,
}) => (
  <div className="flex flex-col gap-3 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
    <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap">
      {search}
      {filters && filterPlacement === "left" && (
        <div className={cn("w-full shrink-0 sm:w-auto", filtersClassName)}>{filters}</div>
      )}
    </div>
    {filters && filterPlacement === "right" && (
      <div className={cn("w-full shrink-0 sm:w-auto", filtersClassName)}>{filters}</div>
    )}
    {actions && <div className="flex w-full justify-end sm:w-auto">{actions}</div>}
  </div>
);

export default DataTableToolbar;
