import type { QAReviewerProgressResponse } from "../../../../types/qualityAssessment";
import Card from "../../../../components/ui/Card";
import { CheckCircle2, Clock } from "lucide-react";

interface ReviewerProgressPanelProps {
  reviewerProgresses: QAReviewerProgressResponse[];
}

export function ReviewerProgressPanel({
  reviewerProgresses: memberProgresses,
}: ReviewerProgressPanelProps) {
  if (!memberProgresses || memberProgresses.length === 0) return null;

  return (
    <Card className="overflow-hidden rounded-xl border border-border bg-surface-white shadow-sm">
      <div className="border-b border-border bg-surface-white px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-text-primary">
          Reviewer Progress
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Track individual completion rates
        </p>
      </div>
      <div className="space-y-5 p-4 sm:p-5">
        {memberProgresses.map((progress) => (
          <div key={progress.reviewerId} className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span
                className="font-medium text-text-primary truncate mr-2"
                title={progress.reviewerName || "Unknown Reviewer"}
              >
                {progress.reviewerName || "Unknown Reviewer"}
              </span>
              <span className="whitespace-nowrap rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {progress.completionPercentage.toFixed(0)}%
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-secondary">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress.completionPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 p-2 bg-emerald-50 text-emerald-700 rounded-[4px]">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="font-medium">
                  {progress.completedPapers} done
                </span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-blue-50 text-blue-700 rounded-[4px]">
                <Clock size={14} className="text-blue-500" />
                <span className="font-medium">
                  {progress.inProgressPapers + progress.notStartedPapers} max
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
