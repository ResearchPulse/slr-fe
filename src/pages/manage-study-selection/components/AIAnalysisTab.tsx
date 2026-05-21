import React from 'react';
import type { SelectionPhase } from './StuSePhaseHeaderController';
import type { AiAnalysisResult } from '../../reviewProcess/studySelection/titleAbstractScreening/types';
import TitleAbstractAiPanel from '../../reviewProcess/studySelection/titleAbstractScreening/components/AiAnalysisPanel';
import FullTextAiPanel from '../../reviewProcess/studySelection/fullTextScreening/components/AiAnalysisPanel';

interface AIAnalysisTabProps {
  currentPhase: SelectionPhase;
  selectedPaper: any;
  aiAnalysis: AiAnalysisResult | null;
  isAnalyzing: boolean;
  runAiAnalysis: (paperId: string) => void;
  isDisabled?: boolean;
}

export const AIAnalysisTab: React.FC<AIAnalysisTabProps> = ({
  currentPhase,
  selectedPaper,
  aiAnalysis,
  isAnalyzing,
  runAiAnalysis,
  isDisabled,
}) => {
  if (currentPhase === 'TITLE_ABSTRACT') {
    return (
      <div className="h-full animate-in fade-in duration-300">
        <TitleAbstractAiPanel
          paper={selectedPaper}
          aiAnalysis={aiAnalysis}
          isAnalyzing={isAnalyzing}
          onRunAnalysis={runAiAnalysis}
          isDisabled={isDisabled}
        />
      </div>
    );
  }

  return (
    <div className="h-full animate-in fade-in duration-300">
      <FullTextAiPanel
        paper={selectedPaper}
        aiAnalysis={aiAnalysis}
        isAnalyzing={isAnalyzing}
        runAiAnalysis={runAiAnalysis}
        isDisabled={isDisabled}
      />
    </div>
  );
};
