import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import Button from "../../../../components/ui/Button";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { slrArtifactsService, type SlrValidationIssue, type SlrValidationReport } from "../../../../services/slrArtifactsService";
import { StatusPill, type Data } from "../SlrArtifactsShared";

/** The graph without the server-owned metadata envelope, as pretty JSON. */
export function graphToText(artifact: Data): string {
  const graph: Data = { ...artifact };
  delete graph.metadata;
  return JSON.stringify(graph, null, 2);
}

function IssueList({ title, issues }: { title: string; issues: SlrValidationIssue[] }) {
  if (!issues.length) return null;
  return <div><h4 className="text-sm font-semibold text-text-primary">{title}</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-text-secondary">{issues.map((issue, index) => <li key={`${issue.code}-${index}`}><StatusPill>{issue.severity}</StatusPill> {issue.message}{issue.path ? ` (${issue.path})` : ""}</li>)}</ul></div>;
}

/** Checks an edited A3 graph against the run's corpus. Nothing is saved: the check only reports. */
export default function A3ValidationPanel({ projectId, runId, artifact }: { projectId: string; runId: string; artifact: Data }) {
  const initialText = useMemo(() => graphToText(artifact), [artifact]);
  const [text, setText] = useState(initialText);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const schemaQuery = useQuery({ queryKey: ["slr-artifact-a3-schema", projectId], queryFn: () => slrArtifactsService.getA3Schema(projectId), enabled: showSchema, retry: false });
  const validation = useMutation<SlrValidationReport, unknown, unknown>({ mutationFn: (graph) => slrArtifactsService.validateA3(projectId, graph, runId) });

  const check = () => {
    let graph: unknown;
    try {
      graph = JSON.parse(text);
    } catch (error) {
      setParseError(`The text is not valid JSON: ${(error as Error).message}`);
      return;
    }
    setParseError(null);
    validation.mutate(graph);
  };

  const report = validation.data;
  return <details className="rounded-xl border border-border bg-surface-white p-4">
    <summary className="cursor-pointer font-semibold text-text-primary">Validate an edited graph</summary>
    <div className="mt-3 space-y-3">
      <p className="text-sm text-text-secondary">Edit the JSON and check it against the corpus of this run. This is a check only: the stored artifact is not changed.</p>
      <textarea aria-label="A3 graph JSON" value={text} onChange={(event) => setText(event.target.value)} rows={12} spellCheck={false} className="block w-full rounded-lg border border-border bg-bg-secondary p-3 font-mono text-xs leading-5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={check} isLoading={validation.isPending}><ShieldCheck className="h-4 w-4" />Validate graph</Button>
        <Button size="sm" variant="outline" onClick={() => { setText(initialText); setParseError(null); validation.reset(); }}>Reset to stored graph</Button>
        <Button size="sm" variant="ghost" onClick={() => setShowSchema((current) => !current)}>{showSchema ? "Hide schema" : "Show schema"}</Button>
      </div>
      {parseError && <p role="alert" className="text-sm text-error">{parseError}</p>}
      {validation.error != null && <p role="alert" className="text-sm text-error">{getErrorMessage(validation.error, "Validation failed.")}</p>}
      {report && <div role="status" className="space-y-3 rounded-lg border border-border/70 p-3">
        <div className="flex flex-wrap items-center gap-2"><StatusPill>{report.status}</StatusPill><span className="text-sm text-text-secondary">{report.error_count} errors · {report.warning_count} warnings{report.needs_human_review ? " · needs human review" : ""}</span></div>
        <IssueList title="Schema checks" issues={report.layer_a.issues} />
        {report.layer_b.skipped ? <p className="text-sm text-text-muted">Semantic checks were skipped because the graph did not match the schema.</p> : <IssueList title="Semantic checks" issues={report.layer_b.issues} />}
        {report.error_count === 0 && report.warning_count === 0 && <p className="text-sm text-text-secondary">No validation messages.</p>}
      </div>}
      {showSchema && (schemaQuery.isLoading ? <p className="text-sm text-text-muted">Loading schema…</p> : schemaQuery.error != null ? <p role="alert" className="text-sm text-error">{getErrorMessage(schemaQuery.error, "The schema could not be loaded.")}</p> : <pre aria-label="A3 schema" className="max-h-80 overflow-auto rounded-lg bg-bg-secondary p-3 text-xs leading-5 text-text-secondary">{JSON.stringify(schemaQuery.data, null, 2)}</pre>)}
    </div>
  </details>;
}
