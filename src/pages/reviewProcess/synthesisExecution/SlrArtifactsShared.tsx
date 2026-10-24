import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import type { SlrArtifactType } from "../../../services/slrArtifactsService";

export type Data = Record<string, unknown>;

export const isObject = (value: unknown): value is Data => typeof value === "object" && value !== null && !Array.isArray(value);

export const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

export const asText = (value: unknown, fallback = "—") => typeof value === "string" && value.length ? value : fallback;

export const ids = (value: unknown) => asArray(value).map((entry) => typeof entry === "string" ? entry : "").filter(Boolean);

export function StatusPill({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full border border-border bg-bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-text-secondary">{children}</span>;
}

export function GenericArtifactView({ type, data, corpus }: { type: SlrArtifactType; data: Data; corpus?: Data | null }) {
  const sections = Object.entries(data).filter(([key]) => !["metadata", "artifact_id", "artifact_type", "schema_version", "title"].includes(key));
  const sourceEvidenceCount = type === "A1" && corpus ? asArray(corpus.evidence).length : null;
  return <section className="grid gap-3 md:grid-cols-2" aria-label={`${type} artifact details`}>
    {sourceEvidenceCount !== null && <Metric label="Source evidence records" value={sourceEvidenceCount} />}
    {sections.map(([key, value]) => <article key={key} className="rounded-xl border border-border bg-surface-white p-4"><h3 className="font-semibold capitalize text-text-primary">{key.replaceAll("_", " ")}</h3><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-bg-secondary p-3 text-xs leading-5 text-text-secondary">{JSON.stringify(value, null, 2)}</pre></article>)}
  </section>;
}

export function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-border bg-surface-white p-4"><p className="text-xs text-text-muted">{label}</p><p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p></div>;
}

export function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-xl border border-dashed border-border bg-surface-white px-5 py-10 text-center"><CircleHelp className="mx-auto h-6 w-6 text-text-muted" /><h3 className="mt-3 font-semibold text-text-primary">{title}</h3><p className="mx-auto mt-1 max-w-xl text-sm text-text-secondary">{detail}</p></div>;
}
