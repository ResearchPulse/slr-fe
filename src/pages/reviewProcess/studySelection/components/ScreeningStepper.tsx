import { FiCheck, FiChevronRight, FiLock } from "react-icons/fi";
import { cn } from "../../../../utils/cn";

interface ScreeningStepperProps {
  activeStep: 1 | 2;
  titleAbstractCount: number;
  fullTextCount: number;
  isTitleAbstractCompleted: boolean;
  isFullTextCompleted?: boolean;
  isFullTextLocked: boolean;
  onGoToTitleAbstract?: () => void;
  onGoToFullText?: () => void;
}

interface StepItem {
  id: 1 | 2;
  title: string;
  count: number;
  state: "active" | "completed" | "default" | "locked";
  onClick?: () => void;
  disabled?: boolean;
}

function getStepClasses(state: StepItem["state"]): string {
  switch (state) {
    case "active":
      return "bg-primary-light border-accent/30 text-accent";
    case "completed":
      return "bg-emerald-50 border-emerald-200 text-emerald-700";
    case "locked":
      return "bg-bg-secondary border-border text-text-secondary cursor-not-allowed";
    default:
      return "bg-surface-white border-border text-text-secondary hover:bg-bg-primary";
  }
}

function getDotClasses(state: StepItem["state"]): string {
  switch (state) {
    case "active":
      return "bg-primary text-white border-accent";
    case "completed":
      return "bg-emerald-600 text-white border-emerald-600";
    case "locked":
      return "bg-surface-white text-text-secondary border-border";
    default:
      return "bg-surface-white text-text-secondary border-border";
  }
}

function StepCard({ id, title, count, state, onClick, disabled }: StepItem) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3 py-2 min-w-[200px] transition-colors",
        getStepClasses(state),
      )}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full border text-[10px] font-semibold flex items-center justify-center",
          getDotClasses(state),
        )}
      >
        {state === "completed" ? <FiCheck className="h-3 w-3" /> : id}
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-semibold">{title}</span>
        <span className="text-[10px] opacity-75">{count} papers</span>
      </div>
      {state === "locked" && <FiLock className="h-3.5 w-3.5 ml-auto" />}
    </div>
  );

  if (disabled || !onClick) {
    return content;
  }

  return (
    <button type="button" onClick={onClick} className="text-left">
      {content}
    </button>
  );
}

export default function ScreeningStepper({
  activeStep,
  titleAbstractCount,
  fullTextCount,
  isTitleAbstractCompleted,
  isFullTextCompleted = false,
  isFullTextLocked,
  onGoToTitleAbstract,
  onGoToFullText,
}: ScreeningStepperProps) {
  const stepOneState: StepItem["state"] =
    activeStep === 1
      ? "active"
      : isTitleAbstractCompleted || activeStep === 2
        ? "completed"
        : "default";

  const stepTwoState: StepItem["state"] =
    activeStep === 2
      ? "active"
      : isFullTextLocked
        ? "locked"
        : isFullTextCompleted
          ? "completed"
          : "default";

  return (
    <div className="flex items-center justify-center gap-2">
      <StepCard
        id={1}
        title="Title / Abstract Screening"
        count={titleAbstractCount}
        state={stepOneState}
        onClick={onGoToTitleAbstract}
      />

      <FiChevronRight className="h-4 w-4 text-text-secondary" />

      <StepCard
        id={2}
        title="Full-Text Review"
        count={fullTextCount}
        state={stepTwoState}
        onClick={onGoToFullText}
        disabled={isFullTextLocked && activeStep !== 2}
      />
    </div>
  );
}
