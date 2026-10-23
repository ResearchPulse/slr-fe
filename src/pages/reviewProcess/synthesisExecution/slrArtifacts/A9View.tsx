import { asArray, asText, isObject, StatusPill, type Data } from "../SlrArtifactsShared";

export function A9View({ data }: { data: Data }) {
  const items = asArray(data.items).filter(isObject).sort((left, right) => Number(left.rank ?? 0) - Number(right.rank ?? 0));
  return <section className="space-y-3" aria-label="Research agenda">
    {items.map((item) => {
      const gap = isObject(item.gap) ? item.gap : {};
      const question = isObject(item.proposed_question) ? item.proposed_question : {};
      const feasibility = isObject(item.feasibility) ? item.feasibility : {};
      return <article key={asText(item.agenda_item_id)} className="rounded-xl border border-border bg-surface-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-bg-secondary text-sm font-semibold text-text-primary">{String(item.rank ?? "—")}</span><StatusPill>{asText(item.priority)}</StatusPill><StatusPill>{asText(gap.gap_type).replaceAll("_", " ")}</StatusPill></div><span className="text-xs text-text-muted">{asArray(gap.source_refs).length} linked source references</span></div>
        <p className="mt-3 text-sm font-semibold leading-6 text-text-primary">{asText(question.text, asText(gap.description))}</p><p className="mt-2 text-sm leading-6 text-text-secondary">{asText(item.rationale)}</p><p className="mt-3 text-xs text-text-muted">Priority rule: {asText(item.priority_rationale)} · Feasibility: {feasibility.rating == null ? "not rated" : String(feasibility.rating)}</p></article>;
    })}
  </section>;
}
