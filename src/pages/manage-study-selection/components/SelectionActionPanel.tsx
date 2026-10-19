import React, { useState } from "react";
import {
  Cpu,
  Layout,
  Target,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { useParams } from "react-router-dom";
import Tabs from "../../../components/ui/Tabs";
import { CriteriaTab } from "./CriteriaTab";
import { ActionTab } from "./StuSePanelTab";
import { AIAnalysisTab } from "./AIAnalysisTab";

import type { SelectionPhase } from "./StuSePhaseHeaderController";
import type { AiAnalysisResult } from "../../reviewProcess/studySelection/titleAbstractScreening/types";

interface SelectionActionPanelProps {
  currentPhase: SelectionPhase;
  selectedPaper: any;
  aiAnalysis: AiAnalysisResult | null;
  isAnalyzing: boolean;
  runAiAnalysis: (paperId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isDisabled?: boolean;
  onEditCriteria?: () => void;
}

export const SelectionActionPanel: React.FC<SelectionActionPanelProps> = ({
  currentPhase,
  selectedPaper,
  aiAnalysis,
  isAnalyzing,
  runAiAnalysis,
  isCollapsed,
  onToggleCollapse,
  isDisabled,
  onEditCriteria,
}) => {
  const { projectId, screeningProcessId } = useParams<{
    projectId: string;
    screeningProcessId: string;
  }>();
  const [activeTab, setActiveTab] = useState("criteria");

  const tabItems = [
    { id: "criteria", label: "Criteria", icon: Target },
    { id: "panel", label: "Panel", icon: Layout },
    { id: "ai", label: "AI Analysis", compactLabel: "AI", icon: Cpu },
  ];

  if (isCollapsed) {
    return (
      <div className="flex h-full flex-col items-center border-l border-border bg-bg-secondary py-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-1 motion-safe:duration-150 motion-reduce:animate-none">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mb-8 inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent text-text-secondary transition-colors hover:border-accent/20 hover:bg-surface-white hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          title="Expand Panel"
          aria-label="Expand review panel"
        >
          <PanelRightOpen className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div
            className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary"
            style={{ writingMode: "vertical-rl" }}
          >
            Action Panel
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-white border-l border-border overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-surface-white px-4 py-3.5">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Review context</h2>
          <p className="mt-0.5 text-[10px] text-text-secondary">Criteria, team and AI support</p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent text-text-secondary transition-colors hover:border-border hover:bg-bg-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          title="Collapse Panel"
          aria-label="Close review tools"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-white p-3">
        <Tabs
          items={tabItems}
          activeTabId={activeTab}
          onTabChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0 gap-3"
          listClassName="selection-action-tabs w-full flex-nowrap overflow-x-auto hide-scrollbar border-b border-border"
          itemClassName="min-h-11 min-w-fit flex-none justify-center gap-1.5 rounded-none px-2 py-2.5 text-[11px] normal-case tracking-normal sm:text-xs"
          contentClassName="flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto h-full custom-scrollbar pr-1">
            {activeTab === "criteria" && (
              <CriteriaTab
                projectId={projectId}
                screeningProcessId={screeningProcessId}
                onEditCriteria={onEditCriteria}
              />
            )}

            {activeTab === "panel" && <ActionTab isDisabled={isDisabled} />}

            {activeTab === "ai" && (
              <AIAnalysisTab
                currentPhase={currentPhase}
                selectedPaper={selectedPaper}
                aiAnalysis={aiAnalysis}
                isAnalyzing={isAnalyzing}
                runAiAnalysis={runAiAnalysis}
                isDisabled={isDisabled}
              />
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};
