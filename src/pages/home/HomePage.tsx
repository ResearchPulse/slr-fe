import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiCheckSquare,
  FiClock,
  FiDatabase,
  FiFileText,
  FiFilter,
  FiGitMerge,
  FiLayers,
  FiSearch,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import type { RootState } from "../../redux/store";
import ScrollReveal from "./ScrollReveal";
import "./home.css";

const contentWidth = "mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-10 xl:px-12";

const workflowSteps = [
  {
    number: "01",
    title: "Set the protocol",
    detail: "Question and criteria",
    icon: FiFileText,
  },
  {
    number: "02",
    title: "Identify records",
    detail: "Search and import",
    icon: FiSearch,
  },
  {
    number: "03",
    title: "Select studies",
    detail: "Screen title to full text",
    icon: FiFilter,
  },
  {
    number: "04",
    title: "Extract evidence",
    detail: "Structured study data",
    icon: FiDatabase,
  },
  {
    number: "05",
    title: "Assess quality",
    detail: "Review study quality",
    icon: FiCheckSquare,
  },
  {
    number: "06",
    title: "Synthesize findings",
    detail: "Themes and PRISMA flow",
    icon: FiLayers,
  },
];

const prismaFlow = [
  ["Records identified", "1,248"],
  ["Duplicates removed", "214"],
  ["Records screened", "1,034"],
  ["Reports sought for retrieval", "160"],
  ["Reports not retrieved", "14"],
  ["Reports assessed for eligibility", "146"],
  ["Reports excluded", "82"],
  ["Studies included", "64"],
];

function HeroResearchPreview() {
  return (
    <div className="landing-page__hero-frame rounded-2xl border p-4 sm:p-6 lg:p-7">
      <article className="landing-page__paper relative z-10 rounded-xl border border-border bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary"><FiFileText aria-hidden="true" className="text-primary" /> RESEARCH PAPER</span>
          <span className="text-xs text-text-secondary">[1] · 2024</span>
        </div>
        <h2 className="mt-4 text-lg font-semibold leading-6 text-text-primary sm:text-xl">Machine learning for clinical decision support</h2>
        <p className="mt-2 text-xs text-text-secondary">A. Chen, M. Patel · Journal of Medical Systems</p>
        <div className="mt-4">
          <p className="text-xs font-semibold text-text-primary">ABSTRACT</p>
          <p className="mt-1.5 text-sm leading-6 text-text-secondary">
            This review evaluates machine learning applications in clinical settings. <span className="landing-evidence-highlight rounded-sm bg-blue-100 px-0.5 text-text-primary">Decision support improved diagnostic consistency</span> across the included studies.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-text-secondary">
          <span className="rounded-md bg-primary-light px-2 py-1 text-primary">Clinical decision support</span>
          <span className="rounded-md bg-bg-secondary px-2 py-1">Evidence excerpt · [1]</span>
        </div>
      </article>
      <div className="landing-page__flow-card relative z-20 ml-auto -mt-3 w-[92%] rounded-xl border border-border bg-white px-4 py-3 sm:w-[84%] sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-text-primary">Review flow</p>
          <span className="text-[10px] text-text-secondary">Illustrative</span>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center">
          {[["1,248", "identified"], ["146", "assessed"], ["64", "included"]].map(([value, label], index) => (
            <Fragment key={label}>
              {index > 0 && <span aria-hidden="true" className="landing-flow-connector h-px w-4 origin-left bg-blue-200 sm:w-7" />}
              <div>
                <p className="text-sm font-semibold tabular-nums text-primary">{value}</p>
                <p className="text-[10px] text-text-secondary">{label}</p>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkflowTimeline() {
  return (
    <div className="relative mt-10">
      <div aria-hidden="true" className="landing-timeline-line absolute left-[8.3%] right-[8.3%] top-[18px] hidden h-px origin-left bg-border xl:block" />
      <ol className="grid gap-x-7 sm:grid-cols-2 xl:grid-cols-6">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.number} className="group relative border-t border-border py-4 xl:border-t-0 xl:pt-0 xl:text-center">
              <ScrollReveal delay={index * 70}>
                <div className="mb-2 flex items-center gap-3 xl:justify-center">
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-[11px] font-semibold text-primary transition-colors group-hover:bg-primary-light">
                    {step.number}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-light text-primary xl:hidden">
                    <Icon aria-hidden="true" size={15} />
                  </span>
                </div>
                <Icon aria-hidden="true" className="mx-auto mb-3 hidden text-primary xl:block" size={17} />
                <h3 className="text-sm font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-text-secondary">{step.detail}</p>
              </ScrollReveal>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CapabilityShowcase() {
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-12">
      <ScrollReveal className="lg:col-span-7">
      <article className="rounded-xl border border-border bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Study screening</h3>
            <p className="mt-1 text-sm text-text-secondary">Eligibility criteria stay beside the evidence.</p>
          </div>
          <FiFilter aria-hidden="true" className="mt-1 shrink-0 text-primary" />
        </div>
        <div className="mt-4 rounded-lg bg-bg-primary p-4">
          <p className="text-[11px] font-semibold text-text-secondary">ABSTRACT · RECORD SR-042</p>
          <p className="mt-2 text-sm leading-6 text-text-primary">The intervention was associated with <span className="landing-evidence-highlight rounded-sm bg-primary-light px-0.5">improved diagnostic consistency</span> in clinical settings.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-success"><FiCheck aria-hidden="true" /> Include · Reviewer 1</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-text-secondary"><FiClock aria-hidden="true" /> Pending · Reviewer 2</span>
          </div>
        </div>
      </article>
      </ScrollReveal>

      <ScrollReveal className="lg:col-span-5" delay={70}>
      <article className="rounded-xl border border-border bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Evidence extraction</h3>
            <p className="mt-1 text-sm text-text-secondary">Structured fields keep findings comparable.</p>
          </div>
          <FiDatabase aria-hidden="true" className="mt-1 shrink-0 text-primary" />
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-[0.8fr_1.2fr] bg-bg-secondary px-3 py-2 text-[11px] font-semibold text-text-secondary"><span>FIELD</span><span>EVIDENCE</span></div>
          {[["Design", "Retrospective cohort"], ["Population", "Clinical settings"], ["Outcome", "Diagnostic consistency"]].map(([field, value]) => (
            <div key={field} className="grid grid-cols-[0.8fr_1.2fr] border-t border-border px-3 py-2 text-xs"><span className="text-text-secondary">{field}</span><span className="text-text-primary">{value}</span></div>
          ))}
        </div>
      </article>
      </ScrollReveal>

      <ScrollReveal className="lg:col-span-4" delay={120}>
      <article className="rounded-xl border border-border bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-text-primary">Reviewer collaboration</h3>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm"><span className="text-text-secondary">Independent decisions</span><FiUsers aria-hidden="true" className="shrink-0 text-primary" /></div>
        <p className="mt-2 text-xs leading-5 text-text-secondary">Compare judgments and route disagreements for resolution.</p>
      </article>
      </ScrollReveal>
      <ScrollReveal className="lg:col-span-4" delay={180}>
      <article className="rounded-xl border border-border bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-text-primary">Quality assessment</h3>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm"><span className="text-text-secondary">Review criteria</span><FiShield aria-hidden="true" className="shrink-0 text-primary" /></div>
        <p className="mt-2 text-xs leading-5 text-text-secondary">Record study-level scores against your assessment framework.</p>
      </article>
      </ScrollReveal>
      <ScrollReveal className="lg:col-span-4" delay={240}>
      <article className="rounded-xl border border-border bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-text-primary">Synthesis & reporting</h3>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm"><span className="text-text-secondary">Evidence groups · PRISMA</span><FiGitMerge aria-hidden="true" className="shrink-0 text-primary" /></div>
        <p className="mt-2 text-xs leading-5 text-text-secondary">Connect extracted findings to themes and study flow.</p>
      </article>
      </ScrollReveal>
    </div>
  );
}

function MethodologyPanel() {
  const items = [
    ["Criteria recorded", "Eligibility rules stay available during screening."],
    ["Independent decisions", "Reviewer submissions remain attributable."],
    ["Resolution history", "Conflicts and outcomes remain connected."],
  ];

  return (
    <div className="rounded-xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <FiShield aria-hidden="true" className="text-primary" /> Traceable decisions
      </div>
      <ol className="mt-4 divide-y divide-border">
        {items.map(([title, description], index) => (
          <li key={title} className="grid grid-cols-[1.5rem_1fr] gap-3 py-3 first:pt-0 last:pb-0">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-light text-[10px] font-semibold text-primary">{index + 1}</span>
            <div>
              <p className="text-sm font-medium text-text-primary">{title}</p>
              <p className="mt-0.5 text-xs leading-5 text-text-secondary">{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ProgressPreview() {
  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-sm font-semibold text-text-primary">PRISMA flow summary</p>
          <p className="mt-1 text-xs text-text-secondary">Illustrative sample values</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary"><FiBookOpen aria-hidden="true" className="text-primary" /> PRISMA 2020</span>
      </div>
      <div className="px-4 pt-3 sm:px-5">
        <div
          role="img"
          aria-label="Illustrative flow: 64 studies included from 146 assessed reports"
          className="h-1.5 overflow-hidden rounded-full bg-primary-light"
        >
          <span className="landing-prisma-fill block h-full w-[43.8%] rounded-full bg-primary" />
        </div>
        <p className="mt-1 text-right text-[10px] text-text-secondary">64 of 146 assessed reports included</p>
      </div>
      <dl className="divide-y divide-border px-4 sm:px-5">
        {prismaFlow.map(([label, value], index) => (
          <div key={label} className={`flex min-h-10 items-center justify-between gap-4 py-2 ${[1, 4, 6].includes(index) ? "pl-4 sm:pl-6" : ""}`}>
            <dt className="text-sm text-text-secondary">{label}</dt>
            <dd className="shrink-0 font-mono text-sm font-semibold tabular-nums text-text-primary">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-border bg-bg-primary px-4 py-2.5 text-xs leading-5 text-text-secondary sm:px-5">
        Sample counts show the path from search to inclusion.
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const startPath = isAuthenticated ? "/projects" : "/auth/signin";

  return (
    <div className="landing-page bg-white text-text-primary">
      <section className="border-b border-border bg-white">
        <div className={`${contentWidth} grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:py-16`}>
          <div className="max-w-[600px]">
            <ScrollReveal>
              <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-primary">SYSTEMATIC REVIEW WORKSPACE</p>
            </ScrollReveal>
            <ScrollReveal delay={70}>
              <h1 className="text-balance text-[38px] font-semibold leading-[1.12] tracking-[-0.025em] text-text-primary sm:text-[46px] xl:text-[50px]">
                A clearer way to review <span className="text-primary">research.</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={140}>
              <p className="mt-4 max-w-[50ch] text-base leading-7 text-text-secondary sm:text-[17px]">
                Organize, evaluate, and synthesize scientific literature in one collaborative workspace.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={210}>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(startPath)}
                className="landing-page__button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Start a Review <FiArrowRight aria-hidden="true" />
              </button>
              <a
                href="#workflow"
                className="landing-page__button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-5 text-sm font-semibold text-text-primary hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Explore the Workflow <FiArrowUpRight aria-hidden="true" />
              </a>
            </div>
            </ScrollReveal>
            <ScrollReveal delay={270}>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-2"><FiCheckCircle aria-hidden="true" className="text-primary" /> PRISMA reporting support</span>
              <span className="inline-flex items-center gap-2"><FiShield aria-hidden="true" className="text-primary" /> Traceable decisions</span>
            </div>
            </ScrollReveal>
          </div>
          <div className="min-w-0 lg:pl-2">
            <ScrollReveal delay={140}>
              <HeroResearchPreview />
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-page__soft-section scroll-mt-20 py-10 sm:py-12 lg:py-14">
        <div className={contentWidth}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <ScrollReveal>
              <h2 className="text-balance text-[26px] font-semibold leading-tight tracking-[-0.02em] text-text-primary sm:text-[32px]">
                From research question to evidence
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={70}>
              <p className="max-w-[42ch] text-sm leading-5 text-text-secondary">A connected workflow for systematic reviews.</p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={100}>
            <WorkflowTimeline />
          </ScrollReveal>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-y border-border bg-white py-10 sm:py-12 lg:py-14">
        <div className={contentWidth}>
          <ScrollReveal>
            <h2 className="text-balance text-[26px] font-semibold leading-tight tracking-[-0.02em] text-text-primary sm:text-[32px]">Evidence, decisions, and synthesis in context</h2>
          </ScrollReveal>
          <CapabilityShowcase />
        </div>
      </section>

      <section id="about" className="scroll-mt-20 border-y border-border bg-white py-10 sm:py-12 lg:py-14">
        <div className={`${contentWidth} grid items-center gap-8 lg:grid-cols-2 lg:gap-14`}>
          <div className="max-w-[520px]">
            <ScrollReveal>
              <h2 className="text-balance text-[26px] font-semibold leading-tight tracking-[-0.02em] text-text-primary sm:text-[32px]">Transparent by design.</h2>
            </ScrollReveal>
            <ScrollReveal delay={70}>
              <p className="mt-3 max-w-[48ch] text-sm leading-6 text-text-secondary">Keep eligibility criteria, reviewer decisions, and resolution history connected throughout the review.</p>
            </ScrollReveal>
            <ScrollReveal delay={120}>
            <a href="https://www.prisma-statement.org/" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              PRISMA 2020 reporting support <FiArrowUpRight aria-hidden="true" />
            </a>
            <p className="mt-2 text-xs leading-5 text-text-secondary">PRISMA is a reporting guideline; SLRS is not affiliated with or endorsed by the PRISMA Group.</p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={100}>
            <MethodologyPanel />
          </ScrollReveal>
        </div>
      </section>

      <section className="border-t border-border bg-white py-10 sm:py-12 lg:py-14">
        <div className={`${contentWidth} grid items-center gap-6 lg:grid-cols-[0.65fr_1.35fr] lg:gap-12`}>
          <div className="max-w-[400px]">
            <ScrollReveal>
              <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-primary">REVIEW PROGRESS</p>
              <h2 className="text-balance text-[26px] font-semibold leading-tight tracking-[-0.02em] text-text-primary sm:text-[32px]">Follow the evidence flow.</h2>
            </ScrollReveal>
            <ScrollReveal delay={70}>
              <p className="mt-3 text-sm leading-6 text-text-secondary">See how records move from identification through eligibility to inclusion.</p>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <dl className="mt-6 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-bg-primary px-3 py-3 sm:px-4">
                {[["1,248", "identified"], ["146", "assessed"], ["64", "included"]].map(([value, label]) => (
                  <div key={label} className="min-w-0 px-2 first:pl-0 last:pr-0 sm:px-3">
                    <dd className="text-lg font-semibold tabular-nums tracking-tight text-text-primary sm:text-xl">{value}</dd>
                    <dt className="mt-0.5 text-[11px] leading-4 text-text-secondary sm:text-xs">{label}</dt>
                  </div>
                ))}
              </dl>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={100}>
            <ProgressPreview />
          </ScrollReveal>
        </div>
      </section>

      <section className="landing-page__cta border-y py-9 sm:py-11">
        <div className={`${contentWidth} flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center`}>
          <div className="max-w-[720px]">
            <ScrollReveal>
              <h2 className="text-balance text-[24px] font-semibold leading-tight tracking-[-0.02em] text-text-primary sm:text-[30px]">
                Ready to begin your review?
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={70}>
              <p className="mt-2 text-sm leading-6 text-text-secondary">Bring your review team and evidence into one workspace.</p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={120}>
          <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(startPath)}
              className="landing-page__button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Start a Review <FiArrowRight aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="landing-page__button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-5 text-sm font-semibold text-text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              View Projects <FiArrowUpRight aria-hidden="true" />
            </button>
          </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
