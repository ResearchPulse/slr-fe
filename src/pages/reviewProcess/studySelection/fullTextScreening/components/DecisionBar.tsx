import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiCheck, FiX, FiAlertTriangle } from "react-icons/fi";
import { type RootState } from "../../../../../redux/store";
import { cn } from "../../../../../utils/cn";
import { useStudySelectionExclusionReasons } from "../../../../../hooks/useStudySelection";
import ExcludeMenu from "../../components/ExcludeMenu";
import ReviewCommentField from "../../components/ReviewCommentField";
import type { FullTextPaper } from "../types";

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
  const { data: exclusionReasons = [] } = useStudySelectionExclusionReasons(
    screeningProcessId,
    { onlyActive: true, pageSize: reasonPageSize },
  );

  const hasMoreReasons = exclusionReasons.length >= reasonPageSize;

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const myDecision = currentUser
    ? paper.decisions.find((d) => d.reviewerId === currentUser.id)
    : null;

  useEffect(() => {
    setReviewComment("");
  }, [paper.id]);

  if (!canReview) {
    if (
      myDecision &&
      (paper.screeningStatus === "pending" ||
        paper.screeningStatus === "conflicted")
    ) {
      const isInclude =
        String(myDecision.decision).toLowerCase() === "included";
      return (
        <div className="border-t border-border bg-surface-white px-4 py-3 shrink-0">
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
      );
    }

    return (
      <div className="border-t border-border bg-surface-white px-4 py-3 shrink-0">
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
    );
  }

  return (
    <div className="shrink-0 border-t border-border bg-surface-white px-3 py-2.5 sm:px-4">
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
  );
}
