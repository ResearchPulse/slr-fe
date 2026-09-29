import React from "react";
import {
  FiFileText,
  FiDatabase,
  FiPlayCircle,
  FiCheckCircle,
  FiChevronRight,
  FiInfo,
  FiSearch,
} from "react-icons/fi";

export interface PoolWorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: PoolWorkflowStep[] = [
  {
    id: 1,
    title: "Research Strategy",
    description: "Define PICOC & RQs",
    icon: FiFileText,
  },
  {
    id: 2,
    title: "Search Strategy",
    description: "Define Search Strategy",
    icon: FiSearch,
  },
  {
    id: 3,
    title: "Paper Repository",
    description: "Import & Collect",
    icon: FiDatabase,
  },
  {
    id: 4,
    title: "Review Process",
    description: "Workflow Setup",
    icon: FiPlayCircle,
  },
  {
    id: 5,
    title: "Select & Assign",
    description: "Assign Papers",
    icon: FiCheckCircle,
  },
];

interface PoolWorkflowStepperProps {
  currentStep: number;
  onStepClick: (stepId: number) => void;
  isCompleted?: (stepId: number) => boolean;
  actions: {
    label: string;
    onClick: () => void;
    primary?: boolean;
    icon?: React.ElementType;
  }[];
}

export default function PoolWorkflowStepper({
  currentStep,
  onStepClick,
  actions,
  isCompleted = (id) => id < currentStep,
}: PoolWorkflowStepperProps) {
  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="relative flex items-center justify-between max-w-5xl mx-auto px-10">
        {/* Progress Line Background */}
        <div className="absolute top-[28px] left-[60px] right-[60px] h-1 bg-bg-secondary rounded-full" />

        {/* Progress Line Active */}
        <div
          className="absolute top-[28px] left-[60px] h-1 bg-accent rounded-full transition-all duration-700"
          style={{
            width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 100}% - 0px)`,
          }}
        />

        {STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isDone = isCompleted(step.id);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className="relative flex flex-col items-center z-10"
            >
              <button
                onClick={() => onStepClick(step.id)}
                className={`
                  w-14 h-14 rounded-[4px] flex items-center justify-center transition-all duration-300 shadow-none
                  ${
                    isActive
                      ? "bg-accent text-bg-primary scale-110 ring-4 ring-accent/20"
                      : isDone
                        ? "bg-surface-white text-text-primary border border-border shadow-sm"
                        : "bg-surface-white text-text-secondary hover:text-text-primary border border-border"
                  }
                `}
              >
                {isDone ? (
                  <FiCheckCircle className="w-7 h-7 text-text-primary" />
                ) : (
                  <Icon className="w-7 h-7" />
                )}
              </button>

              <div className="absolute top-16 text-center w-40">
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-accent" : "text-text-secondary"}`}
                >
                  Step {step.id}
                </p>
                <p
                  className={`text-sm font-bold truncate ${isActive ? "text-text-primary" : "text-text-secondary"}`}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide Banner */}
      <div className="mt-28 max-w-5xl mx-auto bg-surface-white rounded-[4px] border border-border shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="bg-bg-primary border-r border-border p-8 text-text-primary flex flex-col justify-center items-center md:w-64 text-center">
            <div className="w-16 h-16 bg-surface-white border border-border rounded-[4px] flex items-center justify-center mb-4 shadow-sm">
              <FiInfo className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-serif font-semibold tracking-tight">
              Step Guide
            </h3>
            <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mt-1">
              Workflow Assistance
            </p>
          </div>

          <div className="flex-1 p-8">
            <div className="flex items-center gap-2 text-accent mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-bg-primary border border-border px-3 py-1 rounded-full">
                Instruction
              </span>
              <FiChevronRight className="w-3 h-3" />
              <span className="text-xs font-black text-text-secondary uppercase tracking-widest">
                {STEPS[currentStep - 1].title}
              </span>
            </div>

            <h2 className="text-2xl font-serif text-text-primary mb-2">
              {getInstructionTitle(currentStep)}
            </h2>
            <p className="text-text-secondary text-sm font-medium leading-relaxed max-w-2xl">
              {getInstructionDescription(currentStep)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className={`px-6 py-2.5 rounded-[4px] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-none flex items-center gap-2 ${
                    action.primary
                      ? "bg-accent text-bg-primary hover:bg-primary-hover"
                      : "bg-surface-white border border-border text-text-secondary hover:text-text-primary hover:bg-bg-primary"
                  }`}
                >
                  {action.label}
                  {action.icon && <action.icon className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInstructionTitle(step: number) {
  switch (step) {
    case 1:
      return "Review Research Strategy";
    case 2:
      return "Define Search Strategy";
    case 3:
      return "Import Papers from Sources";
    case 4:
      return "Setup Review Processes";
    case 5:
      return "Assign Papers to Process";
    default:
      return "";
  }
}

function getInstructionDescription(step: number) {
  switch (step) {
    case 1:
      return "Ensure your Research Questions and PICO-C elements are correctly defined. This forms the foundation of your systematic review.";
    case 2:
      return "Define the academic databases (e.g., Scopus, Web of Science) you will search. You must add at least one source to proceed.";
    case 3:
      return "Import your research results in RIS format. You can upload files from your defined sources into the central repository.";
    case 4:
      return "Create one or more review processes (e.g., Screening) to begin evaluating your collected papers.";
    case 5:
      return "Select specific papers or use filters to bulk assign papers to your newly created review processes.";
    default:
      return "";
  }
}
