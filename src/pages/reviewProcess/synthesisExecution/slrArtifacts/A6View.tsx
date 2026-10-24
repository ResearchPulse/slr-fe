import { asArray, asText, isObject, Metric, StatusPill, type Data } from "../SlrArtifactsShared";

export function A6View({ data }: { data: Data }) {
  const graph = isObject(data.graph) ? data.graph : {};
  const nodes = asArray(graph.nodes).filter(isObject);
  const edges = asArray(graph.edges).filter(isObject);
  const mechanisms = asArray(data.mechanisms).filter(isObject);
  return <section className="space-y-4" aria-label="Mechanism and moderator map">
    <div className="grid gap-3 md:grid-cols-3"><Metric label="Mechanism map nodes" value={nodes.length} /><Metric label="Reported relationships" value={edges.length} /><Metric label="Mechanism summaries" value={mechanisms.length} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><article className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Observed pathway nodes</h3><ul className="mt-3 space-y-2">{nodes.map((node) => <li key={asText(node.node_id)} className="flex items-center justify-between gap-3 rounded-lg bg-bg-secondary p-3"><span className="text-sm text-text-primary">{asText(node.label)}</span><StatusPill>{asText(node.kind)} · {asArray(node.study_ids).length} studies</StatusPill></li>)}</ul></article>
      <article className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Co-reported relationships</h3><ul className="mt-3 space-y-2">{edges.map((edge) => <li key={asText(edge.edge_id)} className="rounded-lg border border-border/70 p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><span>{asText(edge.source)}</span><span className="text-text-muted">→</span><StatusPill>{asText(edge.relation)}</StatusPill><span className="text-text-muted">→</span><span>{asText(edge.target)}</span></div><p className="mt-2 text-xs text-text-muted">Observed together in {asArray(edge.study_ids).length} studies</p></li>)}</ul></article></div>
  </section>;
}
