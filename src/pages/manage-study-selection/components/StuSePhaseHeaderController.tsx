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
    <div className="z-10 grid shrink-0 grid-cols-1 items-center gap-2 border-b border-border bg-white px-3 py-1.5 shadow-sm xl:grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] xl:px-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:border-primary/20 hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          title="Back to Process Workspace"
          aria-label="Back to Process Workspace"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary-light p-2.5">
            <LayoutList className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="mb-1 text-base font-bold leading-none text-text-primary">
              Study Selection
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
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
                type="button"
                onClick={() => onPhaseChange(phase.id)}
                aria-pressed={isActive}
                className={cn(
                  "group relative flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none sm:px-4",
                  isActive
                    ? "bg-surface-white text-primary shadow-sm ring-1 ring-border"
                    : "text-text-secondary hover:bg-surface-white/70 hover:text-text-primary",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors duration-150 motion-reduce:transition-none",
                    isActive
                    ? "text-accent"
                      : "text-text-tertiary group-hover:text-primary",
                  )}
                />
                <div className="text-left">
                  <div className="whitespace-nowrap text-xs font-semibold leading-none sm:text-sm">
                    <span className="sm:hidden">
                      {phase.id === "TITLE_ABSTRACT" ? "Title & Abstract" : "Full Text"}
                    </span>
                    <span className="hidden sm:inline">{phase.label}</span>
                  </div>
                </div>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
              {index < PHASES.length - 1 && (
                <div aria-hidden="true" className="px-1 text-text-tertiary">
                  <ChevronRight size={16} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-self-end gap-3">
        <div aria-hidden="true" className="mr-1 hidden h-8 w-px bg-border xl:block" />
        <button
          type="button"
          onClick={() => setIsDataSetOpen(true)}
          className="group relative flex min-h-11 items-center gap-2.5 overflow-hidden rounded-xl bg-primary px-3.5 py-2.5 text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-4"
        >
          <div className="rounded-xl bg-white/15 p-1.5 transition-colors group-hover:bg-white/25">
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
          <ChevronRight aria-hidden="true" className="w-4 h-4 text-white/60 transition-colors group-hover:text-white motion-reduce:transition-none" />
        </button>
      </div>

      <DataSetModal
        isOpen={isDataSetOpen}
        onClose={() => setIsDataSetOpen(false)}
      />
    </div>
  );
};
