import { asArray, asText, isObject, Metric, StatusPill, type Data } from "../SlrArtifactsShared";

export function A5View({ data }: { data: Data }) {
  const groups = asArray(data.groups).filter(isObject);
  const ungrouped = asArray(data.ungrouped_study_ids);
  return <section className="space-y-4" aria-label="Context conditions and outcomes">
    <div className="grid gap-3 md:grid-cols-3"><Metric label="Context groups" value={groups.length} /><Metric label="Grouped studies" value={groups.reduce((sum, group) => sum + asArray(group.study_ids).length, 0)} /><Metric label="Ungrouped studies" value={ungrouped.length} /></div>
    <div className="grid gap-4 xl:grid-cols-2">{groups.map((group) => {
      const boundary = isObject(group.boundary_conditions) ? group.boundary_conditions : {};
      const rows = asArray(group.rows).filter(isObject);
      return <article key={asText(group.group_id)} className="rounded-xl border border-border bg-surface-white p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold text-text-primary">{asText(group.label, "Unlabeled group")}</h3><p className="mt-1 text-xs text-text-muted">Grouped by {asText(data.group_by, "context")}</p></div><StatusPill>{asArray(group.study_ids).length} studies</StatusPill></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{[["Populations", boundary.observed_populations], ["Contexts", boundary.observed_contexts], ["Interventions", boundary.observed_interventions]].map(([label, values]) => <div key={String(label)} className="rounded-lg bg-bg-secondary p-3"><p className="text-xs font-semibold text-text-secondary">{String(label)}</p><p className="mt-1 text-sm text-text-primary">{asArray(values).map(String).join(" · ") || "No reported values"}</p></div>)}</div>
        <p className="mt-3 text-xs text-text-muted">{rows.length} study-level rows; outcomes and findings remain linked to source records.</p></article>;
    })}</div>
  </section>;
}
