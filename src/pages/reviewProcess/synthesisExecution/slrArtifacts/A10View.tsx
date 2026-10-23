import { asArray, asText, isObject, Metric, StatusPill, type Data } from "../SlrArtifactsShared";

export function A10View({ data }: { data: Data }) {
  const manifest = asArray(data.artifact_manifest).filter(isObject);
  const decisions = asArray(data.decision_log).filter(isObject);
  const protocol = isObject(data.protocol) ? data.protocol : {};
  const hashes = isObject(data.hashes) ? Object.entries(data.hashes) : [];
  return <section className="space-y-4" aria-label="Traceability and reproducibility package">
    <div className="grid gap-3 md:grid-cols-3"><Metric label="Manifest artifacts" value={manifest.length} /><Metric label="Decision log entries" value={decisions.length} /><Metric label="Recorded hashes" value={hashes.length} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><article className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Protocol snapshot</h3><p className="mt-2 text-sm text-text-secondary">{asArray(protocol.research_questions).length} research questions · {asArray(protocol.inclusion_criteria).length} inclusion criteria · {asArray(protocol.exclusion_criteria).length} exclusion criteria</p></article>
      <article className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Artifact manifest</h3><ul className="mt-3 space-y-2">{manifest.map((entry) => <li key={asText(entry.artifact_type)} className="flex items-center justify-between gap-3 rounded-lg bg-bg-secondary p-3"><span className="font-medium text-text-primary">{asText(entry.artifact_type)}</span><StatusPill>{asText(entry.validation_status, "not validated")}</StatusPill><code className="max-w-48 truncate text-xs text-text-muted">{asText(entry.content_hash)}</code></li>)}</ul></article></div>
    <article className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold text-text-primary">Decision log</h3><ol className="mt-3 space-y-2">{decisions.map((entry, index) => <li key={`${asText(entry.ref)}-${index}`} className="rounded-lg border border-border/70 p-3"><div className="flex flex-wrap justify-between gap-2"><StatusPill>{asText(entry.kind)}</StatusPill><time className="text-xs text-text-muted">{asText(entry.at, "Time not recorded")}</time></div><p className="mt-2 text-sm text-text-primary">{asText(entry.detail)}</p><p className="mt-1 text-xs text-text-muted">{asText(entry.actor_id, "Actor not recorded")} · {asText(entry.ref)}</p></li>)}</ol></article>
  </section>;
}
