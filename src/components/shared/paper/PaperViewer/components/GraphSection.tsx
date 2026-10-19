import React from "react";
import { FiGitBranch, FiShare2 } from "react-icons/fi";
import LoadingSpinner from "../../../../ui/LoadingSpinner";

interface GraphSectionProps {
  citationGraph: any;
  isDiscoveryLoading: boolean;
  graphDepth: number;
  setGraphDepth: (depth: number) => void;
  minConfidence: number;
  setMinConfidence: (confidence: number) => void;
  setOpenGraph: (open: boolean) => void;
}

export const GraphSection: React.FC<GraphSectionProps> = ({
  citationGraph,
  isDiscoveryLoading,
  graphDepth,
  setOpenGraph,
}) => {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-6">
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-border bg-white px-5 py-8 text-center sm:min-h-[320px]">
        {isDiscoveryLoading ? (
          <div
            className="flex flex-col items-center gap-3 text-text-secondary"
            role="status"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-accent">
              <LoadingSpinner size="md" />
            </div>
            <p className="text-sm font-medium">Loading citation network…</p>
          </div>
        ) : citationGraph ? (
          <div className="flex max-w-lg flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-accent">
              <FiShare2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">
              Citation network
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-text-secondary">
              Explore papers connected to this study and inspect their citation
              relationships.
            </p>

            <div
              className="mt-5 flex flex-wrap items-center justify-center gap-2"
              aria-label="Citation network size"
            >
              <span className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-secondary">
                <strong className="font-semibold text-text-primary">
                  {citationGraph.nodes.length}
                </strong>{" "}
                papers
              </span>
              <span className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-secondary">
                <strong className="font-semibold text-text-primary">
                  {citationGraph.edges.length}
                </strong>{" "}
                connections
              </span>
              <span className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-secondary">
                Depth {graphDepth}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setOpenGraph(true)}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <FiGitBranch className="h-4 w-4" aria-hidden="true" />
              Open interactive graph
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-text-secondary">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-bg-secondary text-text-secondary">
              <FiShare2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              Citation network unavailable
            </p>
            <p className="mt-1 text-sm">There is no network data to display yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
