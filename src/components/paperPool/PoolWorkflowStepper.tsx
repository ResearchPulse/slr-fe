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
  { id: 1, title: "Research Strategy", description: "Define PICOC & RQs", icon: FiFileText },
  { id: 2, title: "Search Strategy", description: "Define Search Strategy", icon: FiSearch },
  { id: 3, title: "Paper Repository", description: "Import & Collect", icon: FiDatabase },
  { id: 4, title: "Review Process", description: "Workflow Setup", icon: FiPlayCircle },
  { id: 5, title: "Select & Assign", description: "Assign Papers", icon: FiCheckCircle },
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
        <div className="absolute top-[28px] left-[60px] right-[60px] h-1 bg-slate-100 rounded-full" />

        {/* Progress Line Active */}
        <div
          className="absolute top-[28px] left-[60px] h-1 bg-blue-500 rounded-full transition-all duration-700"
          style={{ width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 100}% - 0px)` }}
        />

        {STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isDone = isCompleted(step.id);
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              <button
                onClick={() => onStepClick(step.id)}
                className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg
                  ${
                    isActive
                      ? "bg-blue-600 text-white scale-110 ring-4 ring-blue-100"
                      : isDone
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-slate-400 hover:text-slate-600 border border-slate-200"
                  }
                `}
              >
                {isDone ? <FiCheckCircle className="w-7 h-7" /> : <Icon className="w-7 h-7" />}
              </button>

              <div className="absolute top-16 text-center w-40">
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-blue-600" : "text-slate-500"}`}
                >
                  Step {step.id}
                </p>
                <p
                  className={`text-sm font-bold truncate ${isActive ? "text-slate-900" : "text-slate-400"}`}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide Banner */}
      <div className="mt-28 max-w-5xl mx-auto bg-white rounded-[2rem] border border-blue-100 shadow-xl shadow-blue-100/20 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="bg-slate-900 p-8 text-white flex flex-col justify-center items-center md:w-64 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <FiInfo className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Step Guide</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">
              Workflow Assistance
            </p>
          </div>

          <div className="flex-1 p-8">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full">
                Instruction
              </span>
              <FiChevronRight className="w-3 h-3" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {STEPS[currentStep - 1].title}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {getInstructionTitle(currentStep)}
            </h2>
            <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-2xl">
              {getInstructionDescription(currentStep)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 ${
                    action.primary
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
