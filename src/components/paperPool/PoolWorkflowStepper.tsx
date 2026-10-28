import {
  FiFileText,
  FiDatabase,
  FiPlayCircle,
  FiCheckCircle,
  FiSearch,
  FiUserCheck,
} from "react-icons/fi";
import HeroNav from "./HeroNav";

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
    icon: FiUserCheck,
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
  activeTab?: "library" | "deduplication" | "sources" | "snowballing" | "statistics";
  onTabChange?: (tab: "library" | "deduplication" | "sources" | "snowballing" | "statistics") => void;
}

export default function PoolWorkflowStepper({
  currentStep,
  onStepClick,
  actions,
  isCompleted = (id) => id < currentStep,
  isLeader = true,
  activeTab = "library",
  onTabChange,
}: PoolWorkflowStepperProps) {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 80;

  return (
    <section className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none">
      <div className="relative mx-auto w-full max-w-none px-0">
        <div className="absolute left-[10%] right-[10%] top-5 z-0 h-1 -translate-y-1/2 rounded-full bg-border sm:top-6" />
        <div
          aria-hidden="true"
          className="absolute left-[10%] top-5 z-0 h-1 -translate-y-1/2 rounded-full bg-accent transition-[width] duration-200 motion-reduce:transition-none sm:top-6"
          style={{ width: `${progressPercent}%` }}
        />

        <ol className="relative z-10 grid grid-cols-5 gap-1 sm:gap-3">
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isDone = isCompleted(step.id);
            const isInProgress = isActive && !isDone;
            const Icon = step.icon;

            return (
              <li key={step.id} className="min-w-0 text-center">
                <div className="group/step relative z-10 mx-auto w-fit">
                  <button
                    type="button"
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Step ${step.id}: ${step.title}${isInProgress ? ", in progress" : ""}`}
                    aria-describedby={`workflow-step-${step.id}-description`}
                    onClick={() => {
                      if (isLeader) {
                        onStepClick(step.id);
                      }
                    }}
                    disabled={!isLeader}
                    title={!isLeader ? "Workflow steps are managed by the project leader" : undefined}
                    className={`
                      relative z-10 mx-auto flex h-11 w-11 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 motion-reduce:transition-none sm:h-12 sm:w-12
                      ${
                        isActive
                          ? "border-accent bg-accent text-white shadow-sm ring-2 ring-accent/10"
                          : isDone
                            ? isLeader
                              ? "border-accent/30 bg-white text-accent hover:bg-primary-light shadow-sm cursor-pointer"
                              : "border-accent/30 bg-white text-accent/70 shadow-sm cursor-default"
                            : isLeader
                              ? "border-border bg-white text-text-secondary shadow-sm hover:border-accent/40 hover:text-accent cursor-pointer"
                              : "border-border bg-bg-secondary text-text-secondary shadow-none cursor-default"
                      }
                      ${!isLeader ? "cursor-default select-none" : ""}
                    `}
                  >
                    {isInProgress && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-1 rounded-full border-2 border-accent/25 border-t-accent motion-safe:animate-spin motion-reduce:animate-none"
                      />
                    )}
                    {isDone ? (
                      <FiCheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                  <div
                    id={`workflow-step-${step.id}-description`}
                    role="tooltip"
                    className={`invisible pointer-events-none absolute top-full z-(--z-index-tooltip) mt-2 w-56 translate-y-1 rounded-lg border border-border bg-surface-white px-3 py-2 text-left text-xs leading-5 text-text-secondary opacity-0 shadow-[0_4px_12px_rgba(18,35,49,0.10)] transition-[opacity,transform,visibility] duration-150 group-hover/step:visible group-hover/step:translate-y-0 group-hover/step:opacity-100 group-focus-within/step:visible group-focus-within/step:translate-y-0 group-focus-within/step:opacity-100 motion-reduce:transition-none ${
                      step.id === 1
                        ? "left-0 translate-x-0"
                        : step.id === STEPS.length
                          ? "right-0 translate-x-0"
                          : "left-1/2 -translate-x-1/2"
                    }`}
                  >
                    {getInstructionDescription(step.id, isLeader)}
                  </div>
                </div>

                <div className="mt-2 px-0.5 sm:px-2">
                  <p
                    className={`text-xs font-medium ${isActive ? "text-accent" : "text-text-muted"}`}
                  >
                    Step {step.id}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] leading-3 font-medium sm:truncate sm:text-xs sm:leading-normal ${isActive ? "text-text-primary" : "text-text-secondary"}`}
                  >
                    {step.title}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mx-auto mt-5 w-full border-b border-border">
        <div className="flex min-h-10 flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-text-primary sm:text-lg">
                {currentStep === 3 ? "Paper Repository" : getInstructionTitle(currentStep, isLeader)}
              </h2>
              {!isLeader && currentStep === 5 && (
                <span className="rounded-full bg-bg-secondary px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                  Read-only
                </span>
              )}
            </div>
          </div>

          {actions.length > 0 && (
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              {actions.map((action, i) => (
                <button
                  key={`${action.label}-${i}`}
                  type="button"
                  onClick={action.onClick}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 motion-reduce:transition-none ${
                    action.primary
                      ? "bg-primary text-white hover:bg-primary-hover"
                      : "border border-border bg-white text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                  }`}
                >
                  {action.label}
                  {action.icon && <action.icon className="h-4 w-4" aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {currentStep >= 3 && onTabChange && (
          <HeroNav
            activeTab={activeTab}
            onChange={onTabChange}
            isLeader={isLeader}
          />
        )}
      </div>
    </section>
  );
}

function getInstructionTitle(step: number, isLeader = true) {
  switch (step) {
    case 1:
      return "Research Strategy (Protocol Reference)";
    case 2:
      return "Define Search Strategy";
    case 3:
      return "Paper Repository";
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
      return "Your Research Questions and PICO-C definitions established during project setup. You can review or update them here as your reference.";
    case 2:
      return "Define the academic databases (e.g., Scopus, Web of Science) you will search. You must add at least one source to proceed.";
    case 3:
      return "Search, review, and organize papers for this systematic review.";
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
