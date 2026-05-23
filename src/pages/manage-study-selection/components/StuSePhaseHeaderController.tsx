import React from "react";
import {
  type LucideIcon,
  FileText,
  LayoutList,
  ChevronRight,
  ArrowLeft,
  Database,
} from "lucide-react";
import { DataSetModal } from "./StuSeDataSetModal";
import { cn } from "../../../utils/cn";
import { useNavigate, useParams } from "react-router-dom";

export type SelectionPhase = "TITLE_ABSTRACT" | "FULL_TEXT";

interface PhaseItem {
  id: SelectionPhase;
  label: string;
  icon: LucideIcon;
  description: string;
}

const PHASES: PhaseItem[] = [
  {
    id: "TITLE_ABSTRACT",
    label: "Title & Abstract Screening",
    icon: LayoutList,
    description: "Initial screening based on basic information",
  },
  {
    id: "FULL_TEXT",
    label: "Full-Text Screening",
    icon: FileText,
    description: "Detailed analysis of selected papers",
  },
];

interface StuSePhaseHeaderControllerProps {
  currentPhase: SelectionPhase;
  onPhaseChange: (phase: SelectionPhase) => void;
}

export const StuSePhaseHeaderController: React.FC<
  StuSePhaseHeaderControllerProps
> = ({ currentPhase, onPhaseChange }) => {
  const navigate = useNavigate();
  const { projectId, processId } = useParams<{
    projectId: string;
    processId: string;
  }>();
  const [isDataSetOpen, setIsDataSetOpen] = React.useState(false);

  const handleBack = () => {
    navigate(`/projects/${projectId}/processes/${processId}`);
  };

  return (
    <div className="bg-surface-white border-b border-border px-6 py-3 grid grid-cols-3 items-center">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-bg-secondary rounded-full transition-colors text-text-secondary hover:text-text-primary"
          title="Back to Process Workspace"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="p-2 bg-bg-secondary rounded-[4px]">
            <LayoutList className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary leading-none mb-1">
              Study Selection
            </h1>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
              Manage Phase Progress
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-self-center bg-bg-secondary p-1 rounded-[4px] border border-border">
        {PHASES.map((phase, index) => {
          const isActive = currentPhase === phase.id;
          const Icon = phase.icon;

          return (
            <React.Fragment key={phase.id}>
              <button
                onClick={() => onPhaseChange(phase.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-[4px] transition-all duration-200 group relative",
                  isActive
                    ? "bg-surface-white text-accent shadow-none ring-1 ring-slate-200"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-white/50",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isActive
                      ? "text-accent"
                      : "text-text-secondary group-hover:scale-110",
                  )}
                />
                <div className="text-left">
                  <div className="text-sm font-bold leading-none">
                    {phase.label}
                  </div>
                </div>
                {isActive && (
                  <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
                )}
              </button>
              {index < PHASES.length - 1 && (
                <div className="px-1 text-slate-300">
                  <ChevronRight size={16} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="justify-self-end flex items-center gap-3">
        <div className="h-8 w-[1px] bg-slate-200 mx-2" />
        <button
          onClick={() => setIsDataSetOpen(true)}
          className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-[4px] shadow-none shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <div className="p-1.5 bg-surface-white/20 rounded-[4px] group-hover:bg-surface-white/30 transition-colors">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-80">
              Final Step
            </div>
            <div className="text-xs font-bold leading-none">
              Review Included
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
        </button>
      </div>

      <DataSetModal
        isOpen={isDataSetOpen}
        onClose={() => setIsDataSetOpen(false)}
      />
    </div>
  );
};
