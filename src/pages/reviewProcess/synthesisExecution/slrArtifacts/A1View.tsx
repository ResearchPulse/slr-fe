import { asArray, asText, ids, isObject, StatusPill, Metric, Empty, type Data } from "../SlrArtifactsShared";

export function A1View({ data, corpus }: { data: Data; corpus: Data | null }) {
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
