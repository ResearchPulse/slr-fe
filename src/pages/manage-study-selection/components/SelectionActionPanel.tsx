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
          className="p-2 hover:bg-surface-white hover:shadow-none rounded-xl transition-all text-text-secondary hover:text-accent mb-8 border border-transparent hover:border-accent/20"
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
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Review context</h2>
          <p className="mt-0.5 text-[10px] text-slate-500">Criteria, team and AI support</p>
        </div>
        <button
          onClick={onToggleCollapse}
          className="rounded-xl border border-transparent p-2 text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-accent"
          title="Collapse Panel"
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
          listClassName="w-full flex-nowrap overflow-x-auto no-scrollbar rounded-xl border border-slate-100 bg-slate-50 p-1"
          itemClassName="min-w-fit flex-1 justify-center rounded-xl px-2.5 py-2 text-[11px]"
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
