import React, { useState } from "react";
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
  const [showAll, setShowAll] = useState(false);
  const visibleNeeds = showAll ? reviewNeeds : reviewNeeds.slice(0, 2);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {reviewNeeds.length} {reviewNeeds.length === 1 ? "review need" : "review needs"}
        </p>
        {isLeader && reviewNeeds.length > 0 && (
          <Button size="sm" onClick={onAdd}>
            Add review need
          </Button>
        )}
      </div>

      {reviewNeeds.length ? (
        <ul className="divide-y divide-border">
          {visibleNeeds.map((need) => {
            const systemSuggested =
              need.identified_by?.trim().toLowerCase() === "system";
            return (
              <li key={need.need_id} className="py-4 first:pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Review need
                  </h3>
                  <span className="text-xs text-text-secondary">
                    {systemSuggested
                      ? "System suggested"
                      : `Added by ${need.identified_by || "Project team"}`}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-text-primary">
                  {need.description}
                </p>
                {need.justification && (
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    {need.justification}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="border-t border-border py-7">
          <p className="text-sm font-medium text-text-primary">
            No review needs recorded
          </p>
          <p className="mt-1 max-w-xl text-sm leading-5 text-text-secondary">
            Describe the research gap this review will address and why a synthesis is needed.
          </p>
          {isLeader && (
            <Button size="sm" onClick={onAdd} className="mt-4">
              Add review need
            </Button>
          )}
        </div>
      )}

      {reviewNeeds.length > 2 && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-3 text-sm font-medium text-accent hover:underline"
          aria-expanded={showAll}
        >
          {showAll ? "Show fewer needs" : `View all ${reviewNeeds.length} needs`}
        </button>
      )}
    </section>
  );
};

export default ReviewNeedsTab;
