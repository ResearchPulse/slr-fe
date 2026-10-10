import React from "react";
import { FiGitBranch } from "react-icons/fi";
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
    <div className="space-y-4">
      <div className="aspect-video bg-slate-900 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:32px_32px]" />

        {isDiscoveryLoading ? (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
            <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
              Building Neural Network...
            </div>
          </div>
        ) : citationGraph ? (
          <div className="z-10 text-center px-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] mb-2 backdrop-blur-sm">
              <FiGitBranch className="w-3.5 h-3.5" /> Intelligence Visualizer
              Active
            </div>
            <div>
              <h3 className="text-white text-3xl font-black mb-2 tracking-tight">
                {citationGraph.nodes.length} Nodes &{" "}
                {citationGraph.edges.length} Edges
              </h3>
              <p className="text-white/50 text-xs max-w-sm mx-auto leading-relaxed font-medium">
                Analysis complete. Explore the full citation universe at depth{" "}
                {graphDepth}. Interact with nodes to see specific paper
                relationships.
              </p>
            </div>

            <button
              onClick={() => setOpenGraph(true)}
              className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-none active:scale-95"
            >
              Launch Visualizer
            </button>
          </div>
        ) : (
          <div className="text-white/20 text-[10px] font-black uppercase tracking-widest">
            Network unavailable
          </div>
        )}
      </div>
    </div>
  );
};
