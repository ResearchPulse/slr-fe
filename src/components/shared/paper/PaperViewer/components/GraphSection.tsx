import React from "react";
import { FiGitBranch, FiShare2 } from "react-icons/fi";
import LoadingSpinner from "../../../../ui/LoadingSpinner";
import CitationGraphWorkspace from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/components/graph/CitationGraphWorkspace";

interface GraphSectionProps {
  citationGraph: any;
  isDiscoveryLoading: boolean;
  graphDepth: number;
  setGraphDepth: (depth: number) => void;
  minConfidence: number;
  setMinConfidence: (confidence: number) => void;
  setOpenGraph?: (open: boolean) => void;
  paperTitle?: string;
  rootPaperId?: string;
  showGraphInline?: boolean;
}

export const GraphSection: React.FC<GraphSectionProps> = ({
  citationGraph,
  isDiscoveryLoading,
  graphDepth,
  setOpenGraph,
  rootPaperId,
  showGraphInline = false,
}) => {
  return (
    <section className="space-y-4" aria-label="Citation network">
      {isDiscoveryLoading ? (
        <div className="flex min-h-14 items-center gap-3 text-sm text-text-secondary" role="status">
          <LoadingSpinner size="sm" />
          <span>Loading citation network...</span>
        </div>
      ) : citationGraph ? (
        <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <FiShare2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <h2 id="citation-network-heading" className="text-base font-semibold text-text-primary">
              Citation network
            </h2>
            <span className="hidden text-sm text-text-secondary lg:inline">Explore connected papers</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end">
            <dl className="flex min-h-10 items-center divide-x divide-border">
              <div className="px-3 first:pl-0 sm:px-4">
                <dt className="sr-only">Papers</dt>
                <dd className="text-sm text-text-primary">
                  <span className="font-semibold">{citationGraph.nodes.length}</span>
                  <span className="ml-1.5 text-text-secondary">papers</span>
                </dd>
              </div>
              <div className="px-3 sm:px-4">
                <dt className="sr-only">Connections</dt>
                <dd className="text-sm text-text-primary">
                  <span className="font-semibold">{citationGraph.edges.length}</span>
                  <span className="ml-1.5 text-text-secondary">connections</span>
                </dd>
              </div>
              <div className="px-3 last:pr-0 sm:px-4">
                <dt className="sr-only">Depth</dt>
                <dd className="text-sm text-text-primary">
                  <span className="font-semibold">{graphDepth}</span>
                  <span className="ml-1.5 text-text-secondary">depth</span>
                </dd>
              </div>
            </dl>

            {!showGraphInline && (
              <button
                type="button"
                onClick={() => setOpenGraph?.(true)}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-fit"
              >
                <FiGitBranch className="h-4 w-4" aria-hidden="true" />
                Open interactive graph
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-14 items-center gap-2.5">
          <FiShare2 className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          <div>
            <h2 id="citation-network-heading" className="text-sm font-semibold text-text-primary">
              Citation network unavailable
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">There is no network data to display yet.</p>
          </div>
        </div>
      )}

      {showGraphInline && citationGraph && !isDiscoveryLoading && (
        <CitationGraphWorkspace
          data={citationGraph}
          rootPaperId={rootPaperId}
        />
      )}
    </section>
  );
};
