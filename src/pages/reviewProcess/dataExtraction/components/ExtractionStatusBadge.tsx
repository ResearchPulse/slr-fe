import { cn } from "../../../../utils/cn";
import type { ExtractionPaperStatus } from "../types";

const EXTRACTION_STATUS_LABELS: Record<ExtractionPaperStatus, string> = {
  todo: "Not Started",
  "in-progress": "In Progress",
  "awaiting-consensus": "Awaiting Consensus",
  completed: "Completed",
};

const EXTRACTION_STATUS_STYLES: Record<ExtractionPaperStatus, string> = {
  todo: "bg-text-secondary/50",
  "in-progress": "bg-primary",
  "awaiting-consensus": "bg-warning",
  completed: "bg-success",
};

interface ExtractionStatusBadgeProps {
  status: ExtractionPaperStatus;
  className?: string;
}

export default function ExtractionStatusBadge({
  status,
  className,
}: ExtractionStatusBadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-xs font-medium text-text-secondary", className)}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", EXTRACTION_STATUS_STYLES[status])}
      />
      {EXTRACTION_STATUS_LABELS[status]}
    </span>
  );
}
