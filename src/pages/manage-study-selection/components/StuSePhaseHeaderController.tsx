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
    navigate(
      processId
        ? `/projects/${projectId}/processes/${processId}`
        : `/projects/${projectId}/workspace`,
    );
  };

  return (
    <div className="z-10 grid shrink-0 grid-cols-1 items-center gap-2 border-b border-[#dce6ed] bg-white px-3 py-1.5 shadow-sm xl:grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] xl:px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="rounded-lg border border-[#dce6ed] p-2 text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          title="Back to Process Workspace"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2.5">
            <LayoutList className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="mb-1 text-base font-bold leading-none text-slate-900">
              Study Selection
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Project leader workspace
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-fit max-w-full items-center">
        {PHASES.map((phase, index) => {
          const isActive = currentPhase === phase.id;
          const Icon = phase.icon;

          return (
            <React.Fragment key={phase.id}>
              <button
                onClick={() => onPhaseChange(phase.id)}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-200 sm:px-4",
                  isActive
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-900",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isActive
                    ? "text-blue-700"
                      : "text-slate-400 group-hover:text-blue-600",
                  )}
                />
                <div className="text-left">
                  <div className="whitespace-nowrap text-xs font-semibold leading-none sm:text-sm">
                    {phase.label}
                  </div>
                </div>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-blue-600" />
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

      <div className="flex items-center justify-self-end gap-3">
        <div className="mr-1 hidden h-8 w-px bg-slate-200 xl:block" />
        <button
          onClick={() => setIsDataSetOpen(true)}
          className="group relative flex items-center gap-2.5 overflow-hidden rounded-lg bg-emerald-600 px-3.5 py-2.5 text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800 sm:px-4"
        >
          <div className="rounded-md bg-white/15 p-1.5 transition-colors group-hover:bg-white/25">
            <Database className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <div className="mb-1 text-[9px] font-semibold uppercase leading-none tracking-[0.14em] text-white/75">
              Final review
            </div>
            <div className="whitespace-nowrap text-xs font-semibold leading-none">
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
