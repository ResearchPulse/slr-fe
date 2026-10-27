import { asArray, asText, isObject, Metric, StatusPill, type Data } from "../SlrArtifactsShared";
import ArtifactGraph, { type GraphEdge, type GraphNode } from "./ArtifactGraph";

const KIND_COLUMNS: Record<string, number> = { intervention: 0, mechanism: 1, moderator: 2, outcome: 3 };

export function toA6Graph(nodes: Data[], edges: Data[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: nodes.map((node) => {
      const kind = asText(node.kind, "");
      return { id: asText(node.node_id, ""), label: asText(node.label), column: KIND_COLUMNS[kind] ?? 1, tone: kind === "outcome" ? "primary" : kind === "moderator" ? "warning" : "neutral" } as GraphNode;
    }),
    edges: edges.map((edge) => ({ id: asText(edge.edge_id, ""), source: asText(edge.source, ""), target: asText(edge.target, ""), label: asText(edge.relation, "").replace(/_/g, " ") })),
  };
}

export function A6View({ data }: { data: Data }) {
  const graph = isObject(data.graph) ? data.graph : {};
  const nodes = asArray(graph.nodes).filter(isObject);
  const edges = asArray(graph.edges).filter(isObject);
  const mechanisms = asArray(data.mechanisms).filter(isObject);
  return <section className="space-y-4" aria-label="Mechanism and moderator map">
    <div className="grid gap-3 md:grid-cols-3"><Metric label="Mechanism map nodes" value={nodes.length} /><Metric label="Reported relationships" value={edges.length} /><Metric label="Mechanism summaries" value={mechanisms.length} /></div>
    <ArtifactGraph title="Mechanism map" legend="Left to right: interventions, mechanisms, moderators and outcomes that studies report together." {...toA6Graph(nodes, edges)} />
    <div className="grid gap-4 xl:grid-cols-2"><article className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Observed pathway nodes</h3><ul className="mt-3 space-y-2">{nodes.map((node) => <li key={asText(node.node_id)} className="flex items-center justify-between gap-3 rounded-lg bg-bg-secondary p-3"><span className="text-sm text-text-primary">{asText(node.label)}</span><StatusPill>{asText(node.kind)} · {asArray(node.study_ids).length} studies</StatusPill></li>)}</ul></article>
      <article className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Co-reported relationships</h3><ul className="mt-3 space-y-2">{edges.map((edge) => <li key={asText(edge.edge_id)} className="rounded-lg border border-border/70 p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><span>{asText(edge.source)}</span><span className="text-text-muted">→</span><StatusPill>{asText(edge.relation)}</StatusPill><span className="text-text-muted">→</span><span>{asText(edge.target)}</span></div><p className="mt-2 text-xs text-text-muted">Observed together in {asArray(edge.study_ids).length} studies</p></li>)}</ul></article></div>
  </section>;
}
