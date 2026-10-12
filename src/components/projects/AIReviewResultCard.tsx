import { useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiClipboard,
  FiCopy,
  FiInfo,
} from "react-icons/fi";
import { toastError, toastSuccess } from "../../utils/toast";

export type AIReviewResult = {
  decision: string;
  reasoning: string;
  data?: Record<string, unknown>;
};

export type AIReviewTask = {
  id: string;
  agentId: string;
  agentName?: string;
  stage?: "TITLE_ABSTRACT" | "FULL_TEXT";
  status: string;
  result?: AIReviewResult;
  error?: { code?: string; message?: string };
};

type Criterion = {
  id: string;
  name: string;
  status?: string;
  detail?: string;
  evidence: unknown[];
  raw: unknown;
};

const recordOf = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const textOf = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
};
const firstText = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = textOf(record[key]);
    if (value) return value;
  }
  return undefined;
};

const normalizeDecision = (value: string) => {
  const normalized = value.trim().toUpperCase();
  if (["INCLUDE", "INCLUDED"].includes(normalized)) return "INCLUDE";
  if (["EXCLUDE", "EXCLUDED"].includes(normalized)) return "EXCLUDE";
  return normalized;
};

const criteriaFrom = (data?: Record<string, unknown>): Criterion[] => {
  if (!data) return [];
  const source = recordOf(data.assessment) || data;
  const collection = ["criterionAssessments", "criteriaAssessments", "criteria", "assessments"]
    .map((key) => source[key])
    .find((value) => Array.isArray(value) || recordOf(value));
  if (!collection) return [];

  const entries: Array<[string, unknown]> = Array.isArray(collection)
    ? collection.map((value, index) => [String(index + 1), value])
    : Object.entries(collection as Record<string, unknown>);

  return entries.flatMap(([key, value]) => {
    const criterion = recordOf(value);
    if (!criterion) return [];
    const name = firstText(criterion, ["criterionName", "name", "title", "criterion", "description"]);
    const id = firstText(criterion, ["criterionId", "id", "code", "key"]) || key;
    const status = firstText(criterion, ["assessment", "status", "result", "decision", "met"]);
    const detail = firstText(criterion, ["reasoning", "rationale", "justification", "analysis", "explanation"]);
    const evidenceValue = criterion.evidence ?? criterion.supportingEvidence ?? criterion.evidences;
    const evidence = Array.isArray(evidenceValue) ? evidenceValue : evidenceValue == null ? [] : [evidenceValue];
    return [{ id, name: name && name !== id ? name : "", status, detail, evidence, raw: value }];
  });
};

const statusStyle = (value?: string) => {
  const normalized = (value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (["MET", "PASS", "PASSED", "SATISFIED", "INCLUDE", "INCLUDED", "TRUE"].includes(normalized)) {
    return { label: "MET", className: "border-emerald-200 bg-emerald-50 text-emerald-700", Icon: FiCheck };
  }
  if (["NOT_MET", "NOTMET", "FAIL", "FAILED", "UNMET", "EXCLUDE", "EXCLUDED", "FALSE"].includes(normalized)) {
    return { label: "NOT MET", className: "border-rose-200 bg-rose-50 text-rose-700", Icon: FiAlertCircle };
  }
  if (["INSUFFICIENT_EVIDENCE", "NO_EVIDENCE", "MISSING_EVIDENCE"].includes(normalized)) {
    return { label: "INSUFFICIENT EVIDENCE", className: "border-amber-200 bg-amber-50 text-amber-800", Icon: FiInfo };
  }
  if (["UNCLEAR", "UNCERTAIN", "UNKNOWN", "PARTIAL", "INCONCLUSIVE"].includes(normalized)) {
    return { label: "UNCLEAR", className: "border-amber-200 bg-amber-50 text-amber-800", Icon: FiInfo };
  }
  return { label: value || "DETAILS", className: "border-slate-200 bg-slate-50 text-slate-600", Icon: FiInfo };
};

const recommendationStyle = (decision: string) => {
  const normalized = decision.trim().toUpperCase();
  if (["INCLUDE", "INCLUDED"].includes(normalized)) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (["EXCLUDE", "EXCLUDED"].includes(normalized)) return "border-rose-200 bg-rose-50 text-rose-800";
  if (["UNCERTAIN", "UNCLEAR", "MAYBE"].includes(normalized)) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

const isPriorityCriterion = (criterion: Criterion) => {
  const value = `${criterion.status || ""} ${criterion.detail || ""}`.toUpperCase().replace(/[\s-]+/g, "_");
  return value.includes("NOT_MET") || value.includes("INSUFFICIENT_EVIDENCE") || value.includes("NO_EVIDENCE");
};

function EvidenceBlock({ value }: { value: unknown }) {
  const evidence = recordOf(value);
  const quote = evidence
    ? firstText(evidence, ["quote", "quotation", "excerpt", "text", "content", "evidence"])
    : textOf(value);
  const location = evidence && firstText(evidence, ["location", "source", "section", "page", "pageNumber"]);
  const label = evidence && firstText(evidence, ["pageLabel", "sectionTitle"]);
  const text = quote || (evidence ? firstText(evidence, ["reasoning", "description"]) : undefined);

  return (
    <blockquote className="min-w-0 border-l-2 border-sky-200 pl-3 text-xs leading-5 text-text-secondary">
      {text ? <p className="break-words">{text}</p> : <p>Evidence details were provided without a readable quotation.</p>}
      {(location || label) && <footer className="mt-1 text-[10px] text-text-tertiary">{[label, location].filter(Boolean).join(" · ")}</footer>}
    </blockquote>
  );
}

function JsonPreview({ value }: { value: string }) {
  const tokens = value.split(/("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g);
  return <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 font-mono text-[10px] leading-4 text-slate-200">{tokens.map((token, index) => {
    let color = "";
    if (/^"(?:\\.|[^"\\])*"\s*:$/.test(token)) color = "text-sky-300";
    else if (/^"/.test(token)) color = "text-emerald-300";
    else if (/^(true|false|null)$/.test(token)) color = "text-amber-300";
    else if (/^-?\d/.test(token)) color = "text-violet-300";
    return color ? <span key={index} className={color}>{token}</span> : token;
  })}</pre>;
}

function CriterionRow({ criterion }: { criterion: Criterion }) {
  const [open, setOpen] = useState(false);
  const badge = statusStyle(criterion.status);
  const StatusIcon = badge.Icon;
  return (
    <div className={`overflow-hidden rounded-lg border ${isPriorityCriterion(criterion) ? "border-amber-200 bg-amber-50/30" : "border-border bg-white"}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex min-h-11 w-full min-w-0 items-center gap-2 px-3 py-2 text-left hover:bg-bg-secondary/60">
        {open ? <FiChevronDown className="h-3.5 w-3.5 shrink-0 text-text-tertiary" /> : <FiChevronRight className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />}
        <span className="shrink-0 text-[11px] font-semibold text-text-primary">{criterion.id}</span>
        {criterion.name && <span className="min-w-0 flex-1 truncate text-xs text-text-secondary" title={criterion.name}>{criterion.name}</span>}
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${badge.className}`}><StatusIcon className="h-3 w-3" />{badge.label}</span>
      </button>
      {open && <div className="space-y-3 border-t border-border px-3 py-3">
        {criterion.detail && <p className="whitespace-pre-wrap break-words text-xs leading-5 text-text-secondary">{criterion.detail}</p>}
        {criterion.evidence.length > 0
          ? <div className="space-y-2">{criterion.evidence.map((item, index) => <EvidenceBlock key={index} value={item} />)}</div>
          : <p className="text-[11px] text-text-tertiary">No supporting evidence was included for this criterion.</p>}
      </div>}
    </div>
  );
}

function inputNotice(task: AIReviewTask, paperInput?: { hasPdf: boolean; extractionStatus?: string | null; extractionMessage?: string | null }) {
  const code = task.error?.code?.toUpperCase() || "";
  const availability = textOf(task.result?.data?.fullTextStatus)?.toUpperCase();
  if (code === "FULLTEXT_STAGE_REQUIRED" || code === "409_FULLTEXT_STAGE_REQUIRED") {
    return { message: "Full text is unavailable for this screening stage.", technical: task.error?.message || task.error?.code, tone: "info" };
  }
  if (task.stage === "FULL_TEXT" && paperInput && !paperInput.hasPdf) {
    return { message: "A PDF has not been added to this paper.", technical: undefined, tone: "info" };
  }
  const extractionStatus = paperInput?.extractionStatus?.toUpperCase();
  if (task.stage === "FULL_TEXT" && ["PENDING", "PROCESSING"].includes(extractionStatus || "")) {
    return { message: "Full-text extraction is still processing; the agent may not have the full text yet.", technical: paperInput?.extractionMessage || undefined, tone: "info" };
  }
  if (task.stage === "FULL_TEXT" && extractionStatus === "FAILED") {
    return { message: "Full-text extraction failed; the agent may not have the full text.", technical: paperInput?.extractionMessage || undefined, tone: "warning" };
  }
  if (task.stage === "FULL_TEXT" && extractionStatus === "NOT_REQUESTED") {
    return { message: "Full-text extraction has not started yet.", technical: undefined, tone: "info" };
  }
  if (task.stage === "FULL_TEXT" && extractionStatus === "PARTIAL") {
    return { message: "Only partial full-text content was extracted.", technical: paperInput?.extractionMessage || undefined, tone: "info" };
  }
  if (availability === "PENDING" || availability === "PROCESSING") return { message: "Full text extraction is still processing.", technical: task.error?.message, tone: "info" };
  if (availability === "FAILED" || availability === "UNAVAILABLE") return { message: "Full text could not be used for this review.", technical: task.error?.message || availability, tone: "warning" };
  if (task.error?.message) return { message: "The agent reported a problem with this review task.", technical: task.error.message, tone: "warning" };
  return null;
}

export default function AIReviewResultCard({
  task,
  humanDecision,
  paperInput,
}: {
  task: AIReviewTask;
  humanDecision?: string;
  paperInput?: { hasPdf: boolean; extractionStatus?: string | null; extractionMessage?: string | null };
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);
  const result = task.result;
  const data = result?.data;
  const criteria = criteriaFrom(data).sort((a, b) => Number(isPriorityCriterion(b)) - Number(isPriorityCriterion(a)));
  const summary = data && firstText(data, ["keyFinding", "summary", "conclusion"]);
  const finding = summary || result?.reasoning || "The agent has not provided a finding.";
  const notice = inputNotice(task, paperInput);
  const rawResponse = result ? JSON.stringify(result, null, 2) : JSON.stringify({ status: task.status, error: task.error }, null, 2);
  const stageLabel = task.stage === "FULL_TEXT" ? "Full text" : task.stage === "TITLE_ABSTRACT" ? "Title / abstract" : "Screening";
  const stateLabel = task.status === "COMPLETED" ? "Completed" : task.status === "ASSIGNED" ? "Waiting for agent" : task.status;
  const hasLongReasoning = Boolean(result?.reasoning && (summary ? result.reasoning !== summary : result.reasoning.length > 180 || result.reasoning.split("\n").length > 3));
  const normalizedDecision = result?.decision?.trim().toUpperCase();
  const decisionAgrees = Boolean(humanDecision && normalizedDecision && normalizeDecision(normalizedDecision) === normalizeDecision(humanDecision));
  const showFullFinding = !summary && showReasoning;
  const showSeparateReasoning = Boolean(summary && result?.reasoning && result.reasoning !== summary && showReasoning);

  const copyRaw = async () => {
    try {
      await navigator.clipboard.writeText(rawResponse);
      setCopied(true);
      toastSuccess("Response copied");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toastError("Could not copy response", "Select and copy the JSON manually.");
    }
  };

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-border bg-white">
      <header className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border px-3 py-2.5">
        <span className="max-w-full truncate text-xs font-semibold text-text-primary">{task.agentName || "AI Agent"}</span>
        <span className="text-[10px] text-text-tertiary">·</span>
        <span className="text-[10px] text-text-secondary">{stageLabel}</span>
        {result?.decision && <span className={`ml-auto rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${recommendationStyle(result.decision)}`}>{result.decision}</span>}
        <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${task.status === "COMPLETED" ? "bg-slate-100 text-slate-600" : "bg-sky-50 text-sky-700"}`}>{stateLabel}</span>
      </header>

      <div className="space-y-3 p-3">
        {notice && <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${notice.tone === "info" ? "bg-sky-50 text-sky-800" : "bg-amber-50 text-amber-900"}`}>
          <FiInfo className="mt-0.5 h-3.5 w-3.5 shrink-0" /><p className="min-w-0 break-words">{notice.message}</p>
        </div>}

        {result ? <>
          <section aria-label="Key finding">
            <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Key finding</h4>
            <p className={`${showFullFinding ? "whitespace-pre-wrap" : "line-clamp-3"} break-words text-xs leading-5 text-text-secondary`}>{finding}</p>
            {hasLongReasoning && <button type="button" aria-expanded={showReasoning} onClick={() => setShowReasoning((value) => !value)} className="mt-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900">{showReasoning ? "Hide full reasoning" : "Read full reasoning"}</button>}
            {showSeparateReasoning && <div className="mt-2 rounded-lg bg-slate-50 p-3"><h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Full reasoning</h5><p className="whitespace-pre-wrap break-words text-xs leading-5 text-text-secondary">{result.reasoning}</p></div>}
          </section>

          {criteria.length > 0 && <section className="space-y-1.5">
            <h4 className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-text-tertiary"><span>Criteria assessment</span><span className="font-medium normal-case tracking-normal">{criteria.length} criteria</span></h4>
            {criteria.map((criterion, index) => <CriterionRow key={`${criterion.id}-${index}`} criterion={criterion} />)}
          </section>}

          {!criteria.length && Array.isArray(data?.evidence) && data.evidence.length > 0 && <section className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Evidence</h4>
            {data.evidence.map((evidence, index) => <EvidenceBlock key={index} value={evidence} />)}
          </section>}

          {humanDecision && <p className={`rounded-lg px-3 py-2 text-[10px] ${decisionAgrees ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"}`}>
            AI recommendation {decisionAgrees ? "matches" : "differs from"} your human decision ({humanDecision}). The AI result does not change your decision.
          </p>}
        </> : <p className="text-xs text-text-secondary">The agent has not submitted a result yet.</p>}

        <details className="group border-t border-border pt-2">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[10px] font-semibold text-text-secondary [&::-webkit-details-marker]:hidden">
            <FiChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" /> Advanced details <span className="font-normal text-text-tertiary">· Raw agent response</span>
          </summary>
          <div className="mt-2 min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-2"><span className="text-[10px] text-text-tertiary">Original response payload</span><button type="button" onClick={() => void copyRaw()} className="inline-flex shrink-0 items-center gap-1 rounded border border-border px-2 py-1 text-[10px] text-text-secondary hover:bg-bg-secondary">{copied ? <FiClipboard /> : <FiCopy />}{copied ? "Copied" : "Copy JSON"}</button></div>
            {notice?.technical && <p className="mb-2 break-all rounded bg-slate-900 px-3 py-2 font-mono text-[10px] text-amber-200">{notice.technical}</p>}
            <JsonPreview value={rawResponse} />
          </div>
        </details>
      </div>
    </article>
  );
}
