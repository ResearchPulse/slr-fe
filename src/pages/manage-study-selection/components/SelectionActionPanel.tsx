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
}) => {
  const { projectId, screeningProcessId } = useParams<{
    projectId: string;
    screeningProcessId: string;
  }>();
  const [activeTab, setActiveTab] = useState("criteria");

  const tabItems = [
    { id: "criteria", label: "Criteria", icon: Target },
    { id: "panel", label: "Panel", icon: Layout },
    { id: "ai", label: "AI Analysis", icon: Cpu },
  ];

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-6 h-full bg-bg-secondary border-l border-border animate-in fade-in slide-in-from-right-4 duration-300">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-surface-white hover:shadow-none rounded-[4px] transition-all text-text-secondary hover:text-accent mb-8 border border-transparent hover:border-indigo-100"
          title="Expand Panel"
        >
          <PanelRightOpen className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div
            className="font-black text-slate-300 tracking-[0.2em] uppercase text-[10px] whitespace-nowrap"
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
      <div className="p-3 border-b border-border bg-bg-secondary/50 flex items-center justify-between">
        <h2 className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-1">
          Screening Tools
        </h2>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-surface-white hover:shadow-none rounded-[4px] transition-all text-text-secondary hover:text-accent border border-transparent hover:border-indigo-100"
          title="Collapse Panel"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        <Tabs
          items={tabItems}
          activeTabId={activeTab}
          onTabChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0 gap-3"
          listClassName="w-full flex-nowrap overflow-x-auto no-scrollbar bg-bg-secondary/50 p-1 rounded-[4px]"
          itemClassName="flex-1 justify-center px-3 py-2 text-[11px] rounded-[4px] min-w-fit"
          contentClassName="flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto h-full custom-scrollbar pr-1">
            {activeTab === "criteria" && (
              <CriteriaTab
                projectId={projectId}
                screeningProcessId={screeningProcessId}
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
