import { ArrowLeft, ChevronRight, Layers3 } from "lucide-react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import QueryErrorState from "../../components/ui/QueryErrorState";
import type { ReviewProcess } from "../../types/reviewProcess";
import {
  useReviewProcess,
  useReviewProcessSnapshots,
} from "../../hooks/useReviewProcesses";

type CanonicalReviewPhase =
  | "identification"
  | "screening"
  | "screening-dashboard"
  | "assignment-management"
  | "full-text"
  | "quality-assessment";

interface CanonicalReviewPhaseRouteProps {
  phase: CanonicalReviewPhase;
}

const phaseContent: Record<CanonicalReviewPhase, { title: string; description: string }> = {
  identification: {
    title: "Identification",
    description: "Choose the review process whose search and import records you want to manage.",
  },
  screening: {
    title: "Title & Abstract Screening",
    description: "Choose the review process whose title and abstract records you want to screen.",
  },
  "screening-dashboard": {
    title: "Screening dashboard",
    description: "Choose the review process whose screening queue you want to open.",
  },
  "assignment-management": {
    title: "Assignment management",
    description: "Choose the review process whose screening assignments you want to manage.",
  },
  "full-text": {
    title: "Full-text screening",
    description: "Choose the review process whose included studies you want to assess.",
  },
  "quality-assessment": {
    title: "Quality Assessment",
    description: "Choose the review process whose methodological quality you want to assess.",
  },
};

function getPhaseId(
  phase: CanonicalReviewPhase,
  process: ReviewProcess,
) {
  switch (phase) {
    case "identification":
      return process.identificationProcess?.id;
    case "screening":
    case "screening-dashboard":
    case "assignment-management":
    case "full-text":
      return process.studySelectionProcess?.id;
    case "quality-assessment":
      return process.qualityAssessmentProcess?.id;
  }
}

function getDestination(
  phase: CanonicalReviewPhase,
  projectId: string,
  processId: string,
  phaseId: string,
) {
  switch (phase) {
    case "identification":
      return `/projects/${projectId}/processes/${processId}/identification/${phaseId}`;
    case "screening":
      return `/projects/${projectId}/processes/${processId}/screening/${phaseId}`;
    case "screening-dashboard":
      return `/projects/${projectId}/processes/${processId}/screening/${phaseId}/dashboard`;
    case "assignment-management":
      return `/projects/${projectId}/processes/${processId}/screening/${phaseId}/assignment-management`;
    case "full-text":
      return `/projects/${projectId}/processes/${processId}/full-text-screening/${phaseId}`;
    case "quality-assessment":
      return `/projects/${projectId}/processes/${processId}/quality-assessment/${phaseId}`;
  }
}

export default function CanonicalReviewPhaseRoute({ phase }: CanonicalReviewPhaseRouteProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { snapshots, isLoading, isError, error, refetch } =
    useReviewProcessSnapshots(projectId);
  const requestedProcessId = searchParams.get("reviewProcessId");
  const processOptions = snapshots.flatMap((snapshot) => {
    const processId = snapshot.id || snapshot.processId;
    return processId ? [{ snapshot, processId }] : [];
  });
  const requestedOption = processOptions.find(
    ({ processId }) => processId === requestedProcessId,
  );
  const selectedProcessId = requestedOption?.processId ??
    (processOptions.length === 1 ? processOptions[0].processId : undefined);
  const {
    process,
    isLoading: isLoadingProcess,
    isError: isProcessError,
    error: processError,
    refetch: refetchProcess,
  } = useReviewProcess(selectedProcessId, { enabled: Boolean(selectedProcessId) });
  const content = phaseContent[phase];

  const phaseId = process ? getPhaseId(phase, process) : undefined;
  const processId = process?.id || process?.processId || selectedProcessId;
  const destination = projectId && processId && phaseId
    ? getDestination(phase, projectId, processId, phaseId)
    : undefined;

  if (destination) return <Navigate to={destination} replace />;

  if (isLoading || (Boolean(selectedProcessId) && isLoadingProcess)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg-secondary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const backToProject = () => {
    if (projectId) navigate(`/projects/${projectId}`);
  };

  if (isError) {
    return (
      <main className="min-h-[60vh] bg-bg-secondary px-4 py-8 sm:px-6 sm:py-10">
        <QueryErrorState
          className="mx-auto max-w-3xl"
          title="Review processes unavailable"
          message={error || "Review processes could not be loaded."}
          onRetry={() => void refetch()}
          onBack={backToProject}
          backLabel="Back to project"
        />
      </main>
    );
  }

  if (selectedProcessId && isProcessError) {
    return (
      <main className="min-h-[60vh] bg-bg-secondary px-4 py-8 sm:px-6 sm:py-10">
        <QueryErrorState
          className="mx-auto max-w-3xl"
          title="Review process unavailable"
          message={processError || "The selected review process could not be loaded."}
          onRetry={() => void refetchProcess()}
          onBack={backToProject}
          backLabel="Back to project"
        />
      </main>
    );
  }

  if (processOptions.length === 0) {
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
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">No review process yet</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Create a review process for this project before opening {content.title}.
          </p>
        </section>
      </main>
    );
  }

  if (processOptions.length > 1 && !requestedOption) {
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
              <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Choose a review process</h1>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                {content.description}
              </p>
            </div>
          </div>
          <ul className="mt-6 divide-y divide-border rounded-xl border border-border">
            {processOptions.map(({ snapshot, processId: optionId }) => (
              <li key={optionId}>
                <button
                  type="button"
                  onClick={() => setSearchParams({ reviewProcessId: optionId })}
                  className="group flex min-h-16 w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left motion-safe:transition-colors motion-reduce:transition-none hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-primary">
                      {snapshot.name || snapshot.processName || "Untitled review process"}
                    </span>
                    <span className="mt-1 block text-xs text-text-secondary">
                      {snapshot.statusText || "Status unavailable"}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary motion-safe:transition-transform motion-reduce:transition-none group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  if (process && !phaseId) {
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
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">{content.title} is not available yet</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            This review process does not have a {content.title} phase to open.
          </p>
        </section>
      </main>
    );
  }

  if (selectedProcessId && !process) {
    return (
      <main className="min-h-[60vh] bg-bg-secondary px-4 py-8 sm:px-6 sm:py-10">
        <section className="mx-auto max-w-3xl rounded-xl border border-border bg-surface-white p-5 sm:p-8">
          <QueryErrorState
            title="Review process unavailable"
            message="The selected review process did not return any details. Try again or return to the project."
            onRetry={() => void refetchProcess()}
            onBack={backToProject}
            backLabel="Back to project"
          />
        </section>
      </main>
    );
  }

  return null;
}
