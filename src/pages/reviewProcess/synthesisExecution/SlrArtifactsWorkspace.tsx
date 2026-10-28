import Select from "../../../components/ui/Select";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileSearch, LockKeyhole, RefreshCw } from "lucide-react";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import QueryErrorState from "../../../components/ui/QueryErrorState";
import { useProjectMember } from "../../../hooks/useProjectMember";
import { getErrorMessage } from "../../../utils/errorUtils";
import {
  slrArtifactsService,
  SLR_ARTIFACT_TYPES,
  type SlrArtifactType,
  type SlrGenerateOptions,
} from "../../../services/slrArtifactsService";
import { Empty, GenericArtifactView, isObject, asText, StatusPill } from "./SlrArtifactsShared";
import { A1View } from "./slrArtifacts/A1View";
import { A2View } from "./slrArtifacts/A2View";
import { A3View } from "./slrArtifacts/A3View";
import { A4View } from "./slrArtifacts/A4View";
import { A5View } from "./slrArtifacts/A5View";
import { A6View } from "./slrArtifacts/A6View";
import { A8View } from "./slrArtifacts/A8View";
import { A7View } from "./slrArtifacts/A7View";
import { A9View } from "./slrArtifacts/A9View";
import { A10View } from "./slrArtifacts/A10View";
import { ARTIFACT_NAMES } from "./slrArtifacts/artifactMeta";
import ArtifactReviewPanel, { readReviews } from "./slrArtifacts/ArtifactReviewPanel";
import GenerateOptionsPanel from "./slrArtifacts/GenerateOptionsPanel";
import A3ValidationPanel from "./slrArtifacts/A3ValidationPanel";
import PaperAiAnalysisWorkspace from "./aiAnalysis/PaperAiAnalysisWorkspace";
const dateText = (value: unknown) => typeof value === "string" ? new Date(value).toLocaleString() : "—";

function isForbiddenError(error: unknown): boolean {
  if (!isObject(error)) return false;
  if (error.status === 403) return true;
  return isObject(error.response) && error.response.status === 403;
}

function PermissionDeniedState({ detail = "Ask a project owner to add you as a project member, then return to this workspace." }: { detail?: string }) {
  return <div role="alert" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 p-5 text-sm text-text-secondary">
    <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
    <div><h3 className="font-semibold text-text-primary">You don’t have access to these SLR artifacts</h3><p className="mt-1 leading-6">{detail}</p></div>
  </div>;
}

function ErrorBanner({ message }: { message: string }) {
  return <div role="alert" className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-text-secondary"><AlertCircle className="mt-0.5 h-4 w-4 text-error" />{message}</div>;
}

export default function SlrArtifactsWorkspace({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { member } = useProjectMember(projectId);
  const isLeader = member?.isLeader ?? false;
  const [workspaceMode, setWorkspaceMode] = useState<"artifacts" | "paper-ai">("artifacts");
  const [artifactType, setArtifactType] = useState<SlrArtifactType>("A1");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const runsQuery = useQuery({ queryKey: ["slr-artifact-runs", projectId], queryFn: () => slrArtifactsService.listRuns(projectId) });
  const runs = runsQuery.data ?? [];
  const runId = selectedRunId && runs.some((run) => run.run_id === selectedRunId) ? selectedRunId : runs[0]?.run_id;
  const artifactQuery = useQuery({ queryKey: ["slr-artifact", projectId, runId, artifactType], queryFn: () => slrArtifactsService.getArtifact(projectId, runId!, artifactType), enabled: Boolean(runId) });
  const corpusQuery = useQuery({ queryKey: ["slr-artifact-corpus", projectId, runId], queryFn: () => slrArtifactsService.getArtifact(projectId, runId!, "corpus"), enabled: Boolean(runId && artifactType === "A1") });
  const generateMutation = useMutation({
    mutationFn: (options: SlrGenerateOptions) => slrArtifactsService.generateRun(projectId, options),
    onSuccess: async (run) => {
      setSelectedRunId(run.run_id);
      setIsOptionsOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["slr-artifact-runs", projectId] });
    },
  });
  const reviewMutation = useMutation({
    mutationFn: ({ decision, note }: { decision: "APPROVED" | "REJECTED"; note: string }) => slrArtifactsService.reviewArtifact(projectId, runId!, artifactType, decision, note),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["slr-artifact-runs", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["slr-artifact", projectId, runId, artifactType] });
    },
  });
  const artifact = isObject(artifactQuery.data) ? artifactQuery.data : null;
  const corpus = isObject(corpusQuery.data) ? corpusQuery.data : null;
  const metadata = artifact && isObject(artifact.metadata) ? artifact.metadata : null;
  const validationStatus = asText(metadata?.validation_status, "not_applicable");
  const reviewStatus = asText(metadata?.review_status, "unreviewed");
  const currentRun = useMemo(() => runs.find((run) => run.run_id === runId), [runs, runId]);
  const selectedLabel = artifact ? asText(artifact.title, ARTIFACT_NAMES[artifactType]) : ARTIFACT_NAMES[artifactType];

  if (workspaceMode === "artifacts" && runsQuery.isLoading) return <div className="flex min-h-56 items-center justify-center"><LoadingSpinner /></div>;
  if (workspaceMode === "artifacts" && runsQuery.error) return isForbiddenError(runsQuery.error)
    ? <PermissionDeniedState />
    : <QueryErrorState title="Artifacts unavailable" message={getErrorMessage(runsQuery.error, "Unable to load artifact runs.")} onRetry={() => void runsQuery.refetch()} retryLabel="Retry" />;

  const openOptions = () => {
    generateMutation.reset();
    setIsOptionsOpen(true);
  };

  return <div className="space-y-5" aria-label="SLR artifacts workspace">
    <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface-white p-5"><div className="max-w-3xl"><div className="flex items-center gap-2 text-primary"><FileSearch className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wide">Evidence synthesis</span></div><h2 className="mt-2 text-xl font-semibold text-text-primary">SLR artifacts</h2><p className="mt-1 text-sm leading-6 text-text-secondary">Generate a versioned A1–A10 package or inspect per-paper IMRaD, Toulmin, and AIF analyses.</p></div>{workspaceMode === "artifacts" && isLeader && !isOptionsOpen && <Button onClick={openOptions}><RefreshCw className="h-4 w-4" />Generate A1–A10</Button>}</header>
    {workspaceMode === "artifacts" && isLeader && isOptionsOpen && <GenerateOptionsPanel projectId={projectId} isSubmitting={generateMutation.isPending} submitError={generateMutation.error ? getErrorMessage(generateMutation.error, "Could not generate the artifacts.") : null} onSubmit={(options) => generateMutation.mutate(options)} onCancel={() => setIsOptionsOpen(false)} />}
    {reviewMutation.error && <ErrorBanner message={getErrorMessage(reviewMutation.error, "Could not save the review decision.")} />}
    <div role="tablist" aria-label="Synthesis analysis views" className="flex flex-wrap gap-2">
      <button type="button" role="tab" aria-selected={workspaceMode === "artifacts"} onClick={() => setWorkspaceMode("artifacts")} className={`rounded-lg border px-4 py-2 text-sm font-medium ${workspaceMode === "artifacts" ? "border-primary bg-primary/5 text-primary" : "border-border bg-surface-white text-text-secondary"}`}>A1–A10 artifacts</button>
      <button type="button" role="tab" aria-selected={workspaceMode === "paper-ai"} onClick={() => setWorkspaceMode("paper-ai")} className={`rounded-lg border px-4 py-2 text-sm font-medium ${workspaceMode === "paper-ai" ? "border-primary bg-primary/5 text-primary" : "border-border bg-surface-white text-text-secondary"}`}>IMRaD · Toulmin · AIF</button>
    </div>
    {workspaceMode === "paper-ai" ? <PaperAiAnalysisWorkspace projectId={projectId} /> : <>
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-white p-4">
      <label className="min-w-56 flex-1 text-xs font-medium text-text-secondary">Generation run<Select value={runId ?? ""} onChange={(event) => setSelectedRunId(event.target.value || null)} disabled={!runs.length} className="mt-1 block h-11 w-full rounded-lg border border-border bg-surface-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30">{runs.map((run) => <option key={run.run_id} value={run.run_id}>{dateText(run.generated_at)} · {run.run_id}</option>)}</Select></label>
    </div>
    <div role="tablist" aria-label="SLR artifacts" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface-white p-1.5">
      {SLR_ARTIFACT_TYPES.map((type) => {
        const isActive = type === artifactType;
        return <button key={type} type="button" role="tab" aria-selected={isActive} onClick={() => setArtifactType(type)} className={`min-h-11 shrink-0 rounded-lg px-3 text-left text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${isActive ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"}`}><span className="block font-semibold">{type}</span>{" "}<span className="block whitespace-nowrap">{ARTIFACT_NAMES[type]}</span></button>;
      })}
    </div>
    {!runs.length ? <Empty title="No artifact runs yet" detail={isLeader ? "Generate the first package when the project corpus is ready." : "The project leader has not generated an artifact package yet."} /> : artifactQuery.isLoading ? <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div> : artifactQuery.error ? isForbiddenError(artifactQuery.error) ? <PermissionDeniedState detail="Your project role does not allow viewing this artifact. Ask a project owner to check your project membership." /> : <QueryErrorState title={`${artifactType} unavailable`} message={getErrorMessage(artifactQuery.error, "Unable to load this artifact.")} onRetry={() => void artifactQuery.refetch()} retryLabel="Retry" /> : artifact ? <div role="tabpanel" aria-label={ARTIFACT_NAMES[artifactType]} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg-primary p-4"><div><h3 className="font-semibold text-text-primary">{selectedLabel}</h3><p className="mt-1 text-xs text-text-muted">Run {asText(currentRun?.run_id)} · generated {dateText(metadata?.generated_at ?? currentRun?.generated_at)} · corpus {asText(isObject(metadata?.corpus) ? metadata.corpus.corpus_version : currentRun?.corpus_version)}</p></div><div className="flex flex-wrap gap-2"><StatusPill>{reviewStatus}</StatusPill><StatusPill>{validationStatus.replaceAll("_", " ")}</StatusPill></div></div>
      {artifactType === "A1" ? <A1View data={artifact} corpus={corpus} /> : artifactType === "A2" ? <A2View data={artifact} /> : artifactType === "A3" ? <A3View data={artifact} /> : artifactType === "A4" ? <A4View data={artifact} /> : artifactType === "A5" ? <A5View data={artifact} /> : artifactType === "A6" ? <A6View data={artifact} /> : artifactType === "A7" ? <A7View data={artifact} /> : artifactType === "A8" ? <A8View data={artifact} /> : artifactType === "A9" ? <A9View data={artifact} /> : artifactType === "A10" ? <A10View data={artifact} /> : <GenericArtifactView type={artifactType} data={artifact} corpus={corpus} />}
      {artifactType === "A3" && runId && <A3ValidationPanel key={`${runId}-${asText(artifact.artifact_id)}`} projectId={projectId} runId={runId} artifact={artifact} />}
      {artifactType === "A1" && corpusQuery.error && (isForbiddenError(corpusQuery.error)
        ? <PermissionDeniedState detail="You can view this matrix, but your project role does not allow access to its source evidence. Ask a project owner to check your project membership." />
        : <p role="alert" className="text-sm text-warning">Source quotes could not be loaded: {getErrorMessage(corpusQuery.error, "corpus unavailable")}</p>)}
      <ArtifactReviewPanel key={`${runId}-${artifactType}`} canReview={isLeader} reviewStatus={reviewStatus} validationStatus={validationStatus} reviews={readReviews(metadata)} isSubmitting={reviewMutation.isPending} onReview={(decision, note) => reviewMutation.mutate({ decision, note })} />
    </div> : <Empty title="Artifact is empty" detail="The selected artifact has no stored payload." />}
    </>}
  </div>;
}
