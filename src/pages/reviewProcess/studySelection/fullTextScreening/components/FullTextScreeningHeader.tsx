import { FiArrowLeft, FiFileText } from "react-icons/fi";
import ScreeningPipelineHeader from "../../components/ScreeningPipelineHeader";
import type { ScreeningStats } from "../types";

interface FullTextScreeningHeaderProps {
  processName: string;
  stats: ScreeningStats;
  titleAbstractStats: ScreeningStats;
  onBack: () => void;
  onNavigateToFullText: () => void;
  onNavigateToTitleAbstract: () => void;
}

export default function FullTextScreeningHeader({
  processName,
  stats,
  titleAbstractStats,
  onBack,
  onNavigateToFullText,
  onNavigateToTitleAbstract,
}: FullTextScreeningHeaderProps) {
  return (
    <div className="bg-surface-white border-b border-border sticky top-0 z-20">
      <div className="max-w-full mx-auto px-6 py-2">
        <div className="flex items-center justify-between">
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
              <div className="w-9 h-9 rounded-[4px] bg-bg-secondary flex items-center justify-center shadow-none border border-indigo-100/50">
                <FiFileText className="w-4.5 h-4.5 text-accent" />
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
          <div className="flex-1 max-w-2xl px-8">
            <ScreeningPipelineHeader
              activePhase="full-text"
              titleAbstractStats={titleAbstractStats}
              fullTextStats={stats}
              onNavigateToTitleAbstract={onNavigateToTitleAbstract}
              onNavigateToFullText={onNavigateToFullText}
            />
          </div>

          {/* Right: Shortcuts */}
          <div className="flex items-center gap-3 text-xs text-text-secondary font-medium whitespace-nowrap">
            <div className="flex items-center gap-1.5 bg-bg-primary px-2 py-1 rounded-[4px] border border-border">
              <kbd className="px-1.5 py-0.5 bg-surface-white rounded border border-border shadow-none">
                1
              </kbd>
              <span className="text-[10px]">Include</span>
            </div>
            <div className="flex items-center gap-1.5 bg-bg-primary px-2 py-1 rounded-[4px] border border-border">
              <kbd className="px-1.5 py-0.5 bg-surface-white rounded border border-border shadow-none">
                2
              </kbd>
              <span className="text-[10px]">Exclude</span>
            </div>
            <div className="flex items-center gap-1.5 bg-bg-primary px-2 py-1 rounded-[4px] border border-border">
              <kbd className="px-1.5 py-0.5 bg-surface-white rounded border border-border shadow-none">
                ↑↓
              </kbd>
              <span className="text-[10px]">Navigate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
