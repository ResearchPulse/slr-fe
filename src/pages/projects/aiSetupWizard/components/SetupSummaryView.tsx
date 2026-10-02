import { useEffect, useRef, useState } from "react";
import type { EditableResearchQuestion, PicoCForm, ScopeForm } from "../types";

interface SetupSummaryViewProps {
  topic?: string;
  projectTitle?: string;
  projectDomain?: string;
  scopeForm?: ScopeForm;
  picocForm: PicoCForm;
  researchQuestions: EditableResearchQuestion[];
  onEdit: () => void;
  isLeader?: boolean;
  hideEditButton?: boolean;
  hidePicoc?: boolean;
  hideResearchQuestions?: boolean;
}

const frameworkItems = [
  ["P", "Population", "population"],
  ["I", "Intervention", "intervention"],
  ["C", "Comparator", "comparator"],
  ["O", "Outcome", "outcome"],
  ["C", "Context", "context"],
] as const;

function PicoCCard({
  letter,
  title,
  value,
}: {
  letter: string;
  title: string;
  value: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hasHiddenText, setHasHiddenText] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const element = textRef.current;
    if (!element) {
      setHasHiddenText(false);
      return;
    }
    if (expanded) return;

    const measureOverflow = () => {
      setHasHiddenText(element.scrollHeight > element.clientHeight + 1);
    };

    measureOverflow();
    const observer = new ResizeObserver(measureOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, value]);

  return (
    <article className="rounded-[14px] border border-border bg-white p-3.5">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sm font-semibold text-accent">
          {letter}
        </span>
        <h4 className="text-[15px] font-semibold text-text-primary">{title}</h4>
      </div>

      {!value ? (
        <p className="text-sm text-text-secondary">Not defined</p>
      ) : (
        <p
          ref={textRef}
          className={`max-w-[52ch] whitespace-pre-line text-sm leading-[1.6] text-text-secondary ${expanded ? "break-words" : "line-clamp-3 break-words"
            }`}
        >
          {value}
        </p>
      )}

      {(hasHiddenText || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 text-xs font-medium text-accent hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "View details"}
        </button>
      )}
    </article>
  );
}

export default function SetupSummaryView({
  picocForm,
  researchQuestions,
  onEdit,
  isLeader = false,
  hideEditButton = false,
  hidePicoc = false,
  hideResearchQuestions = false,
}: SetupSummaryViewProps) {
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const questionsToShow = showAllQuestions
    ? researchQuestions
    : researchQuestions.slice(0, 2);
  const hiddenQuestionCount = Math.max(0, researchQuestions.length - 2);

  const editButton = isLeader && !hideEditButton && (
    <button
      type="button"
      onClick={onEdit}
      className="rounded-lg border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-primary shadow-xs"
    >
      Edit Protocol
    </button>
  );

  return (
    <section className="space-y-7">
      {!hidePicoc && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold tracking-tight text-text-primary">
              PICO-C framework
            </h3>
            {editButton}
          </div>
          <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {frameworkItems.map(([letter, title, key]) => (
              <PicoCCard
                key={key}
                letter={letter}
                title={title}
                value={picocForm[key] || ""}
              />
            ))}
          </div>
        </section>
      )}

      {!hideResearchQuestions && (
        <section className="mt-7 rounded-[14px] border border-border bg-white p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-lg font-semibold text-text-primary">
              Research questions
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary">
                {researchQuestions.length} {researchQuestions.length === 1 ? "question" : "questions"} defined
              </span>
              {hidePicoc && editButton}
            </div>
          </div>

          {researchQuestions.length ? (
            <ol className="divide-y divide-border">
              {questionsToShow.map((question, index) => (
                <li
                  key={`${question.id ?? "new"}-${index}`}
                  className="flex gap-3 py-3 first:pt-1 last:pb-1"
                >
                  <span className="shrink-0 pt-0.5 text-xs font-semibold text-accent">
                    RQ{index + 1}
                  </span>
                  <p className="w-full break-words text-sm leading-[1.6] text-text-primary">
                    {question.questionText}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-2 text-sm text-text-secondary">
              No research questions have been added.
            </p>
          )}

          {hiddenQuestionCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllQuestions((current) => !current)}
              className="mt-2 text-sm font-medium text-accent hover:underline"
              aria-expanded={showAllQuestions}
            >
              {showAllQuestions
                ? "Show fewer questions"
                : `View all ${researchQuestions.length} questions`}
            </button>
          )}
        </section>
      )}
    </section>
  );
}
