import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, FileSearch, RefreshCw } from "lucide-react";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import QueryErrorState from "../../../components/ui/QueryErrorState";
import { useProjectMember } from "../../../hooks/useProjectMember";
import { slrArtifactsService, SLR_ARTIFACT_TYPES, type SlrArtifactType } from "../../../services/slrArtifactsService";
import { Empty, GenericArtifactView, isObject, asText, StatusPill } from "./SlrArtifactsShared";
import { A1View } from "./slrArtifacts/A1View";
import { A2View } from "./slrArtifacts/A2View";
import { A3View } from "./slrArtifacts/A3View";
import { A4View } from "./slrArtifacts/A4View";
import { A5View } from "./slrArtifacts/A5View";
import { A6View } from "./slrArtifacts/A6View";
import { A8View } from "./slrArtifacts/A8View";
import { A7View } from "./slrArtifacts/A7View";
const dateText = (value: unknown) => typeof value === "string" ? new Date(value).toLocaleString() : "—";

export default function SlrArtifactsWorkspace({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { member } = useProjectMember(projectId);
  const isLeader = member?.isLeader ?? false;
  const [artifactType, setArtifactType] = useState<SlrArtifactType>("A1");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const runsQuery = useQuery({ queryKey: ["slr-artifact-runs", projectId], queryFn: () => slrArtifactsService.listRuns(projectId) });
  const runs = runsQuery.data ?? [];
  const runId = selectedRunId && runs.some((run) => run.run_id === selectedRunId) ? selectedRunId : runs[0]?.run_id;
  const artifactQuery = useQuery({ queryKey: ["slr-artifact", projectId, runId, artifactType], queryFn: () => slrArtifactsService.getArtifact(projectId, runId!, artifactType), enabled: Boolean(runId) });
  const corpusQuery = useQuery({ queryKey: ["slr-artifact-corpus", projectId, runId], queryFn: () => slrArtifactsService.getArtifact(projectId, runId!, "corpus"), enabled: Boolean(runId && artifactType === "A1") });
  const generateMutation = useMutation({ mutationFn: () => slrArtifactsService.generateRun(projectId), onSuccess: async (run) => { setSelectedRunId(run.run_id); await queryClient.invalidateQueries({ queryKey: ["slr-artifact-runs", projectId] }); } });
  const reviewMutation = useMutation({ mutationFn: (decision: "APPROVED" | "REJECTED") => slrArtifactsService.reviewArtifact(projectId, runId!, artifactType, decision), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["slr-artifact-runs", projectId] }); await queryClient.invalidateQueries({ queryKey: ["slr-artifact", projectId, runId, artifactType] }); } });
  const artifact = isObject(artifactQuery.data) ? artifactQuery.data : null;
  const corpus = isObject(corpusQuery.data) ? corpusQuery.data : null;
  const metadata = artifact && isObject(artifact.metadata) ? artifact.metadata : null;
  const validationStatus = asText(metadata?.validation_status);
  const currentRun = useMemo(() => runs.find((run) => run.run_id === runId), [runs, runId]);
  const selectedLabel = artifact ? asText(artifact.title, artifactType) : artifactType;

  if (runsQuery.isLoading) return <div className="flex min-h-56 items-center justify-center"><LoadingSpinner /></div>;
  if (runsQuery.error) return <QueryErrorState title="Artifacts unavailable" message={runsQuery.error instanceof Error ? runsQuery.error.message : "Unable to load artifact runs."} onRetry={() => void runsQuery.refetch()} retryLabel="Retry" />;

  return <div className="space-y-5" aria-label="SLR artifacts workspace">
    <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface-white p-5"><div className="max-w-3xl"><div className="flex items-center gap-2 text-primary"><FileSearch className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wide">Evidence synthesis</span></div><h2 className="mt-2 text-xl font-semibold text-text-primary">SLR artifacts</h2><p className="mt-1 text-sm leading-6 text-text-secondary">Generate a versioned A1–A10 package from the project corpus. Each view keeps its source links, validation status and review state.</p></div>{isLeader && <Button onClick={() => generateMutation.mutate()} isLoading={generateMutation.isPending}><RefreshCw className="h-4 w-4" />Generate A1–A10</Button>}</header>
    {generateMutation.error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-text-secondary"><AlertCircle className="mt-0.5 h-4 w-4 text-error" />{generateMutation.error instanceof Error ? generateMutation.error.message : "Could not generate the artifacts."}</div>}
    {reviewMutation.error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/5 p-3 text-sm text-text-secondary"><AlertCircle className="mt-0.5 h-4 w-4 text-error" />{reviewMutation.error instanceof Error ? reviewMutation.error.message : "Could not save the review decision."}</div>}
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-white p-4">
      <label className="min-w-56 flex-1 text-xs font-medium text-text-secondary">Generation run<select value={runId ?? ""} onChange={(event) => setSelectedRunId(event.target.value || null)} disabled={!runs.length} className="mt-1 block h-11 w-full rounded-lg border border-border bg-surface-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30">{runs.map((run) => <option key={run.run_id} value={run.run_id}>{dateText(run.generated_at)} · {run.run_id}</option>)}</select></label>
      <label className="min-w-56 flex-1 text-xs font-medium text-text-secondary">Artifact<select value={artifactType} onChange={(event) => setArtifactType(event.target.value as SlrArtifactType)} className="mt-1 block h-11 w-full rounded-lg border border-border bg-surface-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30">{SLR_ARTIFACT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
      {isLeader && artifact && <Button variant="outline" size="sm" disabled={metadata?.review_status === "approved" || validationStatus === "invalid" || reviewMutation.isPending} isLoading={reviewMutation.isPending} onClick={() => reviewMutation.mutate("APPROVED")}><Check className="h-4 w-4" />Approve after review</Button>}
    </div>
    {!runs.length ? <Empty title="No artifact runs yet" detail={isLeader ? "Generate the first package when the project corpus is ready." : "The project leader has not generated an artifact package yet."} /> : artifactQuery.isLoading ? <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div> : artifactQuery.error ? <QueryErrorState title={`${artifactType} unavailable`} message={artifactQuery.error instanceof Error ? artifactQuery.error.message : "Unable to load this artifact."} onRetry={() => void artifactQuery.refetch()} retryLabel="Retry" /> : artifact ? <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg-primary p-4"><div><h3 className="font-semibold text-text-primary">{selectedLabel}</h3><p className="mt-1 text-xs text-text-muted">Run {asText(currentRun?.run_id)} · generated {dateText(metadata?.generated_at ?? currentRun?.generated_at)} · corpus {asText(isObject(metadata?.corpus) ? metadata.corpus.corpus_version : currentRun?.corpus_version)}</p></div><div className="flex flex-wrap gap-2"><StatusPill>{asText(metadata?.review_status, "unreviewed")}</StatusPill><StatusPill>{asText(metadata?.validation_status, "not applicable")}</StatusPill></div></div>
      {artifactType === "A1" ? <A1View data={artifact} corpus={corpus} /> : artifactType === "A2" ? <A2View data={artifact} /> : artifactType === "A3" ? <A3View data={artifact} /> : artifactType === "A4" ? <A4View data={artifact} /> : artifactType === "A5" ? <A5View data={artifact} /> : artifactType === "A6" ? <A6View data={artifact} /> : artifactType === "A7" ? <A7View data={artifact} /> : artifactType === "A8" ? <A8View data={artifact} /> : <GenericArtifactView type={artifactType} data={artifact} corpus={corpus} />}
      {artifactType === "A1" && corpusQuery.error && <p role="alert" className="text-sm text-warning">Source quotes could not be loaded: {corpusQuery.error instanceof Error ? corpusQuery.error.message : "corpus unavailable"}</p>}
    </> : <Empty title="Artifact is empty" detail="The selected artifact has no stored payload." />}
  </div>;
}
