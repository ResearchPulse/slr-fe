import { asArray, asText, isObject, StatusPill, Empty, type Data } from "../SlrArtifactsShared";
import ArtifactGraph, { type GraphEdge, type GraphNode } from "./ArtifactGraph";

const PREMISE_ROLES = new Set(["premise", "attacking_information", "preferred"]);
const CONCLUSION_ROLES = new Set(["conclusion", "attacked_information", "dispreferred"]);

/** Premises on the left, schemes in the middle and conclusions on the right, following the edge roles. */
export function toA3Graph(nodes: Data[], edges: Data[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const asPremise = new Set<string>();
  const asConclusion = new Set<string>();
  for (const edge of edges) {
    const role = asText(edge.role, "");
    if (PREMISE_ROLES.has(role)) asPremise.add(asText(edge.source, ""));
    if (CONCLUSION_ROLES.has(role)) asConclusion.add(asText(edge.target, ""));
  }
  return {
    nodes: nodes.map((node) => {
      const id = asText(node.node_id, "");
      if (node.type === "S") {
        const scheme = asText(node.scheme_type, "");
        return { id, label: `${scheme} · ${asText(node.label, id)}`, column: 1, tone: scheme === "CA" ? "warning" : "neutral" } as GraphNode;
      }
      const column = asConclusion.has(id) ? 2 : 0;
      return { id, label: asText(node.content, asText(node.label, id)), column, tone: column === 2 || node.content_kind === "claim" ? "primary" : "neutral" } as GraphNode;
    }),
    edges: edges.map((edge) => ({ id: asText(edge.edge_id, ""), source: asText(edge.source, ""), target: asText(edge.target, ""), label: asText(edge.role, "") })),
  };
}

export function A3View({ data }: { data: Data }) {
  const nodes = asArray(data.nodes).filter(isObject);
  const edges = asArray(data.edges).filter(isObject);
  const metadata = isObject(data.metadata) ? data.metadata : {};
  const validation = isObject(metadata.validation) ? metadata.validation : {};
  const issues = [...asArray(isObject(validation.layer_a) ? validation.layer_a.issues : null), ...asArray(isObject(validation.layer_b) ? validation.layer_b.issues : null)].filter(isObject);
  return <section className="space-y-4" aria-label="Scientific argument graph">
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-white p-4"><div className="flex-1"><p className="text-sm font-semibold text-text-primary">Graph validation</p><p className="mt-1 text-sm text-text-secondary">{issues.length ? `${issues.length} validation messages` : "No validation errors recorded"}</p></div><StatusPill>{asText(validation.status, "not validated")}</StatusPill><StatusPill>{nodes.length} nodes · {edges.length} edges</StatusPill></div>
    {issues.length > 0 && <div role="alert" className="rounded-xl border border-warning/40 bg-warning/5 p-4"><h3 className="font-semibold text-text-primary">Review validation messages</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">{issues.map((issue, i) => <li key={i}>{asText(issue.message, asText(issue.code))}{typeof issue.path === "string" ? ` (${issue.path})` : ""}</li>)}</ul></div>}
    <ArtifactGraph title="Argument graph" legend="Premises (left) support a scheme (middle), which leads to a conclusion (right). Counter-arguments and preferences sit in the middle column." {...toA3Graph(nodes, edges)} />
    <div className="grid gap-4 xl:grid-cols-2"><div className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Nodes</h3><div className="mt-3 space-y-2">{nodes.map((node) => <article key={asText(node.node_id)} className="rounded-lg border border-border/70 p-3"><div className="flex items-center justify-between gap-2"><StatusPill>{node.type === "S" ? `S · ${asText(node.scheme_type)}` : `I · ${asText(node.content_kind)}`}</StatusPill><code className="text-xs text-text-muted">{asText(node.node_id)}</code></div><p className="mt-2 text-sm leading-6 text-text-primary">{asText(node.content, asText(node.label))}</p>{node.type === "I" && <ProvenanceList items={asArray(node.provenance)} />}</article>)}</div>{nodes.length === 0 && <Empty title="No graph nodes" detail="This generated graph has no nodes." />}</div>
      <div className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Relationships</h3><div className="mt-3 space-y-2">{edges.map((edge) => <div key={asText(edge.edge_id)} className="rounded-lg border border-border/70 p-3"><div className="flex flex-wrap items-center gap-2 text-sm"><code>{asText(edge.source)}</code><span className="text-text-muted">→</span><StatusPill>{asText(edge.role)}</StatusPill><span className="text-text-muted">→</span><code>{asText(edge.target)}</code></div><p className="mt-1 text-xs text-text-muted">{asText(edge.edge_id)}</p></div>)}</div>{edges.length === 0 && <Empty title="No graph relationships" detail="The graph contains no argument edges." />}</div></div>
  </section>;
}

function ProvenanceList({ items }: { items: unknown[] }) {
  if (!items.length) return null;
  return <details className="mt-3 text-xs"><summary className="cursor-pointer text-text-secondary">Provenance ({items.length})</summary><ul className="mt-2 space-y-2">{items.filter(isObject).map((item, i) => { const location = isObject(item.source_location) ? item.source_location : {}; return <li key={i} className="rounded bg-bg-secondary p-2 text-text-secondary">{asText(item.source_type)} · study {asText(item.study_id)} · finding {asText(item.finding_id)}{location.page !== undefined && <span> · page {location.page == null ? "unknown" : String(location.page)}{typeof location.paragraph === "number" ? ` · paragraph ${location.paragraph + 1}` : ""}</span>}{typeof item.source_quote === "string" ? <blockquote className="mt-1 border-l-2 border-border pl-2">{item.source_quote}</blockquote> : null}</li>; })}</ul></details>;
}
