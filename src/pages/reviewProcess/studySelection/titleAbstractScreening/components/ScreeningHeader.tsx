import { FiArrowLeft, FiFilter } from "react-icons/fi";
import ScreeningPipelineHeader from "../../components/ScreeningPipelineHeader";
import type { ScreeningStats } from "../types";

interface ScreeningHeaderProps {
  processName: string;
  stats: ScreeningStats;
  fullTextStats: ScreeningStats;
  onBack: () => void;
  onNavigateToFullText: () => void;
  onNavigateToTitleAbstract: () => void;
}

export default function ScreeningHeader({
  processName,
  stats,
  fullTextStats,
  onBack,
  onNavigateToFullText,
  onNavigateToTitleAbstract,
}: ScreeningHeaderProps) {
  return (
    <div className="bg-surface-white border-b border-border sticky top-0 z-20">
      <div className="max-w-full mx-auto px-6 py-2">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          {/* Left: Back + Process Info */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-1.5 rounded-[4px] text-text-secondary hover:text-text-secondary hover:bg-bg-secondary transition-colors"
              title="Back to Review Process"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[4px] bg-blue-50 flex items-center justify-center shadow-none border border-blue-100/50">
                <FiFilter className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-bold text-text-primary leading-tight">
                  Study Selection
                </h1>
                <p className="text-[10px] text-text-secondary font-medium truncate max-w-[150px]">
                  {processName}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Pipeline Header */}
          <div className="w-full max-w-2xl px-4">
            <ScreeningPipelineHeader
              activePhase="title-abstract"
              titleAbstractStats={stats}
              fullTextStats={fullTextStats}
              onNavigateToTitleAbstract={onNavigateToTitleAbstract}
              onNavigateToFullText={onNavigateToFullText}
            />
          </div>

          {/* Right: Empty spacer to maintain center alignment */}
          <div />
        </div>
      </div>
    </div>
  );
}
