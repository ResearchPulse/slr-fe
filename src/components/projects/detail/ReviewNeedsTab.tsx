import React from "react";
import Button from "../../ui/Button";
import type { ReviewNeed } from "../../../types/coreAndGovernance";

interface ReviewNeedsTabProps {
  reviewNeeds: ReviewNeed[];
  onAdd: () => void;
  isLeader?: boolean;
}

const ReviewNeedsTab: React.FC<ReviewNeedsTabProps> = ({
  reviewNeeds,
  onAdd,
  isLeader = true,
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">
          {reviewNeeds.length} {reviewNeeds.length === 1 ? "need" : "needs"}{" "}
          identified
        </p>
        {isLeader && (
          <Button size="sm" onClick={onAdd}>
            Add Review Need
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {reviewNeeds.map((need) => (
          <div
            key={need.need_id}
            className="border border-border bg-surface-white p-5"
          >
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
                  Description
                </p>
                <p className="text-text-primary leading-[1.7] text-sm">
                  {need.description}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
                  Justification
                </p>
                <p className="text-text-secondary leading-[1.7] text-sm">
                  {need.justification}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <div className="w-5 h-5 bg-accent flex items-center justify-center text-[9px] text-bg-primary font-medium uppercase">
                  {need.identified_by.charAt(0)}
                </div>
                <p className="text-[11px] text-text-secondary">
                  Identified by{" "}
                  <span className="font-medium text-text-primary">
                    {need.identified_by}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}
        {reviewNeeds.length === 0 && (
          <div className="border border-dashed border-border py-14 text-center">
            <p className="text-text-muted text-sm">No review needs added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewNeedsTab;
