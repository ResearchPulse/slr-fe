import {
  ArrowRight,
  BarChart3,
  Lightbulb,
  Link2,
  PencilLine,
  Tags,
} from "lucide-react";
import type { SynthesisWorkspaceDto } from "../../../types/synthesisExecution";

interface SynthesisDashboardProps {
  workspace: SynthesisWorkspaceDto;
  finalizedFindingCount: number;
  evidenceCount: number;
  isReadOnly?: boolean;
  onNavigateToThematic: () => void;
  onNavigateToDescriptiveCharts: () => void;
  onNavigateToRqReporting: () => void;
}

function statusLabel(
  status: SynthesisWorkspaceDto["process"]["status"],
): string {
  if (status === "InProgress") return "In progress";
  if (status === "Completed") return "Completed";
  return "Not started";
}

function statusDate(value?: string | null, emptyLabel = "Not available") {
  return value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : emptyLabel;
}

function SummaryTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 px-3 py-3 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 text-text-secondary">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  meta,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  meta: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[144px] w-full flex-col justify-between rounded-xl border border-border/70 bg-surface-white p-4 text-left shadow-sm shadow-slate-900/[0.025] transition-[border-color,box-shadow,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary-light/20 hover:shadow-md hover:shadow-slate-900/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            <p className="mt-1.5 text-sm leading-5 text-text-secondary">
              {description}
            </p>
          </div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
      </div>
      <p className="mt-4 pl-12 text-xs font-medium text-text-secondary">{meta}</p>
    </button>
  );
}

function NextStep({
  title,
  description,
  action,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface-white p-4 shadow-sm shadow-slate-900/[0.025]">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-text-secondary">{description}</p>
        <button
          type="button"
          onClick={onClick}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover focus:outline-none focus-visible:underline"
        >
          {action}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function SynthesisDashboard({
  workspace,
  finalizedFindingCount,
  evidenceCount,
  isReadOnly = false,
  onNavigateToThematic,
  onNavigateToDescriptiveCharts,
  onNavigateToRqReporting,
}: SynthesisDashboardProps) {
  const completedAt = statusDate(workspace.process.completedAt, "Not completed");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface-white p-5 sm:p-6" aria-label="Synthesis overview and phase status">
        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(270px,1fr)] lg:gap-0">
        <div className="py-1 lg:pr-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
              SYNTHESIS PHASE
            </p>
            <h2 className="mt-1.5 text-[26px] font-semibold tracking-tight text-text-primary">
              Overview
            </h2>
            <p className="mt-2 max-w-[700px] text-[15px] leading-6 text-text-secondary">
              Organize extracted evidence into themes, explore patterns, and report findings.
            </p>
          </div>

        </div>

        <aside className="border-t border-border/70 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-1" aria-label="Phase status">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <h3 className="text-base font-semibold text-text-primary">Phase status</h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <span className={`h-2 w-2 rounded-full ${workspace.process.status === "Completed" ? "bg-success" : "bg-primary"}`} aria-hidden="true" />
              {statusLabel(workspace.process.status)}
            </span>
          </div>
          <dl className="mt-1 divide-y divide-border/50">
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-xs text-text-secondary">Started</dt>
              <dd className="max-w-[70%] text-right text-xs font-medium text-text-primary">{statusDate(workspace.process.startedAt, "Not started yet")}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-xs text-text-secondary">Completion</dt>
              <dd className="text-right text-xs font-medium text-text-primary">{completedAt}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-xs text-text-secondary">Editing</dt>
              <dd className="text-xs font-medium text-text-primary">{isReadOnly ? "Read-only" : "Enabled"}</dd>
            </div>
          </dl>
        </aside>
        </div>

        <div className="mt-5 grid grid-cols-2 xl:grid-cols-4">
          <div className="border-b border-r border-border/70 xl:border-b-0"><SummaryTile label="Themes" value={workspace.themes.length} icon={<Tags className="h-4 w-4" aria-hidden="true" />} /></div>
          <div className="border-b border-border/70 xl:border-b-0 xl:border-r"><SummaryTile label="RQ findings" value={`${finalizedFindingCount} / ${workspace.findings.length}`} icon={<PencilLine className="h-4 w-4" aria-hidden="true" />} /></div>
          <div className="border-r border-border/70"><SummaryTile label="Linked evidence" value={evidenceCount} icon={<Link2 className="h-4 w-4" aria-hidden="true" />} /></div>
          <div><SummaryTile label="Extracted papers" value={workspace.totalExtractedPapers} icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />} /></div>
        </div>
      </section>

      <section aria-labelledby="synthesis-workflows-heading">
        <div className="mb-3">
          <h2 id="synthesis-workflows-heading" className="text-lg font-semibold text-text-primary">
            Synthesis workspace
          </h2>
          <p className="mt-1 text-sm text-text-secondary">Continue your synthesis using the tools below.</p>
        </div>
        <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ActionCard
            title="Thematic Analysis"
            description="Organize extracted evidence into themes and refine the synthesis structure."
            meta={`${workspace.themes.length} ${workspace.themes.length === 1 ? "theme" : "themes"}`}
            icon={<Tags className="h-4 w-4" aria-hidden="true" />}
            onClick={onNavigateToThematic}
          />
          <ActionCard
            title="Descriptive Charts"
            description="Explore patterns in extracted study data through descriptive charts."
            meta={`${workspace.totalExtractedPapers} extracted ${workspace.totalExtractedPapers === 1 ? "paper" : "papers"}`}
            icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
            onClick={onNavigateToDescriptiveCharts}
          />
          <ActionCard
            title="RQ Reporting"
            description="Draft, review, and finalize findings for each research question."
            meta={`${finalizedFindingCount} / ${workspace.findings.length} questions completed`}
            icon={<PencilLine className="h-4 w-4" aria-hidden="true" />}
            onClick={onNavigateToRqReporting}
          />
        </div>
      </section>

      {workspace.themes.length === 0 || workspace.findings.length === 0 ? (
        <section aria-labelledby="synthesis-next-steps-heading">
          <h2 id="synthesis-next-steps-heading" className="mb-3 text-base font-semibold text-text-primary">
            Next steps
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {workspace.themes.length === 0 ? (
              <NextStep
                title="No themes yet"
                description="Create a theme to begin organizing extracted evidence."
                action="Start thematic analysis"
                icon={<Tags className="h-4 w-4" aria-hidden="true" />}
                onClick={onNavigateToThematic}
              />
            ) : null}
            {workspace.findings.length === 0 ? (
              <NextStep
                title="No RQ findings yet"
                description="Open RQ reporting to begin working with research question findings."
                action="Open RQ reporting"
                icon={<Lightbulb className="h-4 w-4" aria-hidden="true" />}
                onClick={onNavigateToRqReporting}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
