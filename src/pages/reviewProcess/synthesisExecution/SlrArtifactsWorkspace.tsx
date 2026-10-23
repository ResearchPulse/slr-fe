import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, CircleHelp, FileSearch, RefreshCw } from "lucide-react";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import QueryErrorState from "../../../components/ui/QueryErrorState";
import { useProjectMember } from "../../../hooks/useProjectMember";
import { slrArtifactsService, SLR_ARTIFACT_TYPES, type SlrArtifactType } from "../../../services/slrArtifactsService";

type Data = Record<string, unknown>;
const isObject = (value: unknown): value is Data => typeof value === "object" && value !== null && !Array.isArray(value);
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const asText = (value: unknown, fallback = "—") => typeof value === "string" && value.length ? value : fallback;
const ids = (value: unknown) => asArray(value).map((entry) => typeof entry === "string" ? entry : "").filter(Boolean);
const dateText = (value: unknown) => typeof value === "string" ? new Date(value).toLocaleString() : "—";

function StatusPill({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full border border-border bg-bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-text-secondary">{children}</span>;
}

function A1View({ data, corpus }: { data: Data; corpus: Data | null }) {
  const rows = asArray(data.rows).filter(isObject);
  const evidenceById = new Map(asArray(corpus?.evidence).filter(isObject).map((evidence) => [String(evidence.evidence_id), evidence]));
  return <section className="space-y-4" aria-label="Knowledge synthesis matrix">
    <div className="grid gap-3 md:grid-cols-3">
      <Metric label="Synthesis groups" value={rows.length} />
      <Metric label="Unsynthesized findings" value={asArray(data.unsynthesized_findings).length} />
      <Metric label="Resolved citations" value={rows.reduce((sum, row) => sum + asArray(row.supporting_findings).length, 0)} />
    </div>
    {rows.length === 0 ? <Empty title="No synthesis groups" detail="The generated corpus contains no researcher-defined synthesis themes yet." /> :
      <div className="space-y-4">{rows.map((row, index) => {
        const group = isObject(row.synthesis_group) ? row.synthesis_group : {};
        const finding = isObject(row.synthesized_finding) ? row.synthesized_finding : {};
        const citations = asArray(row.citations).filter(isObject);
        const support = asArray(row.supporting_findings).filter(isObject);
        const notReported = asArray(row.not_reported_items).filter(isObject);
        const unresolved = asArray(row.unresolved_items).filter(isObject);
        return <article key={asText(row.row_id, String(index))} className="rounded-xl border border-border bg-surface-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Synthesis group</p><h3 className="mt-1 text-lg font-semibold text-text-primary">{asText(group.title, "Untitled theme")}</h3>
              {typeof group.research_question_id === "string" && <p className="mt-1 text-xs text-text-muted">Research question: {group.research_question_id}</p>}</div>
            <StatusPill>{support.length} resolved · {notReported.length} not reported · {unresolved.length} unresolved</StatusPill>
          </div>
          <p className="mt-4 rounded-lg bg-bg-secondary p-3 text-sm leading-6 text-text-primary">{asText(finding.text, "No synthesized finding supplied")}</p>
          {citations.length > 0 && <div className="mt-3"><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Cited studies</p><ul className="mt-2 flex flex-wrap gap-2">{citations.map((citation) => { const authors = asArray(citation.authors).filter((author): author is string => typeof author === "string"); return <li key={asText(citation.study_id)} className="rounded-lg border border-border/70 px-3 py-2 text-xs text-text-secondary"><span className="font-semibold text-text-primary">{asText(citation.title)}</span><span className="ml-2">{authors.slice(0, 2).join(", ")}{authors.length > 2 ? " et al." : ""}{typeof citation.year === "number" ? ` · ${citation.year}` : ""}</span>{typeof citation.doi === "string" && citation.doi && <span className="ml-2 text-text-muted">DOI: {citation.doi}</span>}</li>; })}</ul></div>}
          <div className="mt-4 space-y-2">{support.map((item) => {
            const cited = isObject(item.cited_finding) ? item.cited_finding : {};
            return <div key={asText(item.item_id)} className="rounded-lg border border-border/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-text-primary">{asText(cited.field_name, "Source finding")}</strong><StatusPill>resolved · {asText(item.value_drift, "unknown drift")}</StatusPill></div>
              <p className="mt-1 text-sm leading-6 text-text-secondary">{asText(cited.text)}</p>
              <p className="mt-2 text-xs text-text-muted">Study {asText(cited.study_id)} · Finding {asText(cited.finding_id)} · Evidence {asText(item.item_id)}</p>
              {ids(cited.evidence_ids).map((evidenceId) => {
                const source = evidenceById.get(evidenceId);
                const location = source && isObject(source.source_location) ? source.source_location : {};
                if (!source) return null;
                return <details key={evidenceId} className="mt-2 rounded-md bg-bg-secondary p-2 text-xs"><summary className="cursor-pointer font-medium text-text-secondary">Source quote · {asText(source.document_id)} · page {location.page == null ? "unknown" : String(location.page)}{typeof location.paragraph === "number" ? ` · paragraph ${location.paragraph + 1}` : ""}</summary><blockquote className="mt-2 border-l-2 border-border pl-3 leading-5 text-text-secondary">{asText(source.quote, "No verbatim quote stored")}</blockquote>{typeof location.section === "string" && <p className="mt-1 text-text-muted">Section: {location.section}</p>}</details>;
              })}
              {typeof item.notes === "string" && item.notes && <p className="mt-1 text-xs text-text-secondary">Researcher note: {item.notes}</p>}
            </div>;
          })}</div>
          {(notReported.length > 0 || unresolved.length > 0) && <details className="mt-4 rounded-lg border border-border/70 p-3">
            <summary className="cursor-pointer text-sm font-medium text-text-secondary">Items not counted as supporting evidence</summary>
            <ul className="mt-3 space-y-2 text-xs text-text-secondary">
              {notReported.map((item) => <li key={asText(item.item_id)}><StatusPill>not reported</StatusPill> Study {asText(item.study_id)} · evidence {asText(item.item_id)}</li>)}
              {unresolved.map((item) => <li key={asText(item.item_id)}><StatusPill>unresolved · {asText(item.unresolved_reason)}</StatusPill> Study {asText(item.study_id)} · evidence {asText(item.item_id)}</li>)}
            </ul>
          </details>}
        </article>;
      })}</div>}
  </section>;
}

function A3View({ data }: { data: Data }) {
  const nodes = asArray(data.nodes).filter(isObject);
  const edges = asArray(data.edges).filter(isObject);
  const metadata = isObject(data.metadata) ? data.metadata : {};
  const validation = isObject(metadata.validation) ? metadata.validation : {};
  const issues = [...asArray(isObject(validation.layer_a) ? validation.layer_a.issues : null), ...asArray(isObject(validation.layer_b) ? validation.layer_b.issues : null)].filter(isObject);
  return <section className="space-y-4" aria-label="Scientific argument graph">
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-white p-4"><div className="flex-1"><p className="text-sm font-semibold text-text-primary">Graph validation</p><p className="mt-1 text-sm text-text-secondary">{issues.length ? `${issues.length} validation messages` : "No validation errors recorded"}</p></div><StatusPill>{asText(validation.status, "not validated")}</StatusPill><StatusPill>{nodes.length} nodes · {edges.length} edges</StatusPill></div>
    {issues.length > 0 && <div role="alert" className="rounded-xl border border-warning/40 bg-warning/5 p-4"><h3 className="font-semibold text-text-primary">Review validation messages</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">{issues.map((issue, i) => <li key={i}>{asText(issue.message, asText(issue.code))}{typeof issue.path === "string" ? ` (${issue.path})` : ""}</li>)}</ul></div>}
    <div className="grid gap-4 xl:grid-cols-2"><div className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Nodes</h3><div className="mt-3 space-y-2">{nodes.map((node) => <article key={asText(node.node_id)} className="rounded-lg border border-border/70 p-3"><div className="flex items-center justify-between gap-2"><StatusPill>{node.type === "S" ? `S · ${asText(node.scheme_type)}` : `I · ${asText(node.content_kind)}`}</StatusPill><code className="text-xs text-text-muted">{asText(node.node_id)}</code></div><p className="mt-2 text-sm leading-6 text-text-primary">{asText(node.content, asText(node.label))}</p>{node.type === "I" && <ProvenanceList items={asArray(node.provenance)} />}</article>)}</div>{nodes.length === 0 && <Empty title="No graph nodes" detail="This generated graph has no nodes." />}</div>
      <div className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Relationships</h3><div className="mt-3 space-y-2">{edges.map((edge) => <div key={asText(edge.edge_id)} className="rounded-lg border border-border/70 p-3"><div className="flex flex-wrap items-center gap-2 text-sm"><code>{asText(edge.source)}</code><span className="text-text-muted">→</span><StatusPill>{asText(edge.role)}</StatusPill><span className="text-text-muted">→</span><code>{asText(edge.target)}</code></div><p className="mt-1 text-xs text-text-muted">{asText(edge.edge_id)}</p></div>)}</div>{edges.length === 0 && <Empty title="No graph relationships" detail="The graph contains no argument edges." />}</div></div>
  </section>;
}

function ProvenanceList({ items }: { items: unknown[] }) {
  if (!items.length) return null;
  return <details className="mt-3 text-xs"><summary className="cursor-pointer text-text-secondary">Provenance ({items.length})</summary><ul className="mt-2 space-y-2">{items.filter(isObject).map((item, i) => { const location = isObject(item.source_location) ? item.source_location : {}; return <li key={i} className="rounded bg-bg-secondary p-2 text-text-secondary">{asText(item.source_type)} · study {asText(item.study_id)} · finding {asText(item.finding_id)}{location.page !== undefined && <span> · page {location.page == null ? "unknown" : String(location.page)}{typeof location.paragraph === "number" ? ` · paragraph ${location.paragraph + 1}` : ""}</span>}{typeof item.source_quote === "string" ? <blockquote className="mt-1 border-l-2 border-border pl-2">{item.source_quote}</blockquote> : null}</li>; })}</ul></details>;
}

function A8View({ data }: { data: Data }) {
  const rows = isObject(data.rows) ? data.rows : null;
  const columns = isObject(data.columns) ? data.columns : null;
  const rowCategories = asArray(rows?.categories).filter(isObject);
  const columnCategories = asArray(columns?.categories).filter(isObject);
  const cells = asArray(data.cells).filter(isObject);
  const byPair = new Map(cells.map((cell) => [`${String(cell.row_category_id)}|${String(cell.column_category_id)}`, cell]));
  return <section className="space-y-4" aria-label="Evidence gap map">
    <div className="grid gap-3 md:grid-cols-3"><Metric label="Empty cells" value={isObject(data.summary) ? Number(data.summary.empty ?? 0) : 0} /><Metric label="Sparse cells" value={isObject(data.summary) ? Number(data.summary.sparse ?? 0) : 0} /><Metric label="Covered cells" value={isObject(data.summary) ? Number(data.summary.covered ?? 0) : 0} /></div>
    {!rows || !columns ? <Empty title="Dimensions are not configured" detail="Generate the gap map with row and column dimensions selected to see coverage." /> : rowCategories.length === 0 || columnCategories.length === 0 ? <Empty title="No categories to map" detail="The corpus did not provide categories for the selected dimensions." /> :
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-white p-4"><table className="min-w-full border-separate border-spacing-1 text-left text-sm"><caption className="mb-3 text-left text-sm text-text-secondary">Rows: {asText(isObject(rows.dimension) ? rows.dimension.name : null)} · Columns: {asText(isObject(columns.dimension) ? columns.dimension.name : null)}</caption><thead><tr><th className="p-2 text-xs text-text-muted">Evidence dimension ↓</th>{columnCategories.map((category) => <th key={asText(category.category_id)} className="max-w-44 p-2 text-xs font-semibold text-text-secondary">{asText(category.label)}</th>)}</tr></thead><tbody>{rowCategories.map((row) => <tr key={asText(row.category_id)}><th className="min-w-36 p-2 text-xs font-semibold text-text-secondary">{asText(row.label)}</th>{columnCategories.map((column) => { const cell = byPair.get(`${String(row.category_id)}|${String(column.category_id)}`); const count = cell && typeof cell.study_count === "number" ? cell.study_count : 0; const status = asText(cell?.status, "empty"); return <td key={asText(column.category_id)} title={`${status}: ${count} studies${cell ? ` (${ids(cell.study_ids).join(", ")})` : ""}`} className={`min-w-28 rounded-lg border p-2 text-center ${status === "covered" ? "border-success/25 bg-success/5" : status === "sparse" ? "border-warning/30 bg-warning/5" : "border-border bg-bg-secondary"}`}><span className="block text-base font-semibold text-text-primary">{count}</span><span className="text-[10px] capitalize text-text-muted">{status}</span>{cell && isObject(cell.quality) && <span className="block text-[10px] text-text-muted">High {String(cell.quality.high ?? 0)} · Low {String(cell.quality.low ?? 0)}</span>}</td>; })}</tr>)}</tbody></table><p className="mt-3 text-xs text-text-muted">Hover or focus a cell to see the supporting study IDs. Sparse threshold: {String(data.sparse_threshold ?? 1)}.</p></div>}
  </section>;
}

function GenericArtifactView({ type, data }: { type: SlrArtifactType; data: Data }) {
  const sections = Object.entries(data).filter(([key]) => !["metadata", "artifact_id", "artifact_type", "schema_version", "title"].includes(key));
  return <section className="grid gap-3 md:grid-cols-2" aria-label={`${type} artifact details`}>
    {sections.map(([key, value]) => <article key={key} className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold capitalize text-text-primary">{key.replaceAll("_", " ")}</h3><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-bg-secondary p-3 text-xs leading-5 text-text-secondary">{JSON.stringify(value, null, 2)}</pre></article>)}
  </section>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-border bg-surface-white p-4"><p className="text-xs text-text-muted">{label}</p><p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p></div>;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-xl border border-dashed border-border bg-surface-white px-5 py-10 text-center"><CircleHelp className="mx-auto h-6 w-6 text-text-muted" /><h3 className="mt-3 font-semibold text-text-primary">{title}</h3><p className="mx-auto mt-1 max-w-xl text-sm text-text-secondary">{detail}</p></div>;
}

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
      {artifactType === "A1" ? <A1View data={artifact} corpus={corpus} /> : artifactType === "A3" ? <A3View data={artifact} /> : artifactType === "A8" ? <A8View data={artifact} /> : <GenericArtifactView type={artifactType} data={artifact} />}
      {artifactType === "A1" && corpusQuery.error && <p role="alert" className="text-sm text-warning">Source quotes could not be loaded: {corpusQuery.error instanceof Error ? corpusQuery.error.message : "corpus unavailable"}</p>}
    </> : <Empty title="Artifact is empty" detail="The selected artifact has no stored payload." />}
  </div>;
}
