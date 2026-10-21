import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Layers3 } from "lucide-react";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { useReviewProcessSnapshots } from "../../../hooks/useReviewProcesses";
import QueryErrorState from "../../../components/ui/QueryErrorState";

const supportedSections = new Set([
  "overview",
  "descriptive-charts",
  "thematic-analysis",
  "rq-reporting",
  "argument-web",
]);

export default function CanonicalSynthesisRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { snapshots, isLoading, isError, error, refetch } =
    useReviewProcessSnapshots(projectId);
  const requestedSection = location.pathname.split("/synthesis/")[1]?.split("/")[0];
  const section = requestedSection && supportedSections.has(requestedSection)
    ? requestedSection
    : "overview";
  const processOptions = snapshots.flatMap((process) => {
    const processId = process.id || process.processId;
    return processId ? [{ process, processId }] : [];
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg-secondary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-[60vh] bg-bg-secondary px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto max-w-3xl rounded-xl border border-border bg-surface-white p-5 sm:p-8">
        <Link
          to={`/projects/${projectId}`}
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-text-secondary motion-safe:transition-colors motion-reduce:transition-none hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to project
        </Link>

        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <Layers3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
              Choose a review process
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
              Synthesis is organized within a review process. Choose the process
              you want to continue.
            </p>
          </div>
        </div>

        {isError ? (
          <QueryErrorState
            className="mt-6 border-0 bg-transparent p-0"
            title="Review processes unavailable"
            message={error || "Review processes could not be loaded."}
            onRetry={() => void refetch()}
          />
        ) : processOptions.length > 0 ? (
          <ul className="mt-6 divide-y divide-border rounded-xl border border-border">
            {processOptions.map(({ process, processId }) => (
              <li key={processId}>
                <Link
                  to={`/projects/${projectId}/processes/${processId}/synthesis/${section}`}
                  className="group flex min-h-16 items-center justify-between gap-3 rounded-xl px-4 py-3 motion-safe:transition-colors motion-reduce:transition-none hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-primary">
                      {process.name || process.processName || "Untitled review process"}
                    </span>
                    <span className="mt-1 block text-xs text-text-secondary">
                      {process.statusText || "Status unavailable"}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform motion-reduce:transition-none group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-xl border border-border bg-bg-primary p-5">
            <h2 className="text-base font-semibold text-text-primary">
              No review processes yet
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Create a review process for this project before opening its synthesis workspace.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
