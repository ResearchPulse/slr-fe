import React from "react";
import { FiFileText } from "react-icons/fi";

interface PaperNodeListProps {
  nodes: any[];
  isLoading: boolean;
  emptyLabel: string;
}

export const PaperNodeList: React.FC<PaperNodeListProps> = ({
  nodes,
  isLoading,
  emptyLabel,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-bg-secondary rounded-xl animate-pulse border border-border"
          />
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="py-12 text-center">
        <FiFileText className="w-10 h-10 text-slate-100 mx-auto mb-3" />
        <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">
          {emptyLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="group flex items-start gap-3 rounded-xl border border-border bg-white p-4 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50/60 motion-reduce:transition-none sm:gap-4 sm:p-5"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-accent">
            <FiFileText aria-hidden="true" className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <h4 className="min-w-0 flex-1 text-sm font-semibold leading-5 text-text-primary transition-colors group-hover:text-primary sm:text-[15px]">
                {node.title}
              </h4>
              {node.year != null && (
                <span className="shrink-0 rounded-full bg-bg-secondary px-2.5 py-1 text-xs font-semibold tabular-nums text-text-secondary">
                  {node.year}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-text-secondary">
              <span className="min-w-0 truncate">
                {node.authors || "Author information unavailable"}
              </span>
              {node.doi && (
                <>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="min-w-0 max-w-full truncate font-medium">DOI: {node.doi}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
