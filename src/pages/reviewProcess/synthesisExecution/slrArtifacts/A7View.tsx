import { asArray, asText, isObject, Metric, StatusPill, type Data } from "../SlrArtifactsShared";

export function A7View({ data }: { data: Data }) {
  const entries = asArray(data.entries).filter(isObject);
  const summary = isObject(data.summary) ? data.summary : {};
  return <section className="space-y-4" aria-label="Contradiction and uncertainty register">
    <div className="grid gap-3 md:grid-cols-2"><Metric label="Candidate contradictions" value={Number(summary.contradictions ?? 0)} /><Metric label="Uncertainty entries" value={Number(summary.uncertainties ?? 0)} /></div>
    <ul className="space-y-3">{entries.map((entry) => <li key={asText(entry.entry_id)} className="rounded-xl border border-border bg-surface-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><StatusPill>{asText(entry.register_type)}</StatusPill><StatusPill>{asText(entry.category).replaceAll("_", " ")}</StatusPill></div><StatusPill>{asText(entry.status)}</StatusPill></div><h3 className="mt-3 font-semibold text-text-primary">{asText(entry.description, "Uncertainty requires researcher review")}</h3>
      <div className="mt-3 grid gap-2 md:grid-cols-2">{asArray(entry.positions).filter(isObject).map((position, index) => <div key={`${asText(position.study_id, "unattributed")}-${index}`} className="rounded-lg bg-bg-secondary p-3"><p className="text-xs text-text-muted">{asText(position.study_id, "No study attribution")}</p><p className="mt-1 text-sm text-text-primary">{asText(position.value)}</p></div>)}</div>
      {asArray(entry.possible_explanations).length > 0 && <p className="mt-3 text-sm text-text-secondary">Possible explanations: {asArray(entry.possible_explanations).map(String).join(" ")}</p>}</li>)}</ul>
  </section>;
}
