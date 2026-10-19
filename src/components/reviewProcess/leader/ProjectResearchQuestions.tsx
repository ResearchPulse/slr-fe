import React from "react";
import { clsx } from "clsx";
import { HelpCircle } from "lucide-react";

interface ResearchQuestion {
  id: string;
  questionText: string;
}

interface ProjectResearchQuestionsProps {
  researchQuestions: ResearchQuestion[] | undefined;
  isCompact?: boolean;
}

const ProjectResearchQuestions: React.FC<ProjectResearchQuestionsProps> = ({
  researchQuestions,
  isCompact,
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-text-primary font-bold text-xs uppercase tracking-widest">
        <HelpCircle className="w-4 h-4 text-accent" />
        Research Questions
      </div>
      <div
        className={clsx(
          "grid gap-3",
          isCompact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
        )}
      >
        {researchQuestions && researchQuestions.length > 0 ? (
          researchQuestions.map((rq, index) => (
            <ResearchQuestionCard
              key={rq.id}
              index={index}
              text={rq.questionText}
              isCompact={isCompact}
            />
          ))
        ) : (
          <div className="col-span-full py-6 text-center bg-bg-secondary rounded-xl border border-dashed border-border text-text-secondary text-sm italic">
            No research questions defined.
          </div>
        )}
      </div>
    </section>
  );
};

const ResearchQuestionCard = ({
  index,
  text,
  isCompact,
}: {
  index: number;
  text: string;
  isCompact?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isLongText = text.length > 100;

  return (
    <div className="group flex h-fit flex-col gap-2 rounded-xl border border-border bg-surface-white p-4 transition-colors duration-150 hover:border-primary/30 motion-reduce:transition-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-[10px] font-bold text-text-secondary transition-colors group-hover:text-accent motion-reduce:transition-none">
            RQ{index + 1}
          </div>
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            Question
          </span>
        </div>
        {isLongText && !isCompact && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-bold uppercase tracking-tight text-accent transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
          >
            {isExpanded ? "Collapse" : "View Full"}
          </button>
        )}
      </div>
      <p
        className={clsx(
          "text-text-primary text-sm font-medium break-words leading-relaxed",
          !isCompact && !isExpanded && "line-clamp-2",
        )}
      >
        {text}
      </p>
    </div>
  );
};

export default ProjectResearchQuestions;
