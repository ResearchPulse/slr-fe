import { Link } from "react-router-dom";
import { ArrowRight, FileSearch } from "lucide-react";

interface SlrArtifactsHandoffBannerProps {
  projectId: string | null | undefined;
  /** Status of every extraction task, already normalized. */
  statuses: string[];
}

/**
 * Points to the project-wide SLR artifacts once every paper has been extracted. It only links onward:
 * the A1–A10 package also needs the synthesis themes and findings, so it is generated from Synthesis.
 */
export default function SlrArtifactsHandoffBanner({ projectId, statuses }: SlrArtifactsHandoffBannerProps) {
  if (!projectId || statuses.length === 0 || !statuses.every((status) => status === "completed")) return null;
  return (
    <section
      aria-label="SLR artifacts next step"
      className="flex flex-col gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <FileSearch className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            All {statuses.length} {statuses.length === 1 ? "paper is" : "papers are"} extracted
          </p>
          <p className="mt-0.5 text-sm text-text-secondary">
            Continue to Synthesis to organize themes and findings, then generate the project-wide SLR artifacts (A1–A10).
          </p>
        </div>
      </div>
      <Link
        to={`/projects/${projectId}/synthesis/artifacts`}
        className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        Open SLR artifacts
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
