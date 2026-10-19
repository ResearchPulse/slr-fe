import React from "react";
import { useSelector } from "react-redux";
import { FiCheck, FiX, FiAlertTriangle } from "react-icons/fi";
import type { ScreeningPaper } from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";
import type { RootState } from "../../../../../redux/store";
import { cn } from "../../../../../utils/cn";
import { PaperPhase } from "../../../../../types/studySelection";

interface DecisionStatusProps {
  paper: ScreeningPaper;
  phase: PaperPhase;
}

export const DecisionStatus: React.FC<DecisionStatusProps> = ({ paper, phase }) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const myDecision = currentUser
    ? paper.decisions.find((d) => d.reviewerId === currentUser.id)
    : null;
  const statusLabel: Record<typeof paper.screeningStatus, string> = {
    pending: "Pending",
    included: "Included",
    excluded: "Excluded",
    conflicted: "Conflicted",
  };
  const decisionLabel = paper.finalDecisionText || statusLabel[paper.screeningStatus];

  if (
    myDecision &&
    (paper.screeningStatus === "pending" ||
      paper.screeningStatus === "conflicted")
  ) {
    const isInclude = String(myDecision.decision).toLowerCase() === "included";
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-6 py-3 rounded-xl border font-black uppercase tracking-widest text-[11px]",
          isInclude
            ? "bg-success/10 text-success border-success/20"
            : "bg-error/10 text-error border-error/20",
        )}
      >
        {isInclude ? (
          <FiCheck className="w-4 h-4" />
        ) : (
          <FiX className="w-4 h-4" />
        )}
        You {isInclude
          ? phase === PaperPhase.TitleAbstract ? "Advanced this paper to Full Text" : "Marked this paper for inclusion"
          : "Excluded this paper"}
        <span className="ml-auto opacity-50">
          {paper.screeningStatus === "conflicted"
            ? "(Conflicted)"
            : "(Pending Others)"}
        </span>
      </div>
    );
  }

  const isIncluded = paper.screeningStatus === "included";
  const isExcluded = paper.screeningStatus === "excluded";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-6 py-3 rounded-xl border font-black uppercase tracking-widest text-[11px]",
        isIncluded
          ? "bg-success/10 text-success border-success/20"
          : isExcluded
            ? "bg-error/10 text-error border-error/20"
            : "bg-warning/10 text-warning border-warning/20",
      )}
    >
      {isIncluded ? (
        <FiCheck className="w-4 h-4" />
      ) : isExcluded ? (
        <FiX className="w-4 h-4" />
      ) : (
        <FiAlertTriangle className="w-4 h-4" />
      )}
      {decisionLabel}
      {!isIncluded && !isExcluded && (
        <span className="ml-auto opacity-50">
          {paper.screeningStatus === "conflicted"
            ? "Resolution Required"
            : "Awaiting reviewer decisions"}
        </span>
      )}
    </div>
  );
};
