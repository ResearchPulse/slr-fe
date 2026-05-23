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
      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-widest">
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
          <div className="col-span-full py-6 text-center bg-bg-secondary rounded-[4px] border border-dashed border-border text-text-secondary text-sm italic">
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
    <div className="flex flex-col gap-2 p-4 bg-surface-white border border-border rounded-[4px] hover:border-indigo-200 transition-all shadow-none group h-fit">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-[4px] bg-bg-secondary flex items-center justify-center text-text-secondary font-bold text-[10px] group-hover:bg-bg-secondary group-hover:text-accent transition-colors">
            RQ{index + 1}
          </div>
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            Question
          </span>
        </div>
        {isLongText && !isCompact && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-black text-accent uppercase tracking-tighter hover:underline opacity-60 hover:opacity-100"
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
