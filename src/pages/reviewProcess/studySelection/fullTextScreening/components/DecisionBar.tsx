import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiCheck, FiChevronDown, FiChevronUp, FiX, FiAlertTriangle } from "react-icons/fi";
import { type RootState } from "../../../../../redux/store";
import { cn } from "../../../../../utils/cn";
import { useStudySelectionExclusionReasons } from "../../../../../hooks/useStudySelection";
import ExcludeMenu from "../../components/ExcludeMenu";
import ReviewCommentField from "../../components/ReviewCommentField";
import type { FullTextPaper } from "../types";
import { PaperPhase } from "../../../../../types/studySelection";

interface DecisionBarProps {
  paper: FullTextPaper;
  onInclude: (paperId: string, comment?: string | null) => void;
  onExclude: (
    paperId: string,
    exclusionReasonId: string | null,
    reason: string | null,
  ) => void;
  isSubmitting: boolean;
  canReview: boolean;
}

function StickyVoteFooter({
  isCollapsed,
  setIsCollapsed,
  label,
  children,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  label: "vote status" | "vote controls";
  children: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-20 shrink-0 border-t border-border bg-white/95 shadow-[0_-3px_12px_rgba(15,23,42,0.08)] backdrop-blur-md">
      {isCollapsed ? (
        <div className="flex items-center justify-end px-3 py-1.5 sm:px-4">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            aria-expanded={false}
            aria-label="Show vote bar"
            title="Show vote bar"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            Show vote bar <FiChevronUp className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-end px-3 pt-1 sm:px-4">
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              aria-expanded={true}
              aria-label={`Hide ${label}`}
              title={`Hide ${label}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <FiChevronDown className="h-4 w-4" />
            </button>
          </div>
          {children}
        </>
      )}
    </div>
  );
}

export default function DecisionBar({
  paper,
  onInclude,
  onExclude,
  isSubmitting,
  canReview,
}: DecisionBarProps) {
  const { screeningProcessId } = useParams<{ screeningProcessId: string }>();
  const decisionLabel =
    paper.finalDecisionText ??
    (paper.screeningStatus === "included" ? "Included" : "Excluded");

  const [reasonPageSize, setReasonPageSize] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: exclusionReasons = [] } = useStudySelectionExclusionReasons(
    screeningProcessId,
    { onlyActive: true, pageSize: reasonPageSize },
  );

  const hasMoreReasons = exclusionReasons.length >= reasonPageSize;

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const myDecision = paper.myDecision ?? (currentUser
    ? paper.decisions.find(
        (d) => String(d.reviewerId) === String(currentUser.id) && Number(d.phase) === PaperPhase.FullText,
      )
    : null);

  useEffect(() => {
    setReviewComment("");
    setIsCollapsed(false);
  }, [paper.id]);

  // A submitted Full Text vote always takes precedence over a stale canReview prop.
  if (!canReview || myDecision) {
    if (
      myDecision &&
      (paper.screeningStatus === "pending" ||
        paper.screeningStatus === "conflicted")
    ) {
      const isInclude =
        String(myDecision.decision).toLowerCase() === "included";
      return (
        <StickyVoteFooter isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} label="vote status">
          <div className="px-4 pb-3">
          <div
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
              isInclude
                ? "bg-surface-white text-green-700"
                : "bg-surface-white text-red-700",
            )}
          >
            {isInclude ? (
              <>
                <FiCheck className="w-4 h-4" /> You Included
              </>
            ) : (
              <>
                <FiX className="w-4 h-4" /> You Excluded
              </>
            )}
            <span className="text-[10px] opacity-60 ml-1">
              {paper.screeningStatus === "conflicted"
                ? "(Conflicted)"
                : "(Pending others)"}
            </span>
          </div>
          </div>
        </StickyVoteFooter>
      );
    }

    return (
      <StickyVoteFooter isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} label="vote status">
        <div className="px-4 pb-3">
        <div
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
            paper.screeningStatus === "included"
              ? "bg-surface-white text-green-700"
              : paper.screeningStatus === "excluded"
                ? "bg-surface-white text-red-700"
                : "bg-amber-50 text-amber-700",
          )}
        >
          {paper.screeningStatus === "included" ? (
            <>
              <FiCheck className="w-4 h-4" /> {decisionLabel}
            </>
          ) : paper.screeningStatus === "excluded" ? (
            <>
              <FiX className="w-4 h-4" /> {decisionLabel}
            </>
          ) : (
            <>
              <FiAlertTriangle className="w-4 h-4" /> Conflict — Needs
              Resolution
            </>
          )}
        </div>
        </div>
      </StickyVoteFooter>
    );
  }

  return (
    <StickyVoteFooter isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} label="vote controls">
      <div className="px-3 pb-2.5 sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <ReviewCommentField
          value={reviewComment}
          onChange={setReviewComment}
          disabled={isSubmitting}
        />
        <div className="flex shrink-0 items-center gap-2">
        {/* Include */}
        <button
          onClick={() => onInclude(paper.id, reviewComment.trim() || null)}
          disabled={isSubmitting}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-white px-3 text-xs font-semibold text-text-primary transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiCheck className="h-3.5 w-3.5 text-emerald-700" />
          Include
          <kbd className="ml-0.5 rounded border border-border bg-bg-secondary px-1 py-0.5 text-[10px] font-medium text-text-secondary">
            1
          </kbd>
        </button>

        {/* Exclude */}
        <ExcludeMenu
          paperId={paper.id}
          onExclude={onExclude}
          isSubmitting={isSubmitting}
          exclusionReasons={exclusionReasons}
          hasMoreReasons={hasMoreReasons}
          onShowMoreReasons={() => setReasonPageSize((prev) => prev + 5)}
          onResetReasons={() => setReasonPageSize(5)}
        />
        </div>
      </div>
      </div>
    </StickyVoteFooter>
  );
}
