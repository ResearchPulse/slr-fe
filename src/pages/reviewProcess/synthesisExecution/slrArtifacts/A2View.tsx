import { asArray, asText, isObject, Metric, type Data } from "../SlrArtifactsShared";

export function A2View({ data }: { data: Data }) {
  const distributions = isObject(data.distributions) ? data.distributions : {};
  const dimensions = asArray(data.dimensions).filter(isObject);
  const totalStudies = typeof data.study_count === "number" ? data.study_count : 0;

  return <section className="space-y-4" aria-label="Research landscape and taxonomy">
    <div className="grid gap-3 md:grid-cols-3">
      <Metric label="Included studies" value={totalStudies} />
      <Metric label="Taxonomy dimensions" value={dimensions.length} />
      <Metric label="Distribution groups" value={Object.keys(distributions).length} />
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      {Object.entries(distributions).map(([key, value]) => <article key={key} className="rounded-xl border border-border bg-surface-white p-4">
        <h3 className="font-semibold capitalize text-text-primary">{key.replaceAll("_", " ")}</h3>
        <ul className="mt-3 space-y-2">{asArray(value).filter(isObject).map((entry) => <li key={asText(entry.key, asText(entry.label))} className="flex items-center justify-between gap-3 rounded-lg bg-bg-secondary p-3 text-sm">
          <span className="text-text-primary">{asText(entry.label)}</span><span className="text-text-secondary">{typeof entry.study_count === "number" ? entry.study_count : 0} studies</span>
        </li>)}</ul>
      </article>)}
      {dimensions.map((dimension) => <article key={asText(dimension.dimension_id)} className="rounded-xl border border-border bg-surface-white p-4">
        <h3 className="font-semibold text-text-primary">{asText(dimension.name, "Taxonomy dimension")}</h3>
        <ul className="mt-3 flex flex-wrap gap-2">{asArray(dimension.categories).filter(isObject).map((category) => <li key={asText(category.category_id)} className="rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary">{asText(category.label)} · {typeof category.study_count === "number" ? category.study_count : 0}</li>)}</ul>
      </article>)}
    </div>
  </section>;
}
