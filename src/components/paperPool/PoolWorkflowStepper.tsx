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
  isLeader?: boolean;
}

export default function PoolWorkflowStepper({
  currentStep,
  onStepClick,
  actions,
  isCompleted = (id) => id < currentStep,
  isLeader = true,
}: PoolWorkflowStepperProps) {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 80;

  return (
    <section className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="relative mx-auto w-full max-w-6xl px-1 sm:px-4">
        <div className="absolute left-[10%] right-[10%] top-6 h-1 rounded-full bg-slate-200" />
        <div
          aria-hidden="true"
          className="absolute left-[10%] top-6 h-1 rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />

        <ol className="relative z-10 grid grid-cols-5 gap-1 sm:gap-3">
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isDone = !isActive && isCompleted(step.id);
            const Icon = step.icon;

            return (
              <li key={step.id} className="min-w-0 text-center">
                <button
                  type="button"
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Step ${step.id}: ${step.title}`}
                  onClick={() => onStepClick(step.id)}
                  className={`
                    mx-auto flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-200 sm:h-14 sm:w-14
                    ${
                      isActive
                        ? "scale-105 border-accent bg-accent text-white shadow-md shadow-accent/20 ring-4 ring-accent/10"
                        : isDone
                          ? "border-blue-200 bg-blue-50 text-accent hover:bg-blue-100"
                          : "border-border bg-white text-text-secondary shadow-sm hover:border-accent/40 hover:text-accent"
                    }
                  `}
                >
                  {isDone ? (
                    <FiCheckCircle className="h-6 w-6 sm:h-7 sm:w-7" />
                  ) : (
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </button>

                <div className="mt-3 px-0.5 sm:px-2">
                  <p
                    className={`text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[10px] ${isActive ? "text-accent" : "text-text-muted"}`}
                  >
                    Step {step.id}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-[10px] font-semibold sm:text-sm ${isActive ? "text-text-primary" : "text-text-secondary"}`}
                  >
                    {step.title}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mx-auto mt-8 w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-white shadow-sm sm:mt-10">
        <div className="flex flex-col md:flex-row">
          <div className="flex items-center gap-4 border-b border-border bg-slate-50/80 p-5 md:w-64 md:flex-col md:justify-center md:border-b-0 md:border-r md:p-7 md:text-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-accent sm:h-14 sm:w-14">
              <FiInfo className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-text-primary sm:text-lg">
                Step Guide
              </h3>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-text-secondary">
                Workflow Assistance
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1 p-5 sm:p-7">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-accent">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                Instruction
              </span>
              {!isLeader && currentStep === 5 && (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                  Read-Only
                </span>
              )}
              <FiChevronRight className="h-3 w-3" />
              <span className="text-xs font-semibold text-text-secondary">
                {STEPS[currentStep - 1].title}
              </span>
            </div>

            <h2 className="mb-2 text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
              {getInstructionTitle(currentStep, isLeader)}
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-text-secondary">
              {getInstructionDescription(currentStep, isLeader)}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {actions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={action.onClick}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    action.primary
                      ? "bg-accent text-white shadow-sm hover:bg-primary-hover"
                      : "border border-border bg-white text-text-secondary hover:bg-slate-50 hover:text-text-primary"
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
    </section>
  );
}

function getInstructionTitle(step: number, isLeader = true) {
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
      return isLeader ? "Assign Papers to Process" : "Review Papers & Processes";
    default:
      return "";
  }
}

function getInstructionDescription(step: number, isLeader = true) {
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
      return isLeader
        ? "Select specific papers or use filters to bulk assign papers to your newly created review processes."
        : "Browse collected papers in the repository. As a Reviewer, you can inspect papers or jump directly to the review processes below to begin screening.";
    default:
      return "";
  }
}
