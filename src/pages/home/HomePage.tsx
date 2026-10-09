import { Fragment, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { ReactNode } from "react";
import {
  FiArrowDown,
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiFileText,
  FiFilter,
  FiGitMerge,
  FiLayers,
  FiSearch,
  FiShield,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import type { RootState } from "../../redux/store";

const workflow = [
  { number: "01", title: "Search", detail: "Collect studies from multiple sources.", icon: FiSearch },
  { number: "02", title: "Screen", detail: "Review and classify relevant records.", icon: FiFilter },
  { number: "03", title: "Extract", detail: "Capture structured research evidence.", icon: FiFileText },
  { number: "04", title: "Report", detail: "Build a clear, reproducible report.", icon: FiBarChart2 },
];

const metrics = [
  { value: "1,248", label: "Records identified", color: "bg-[#0B84D4]" },
  { value: "214", label: "Duplicates removed", color: "bg-[#57A9D9]" },
  { value: "812", label: "Studies screened", color: "bg-[#7AB99D]" },
  { value: "64", label: "Studies included", color: "bg-[#2E9B68]" },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </p>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[570px] px-2 sm:px-0">
      <div className="absolute -inset-8 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(11,132,212,0.16),transparent_68%)] blur-xl" />
      <div className="absolute -right-3 top-10 h-24 w-24 rounded-full border border-primary/10" />
      <div className="absolute -bottom-5 -left-4 h-20 w-20 rounded-full bg-[#DCEFFA]/70 blur-xl" />
      <div className="relative overflow-hidden rounded-[18px] border border-[#D9E5EC] bg-white shadow-[0_28px_80px_rgba(24,54,75,0.14)]">
        <div className="flex items-center justify-between border-b border-[#E8EEF2] bg-[#FBFCFD] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E7F3FB] text-primary"><FiLayers size={14} /></div>
            <div>
              <p className="text-[11px] font-bold text-[#173247]">SLRS workspace</p>
              <p className="text-[9px] text-[#8A9AA5]">PROJECT OVERVIEW</p>
            </div>
          </div>
          <span className="rounded-full border border-[#D5EBDD] bg-[#F0F8F3] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#37835D]">Active review</span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8797A2]">AI in Healthcare Review</p>
              <h2 className="text-[17px] font-bold tracking-[-0.03em] text-[#173247] sm:text-[19px]">Review progress</h2>
            </div>
            <div className="text-right">
              <span className="text-[23px] font-bold tracking-[-0.05em] text-[#173247]">72%</span>
              <p className="text-[9px] text-[#8797A2]">overall completion</p>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EAF0F4]">
            <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#087BC1] to-[#55A9DF]" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Identification", "Complete", "done"],
              ["Screening", "Complete", "done"],
              ["Assessment", "In progress", "current"],
              ["Synthesis", "Upcoming", "next"],
            ].map(([name, state, kind], index) => (
              <div key={name} className={`rounded-xl border p-2.5 ${kind === "current" ? "border-[#A8D4EF] bg-[#F2F9FD]" : "border-[#E9EEF1] bg-white"}`}>
                <div className="mb-2 flex items-center gap-1.5">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold ${kind === "done" ? "bg-[#E6F4EC] text-[#36845C]" : kind === "current" ? "bg-[#DCEFFA] text-primary" : "bg-[#F0F3F5] text-[#98A6AE]"}`}>
                    {kind === "done" ? <FiCheck size={10} /> : `0${index + 1}`}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wide text-[#9AA8B1]">Stage {index + 1}</span>
                </div>
                <p className="text-[10px] font-bold text-[#173247]">{name}</p>
                <p className={`mt-0.5 text-[9px] ${kind === "current" ? "text-primary" : "text-[#8A9AA5]"}`}>{state}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl bg-[#F7F9FA] px-3 py-2.5">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${metric.color}`} />
                  <span className="text-[8px] font-semibold leading-tight text-[#7E8E99]">{metric.label}</span>
                </div>
                <p className="text-[17px] font-bold tracking-[-0.04em] text-[#173247]">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[#E8EEF2] bg-[#FBFCFD] px-5 py-3">
          <div className="flex -space-x-2">
            {[["A", "bg-[#DCEFFA] text-[#2475A5]"], ["M", "bg-[#E6F2E9] text-[#4D8561]"], ["J", "bg-[#F8EBD9] text-[#9B7138]"]].map(([letter, style]) => (
              <span key={letter} className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold ${style}`}>{letter}</span>
            ))}
          </div>
          <p className="text-[9px] text-[#81919C]">Updated a few minutes ago</p>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary">Open project <FiArrowUpRight size={11} /></span>
        </div>
      </div>
      <div className="absolute -left-7 bottom-12 hidden items-center gap-2 rounded-xl border border-[#E1E9EE] bg-white px-3 py-2.5 shadow-[0_10px_35px_rgba(24,54,75,0.10)] sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EDF7F1] text-[#32835B]"><FiCheckCircle size={15} /></span>
        <span><b className="block text-[10px] text-[#173247]">PRISMA aligned</b><small className="text-[9px] text-[#81919C]">Decision trail preserved</small></span>
      </div>
    </div>
  );
}

function AppPreview({ children }: { children: ReactNode }) {
  return <div className="mt-5 rounded-xl border border-[#E4EBEF] bg-white p-3 shadow-[0_5px_18px_rgba(17,47,66,0.04)]">{children}</div>;
}

export default function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const startPath = isAuthenticated ? "/projects" : "/auth/signin";

  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>(".scroll-reveal, .scroll-pop");
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden bg-[#F6F9FB] text-[#132B3C]">
      <section className="relative border-b border-[#E0E9EE] bg-[linear-gradient(115deg,#F8FBFD_0%,#F1F7FA_56%,#F5F9FC_100%)]">
        <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-[#DFEFF8]/65 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[48%] bg-[radial-gradient(ellipse_at_75%_45%,rgba(92,169,215,0.12),transparent_66%)]" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[650px] lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:px-12 lg:py-20">
          <div className="relative z-10 max-w-[570px]">
            <Eyebrow>PRISMA-based research workflow</Eyebrow>
            <h1 aria-label="Systematic Literature Review System" className="text-[42px] font-bold leading-[1.06] tracking-[-0.055em] text-[#102A3B] sm:text-[54px] lg:text-[62px]">
              Systematic Literature<br />
              <span className="text-[#087BC1]">Review System</span>
            </h1>
            <p className="mt-6 max-w-[490px] text-[15px] leading-7 text-[#607482] sm:text-[16px]">
              Plan, screen, extract, and report research evidence through one structured and reproducible workflow.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => navigate(startPath)} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#087BC1] px-6 text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(8,123,193,0.19)] transition hover:-translate-y-0.5 hover:bg-[#066BA9]">
                Start a Review <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => navigate("/projects")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#CBD9E1] bg-white/70 px-6 text-[12px] font-bold text-[#234256] transition hover:-translate-y-0.5 hover:border-[#8DBFE0] hover:bg-white">
                View Projects <FiArrowUpRight />
              </button>
            </div>
            <div className="mt-7 space-y-2.5 text-[11px] font-semibold text-[#728592]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="inline-flex items-center gap-1.5 text-[#37835D]"><FiCheckCircle size={14} /> Built around PRISMA 2020</span>
                <span className="hidden h-1 w-1 rounded-full bg-[#A7B6BF] sm:block" />
                <span>Transparent by design</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[#718592]"><FiUsers size={13} className="text-primary" /> For project leaders, researchers, and reviewers</span>
            </div>
          </div>
          <div className="relative py-2 sm:px-5 lg:py-8"><ProductPreview /></div>
        </div>
      </section>

      <section id="workflow" className="scroll-reveal scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[650px] text-center">
            <Eyebrow>Workflow</Eyebrow>
            <h2 className="text-[32px] font-bold leading-tight tracking-[-0.045em] text-[#132B3C] sm:text-[40px]">A structured path from search to synthesis</h2>
            <p className="mt-4 text-[14px] leading-6 text-[#6A7D89] sm:text-[15px]">Keep every review stage transparent, traceable, and reproducible.</p>
          </div>
          <div className="relative mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            <div className="absolute left-[12%] right-[12%] top-[31px] hidden h-px bg-[#C9DDE9] lg:block" />
            {workflow.map((step, index) => (
              <div key={step.number} className={`scroll-pop group relative px-0 lg:px-3${index > 0 ? ` scroll-pop-delay-${index}` : ""}`}>
                <div className="relative flex min-h-[188px] flex-col rounded-2xl border border-[#E0E9EE] bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#A8CFE6] hover:shadow-[0_14px_34px_rgba(24,54,75,0.08)] sm:p-6 lg:mx-2">
                  <div className="relative z-10 mb-5 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D9EAF4] bg-[#EFF7FB] text-primary transition group-hover:bg-primary group-hover:text-white"><step.icon size={19} /></span>
                    <span className="text-[11px] font-bold tracking-[0.15em] text-[#9BAAB3]">{step.number}</span>
                  </div>
                  <h3 className="text-[17px] font-bold text-[#173247]">{step.title}</h3>
                  <p className="mt-2 max-w-[230px] text-[12px] leading-5 text-[#72838E]">{step.detail}</p>
                  {index < workflow.length - 1 && <span className="absolute -right-3 top-[26px] z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-[#D7E5EC] bg-[#F6F9FB] text-[#7294A8] lg:flex"><FiArrowRight size={12} /></span>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8A9AA4]"><FiGitMerge className="text-primary" /> One connected PRISMA workflow</div>
        </div>
      </section>

      <section id="features" className="scroll-reveal scroll-mt-24 border-y border-[#E2EAF0] bg-[#F0F5F8] py-20 sm:py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-[650px]">
              <Eyebrow>Capabilities</Eyebrow>
              <h2 className="text-[32px] font-bold leading-tight tracking-[-0.045em] text-[#132B3C] sm:text-[40px]">Everything your research team needs</h2>
            </div>
            <p className="max-w-[410px] text-[13px] leading-6 text-[#6A7D89]">One workspace for managing systematic reviews from protocol definition to final evidence synthesis.</p>
          </div>

          <div className="grid auto-rows-[minmax(190px,auto)] gap-4 md:grid-cols-2 lg:grid-cols-6">
            <article className="scroll-pop group relative overflow-hidden rounded-2xl border border-[#DBE6EC] bg-white p-6 transition hover:border-[#A7CFE7] hover:shadow-[0_14px_36px_rgba(24,54,75,0.08)] md:col-span-2 lg:col-span-3 lg:row-span-2">
              <div className="flex items-start justify-between gap-4">
                <div><span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5FB] text-primary"><FiZap size={17} /></span><h3 className="mt-4 text-[18px] font-bold text-[#173247]">Smart screening</h3><p className="mt-1 max-w-[330px] text-[12px] leading-5 text-[#72838E]">Move through records efficiently, with reviewers making and owning each decision.</p></div>
                <span className="rounded-full bg-[#F0F7FB] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">Reviewer-led</span>
              </div>
              <AppPreview>
                <div className="flex items-center justify-between gap-3"><span className="text-[9px] font-bold uppercase tracking-wider text-[#96A5AE]">Title & abstract · Paper 142</span><span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#39835D]"><FiCheckCircle size={11} /> Assigned to you</span></div>
                <p className="mt-2 text-[11px] font-bold leading-5 text-[#263F50]">Transformer-based approaches for clinical natural language processing</p>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EDF1F3] pt-3"><span className="text-[9px] text-[#84949E]">Relevance indicators · 4 criteria matched</span><span className="rounded-md bg-[#EAF5FB] px-2 py-1 text-[9px] font-bold text-primary">High relevance</span></div>
                <div className="mt-3 flex gap-2"><span className="flex-1 rounded-lg border border-[#CDE4D5] bg-[#F4FAF6] py-2 text-center text-[10px] font-bold text-[#37835D]">Include</span><span className="flex-1 rounded-lg border border-[#E4E9EC] bg-[#FAFBFC] py-2 text-center text-[10px] font-bold text-[#71828D]">Exclude</span></div>
              </AppPreview>
            </article>

            <article className="scroll-pop scroll-pop-delay-1 group overflow-hidden rounded-2xl border border-[#DBE6EC] bg-white p-6 transition hover:border-[#A7CFE7] hover:shadow-[0_14px_36px_rgba(24,54,75,0.08)] md:col-span-1 lg:col-span-3">
              <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FB] text-[#477BA2]"><FiUsers size={17} /></span><div><h3 className="text-[17px] font-bold text-[#173247]">Team collaboration</h3><p className="mt-1 text-[11px] leading-5 text-[#72838E]">Coordinate independent reviews and resolve differences with context.</p></div></div>
              <AppPreview>
                <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 text-[10px]"><span className="text-[#657985]">Reviewer A</span><span className="rounded-md bg-[#EDF7F1] px-2 py-1 font-bold text-[#37835D]">Include</span><span className="text-[#657985]">Reviewer B</span><span className="rounded-md bg-[#FBF3E6] px-2 py-1 font-bold text-[#A17630]">Exclude</span></div>
                <div className="mt-3 flex items-center justify-between border-t border-[#EDF1F3] pt-2.5"><span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#A17630]"><FiGitMerge size={12} /> Conflict detected</span><span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary">Review decision <FiArrowRight size={11} /></span></div>
              </AppPreview>
            </article>

            <article className="scroll-pop scroll-pop-delay-2 group overflow-hidden rounded-2xl border border-[#DBE6EC] bg-white p-6 transition hover:border-[#A7CFE7] hover:shadow-[0_14px_36px_rgba(24,54,75,0.08)] md:col-span-1 lg:col-span-3">
              <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6F2] text-[#43835F]"><FiDatabase size={17} /></span><div><h3 className="text-[17px] font-bold text-[#173247]">Structured extraction</h3><p className="mt-1 text-[11px] leading-5 text-[#72838E]">Capture study findings in consistent, review-ready evidence tables.</p></div></div>
              <AppPreview>
                <div className="flex items-center justify-between border-b border-[#EDF1F3] pb-2 text-[9px] font-bold uppercase tracking-wide text-[#94A2AA]"><span>Evidence matrix</span><span>3 studies</span></div>
                <div className="mt-2 grid grid-cols-[1fr_1.3fr_1fr] gap-2 text-[9px]"><span className="font-semibold text-[#73848E]">Study</span><span className="font-semibold text-[#73848E]">Key finding</span><span className="font-semibold text-[#73848E]">Outcome</span><span className="truncate text-[#526977]">Chen et al. · 2024</span><span className="truncate text-[#526977]">Improved clinical...</span><span className="text-[#37835D]">Positive</span></div>
              </AppPreview>
            </article>

            <article className="scroll-pop scroll-pop-delay-1 group rounded-2xl border border-[#DBE6EC] bg-white p-5 transition hover:border-[#A7CFE7] hover:shadow-[0_14px_36px_rgba(24,54,75,0.08)] lg:col-span-2">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2F4FA] text-[#6378A5]"><FiClock size={16} /></span><h3 className="text-[15px] font-bold text-[#173247]">Audit trail</h3></div>
              <p className="mt-3 text-[11px] leading-5 text-[#72838E]">Decisions stay connected to their reviewer, date, and rationale.</p>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F7F9FA] px-3 py-2 text-[9px] text-[#71828D]"><FiCheckCircle className="text-[#37835D]" /> Decision recorded <span className="ml-auto">10:42 AM</span></div>
            </article>

            <article className="scroll-pop scroll-pop-delay-2 group rounded-2xl border border-[#DBE6EC] bg-white p-5 transition hover:border-[#A7CFE7] hover:shadow-[0_14px_36px_rgba(24,54,75,0.08)] lg:col-span-2">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5FB] text-primary"><FiLayers size={16} /></span><h3 className="text-[15px] font-bold text-[#173247]">PRISMA ready</h3></div>
              <p className="mt-3 text-[11px] leading-5 text-[#72838E]">Track records through each stage and prepare transparent reporting.</p>
              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-[#68808F]"><span className="rounded bg-[#EDF5F9] px-2 py-1">Identified</span><FiArrowRight /><span className="rounded bg-[#EDF5F9] px-2 py-1">Screened</span><FiArrowRight /><span className="rounded bg-[#EAF5EF] px-2 py-1 text-[#37835D]">Included</span></div>
            </article>
          </div>
        </div>
      </section>

      <section className="scroll-reveal py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-12">
          <div>
            <Eyebrow>Review progress</Eyebrow>
            <h2 className="text-[32px] font-bold leading-tight tracking-[-0.045em] text-[#132B3C] sm:text-[40px]">See your review at a glance</h2>
            <p className="mt-4 max-w-[430px] text-[14px] leading-6 text-[#6A7D89]">Follow the evidence from identification to inclusion, with a clear view of what has moved and what remains.</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#DCE8EE] bg-white px-3 py-2 text-[10px] font-semibold text-[#6C808C]"><FiShield className="text-primary" /> Traceable review decisions</div>
          </div>
          <div className="rounded-[18px] border border-[#DCE6EC] bg-white p-5 shadow-[0_18px_55px_rgba(24,54,75,0.07)] sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#91A0A9]">AI in Healthcare Review</p><h3 className="mt-1 text-[16px] font-bold text-[#173247]">PRISMA flow summary</h3></div><span className="rounded-lg border border-[#E2E9ED] bg-[#FAFBFC] px-3 py-2 text-[9px] font-semibold text-[#748590]">All sources <span className="ml-1 text-[#A1ADB4]">⌄</span></span></div>
            <div className="grid gap-6 md:grid-cols-[1fr_0.9fr] md:items-center">
              <div className="grid grid-cols-2 gap-3">
                {metrics.map((metric) => <div key={metric.label} className="rounded-xl border border-[#E8EEF1] bg-[#FCFDFD] p-4"><p className="text-[23px] font-bold tracking-[-0.05em] text-[#173247]">{metric.value}</p><p className="mt-1 text-[10px] leading-4 text-[#768893]">{metric.label}</p></div>)}
              </div>
              <div className="flex flex-col items-center" aria-label="PRISMA study selection funnel">
                {[
                  { label: "Records identified", value: "1,248", width: "w-full", tone: "bg-[#DCEFFA] text-[#236F9D]" },
                  { label: "After duplicates", value: "1,034", width: "w-[84%]", tone: "bg-[#CDE6F4] text-[#236F9D]" },
                  { label: "Full text assessed", value: "146", width: "w-[67%]", tone: "bg-[#DDEFE5] text-[#397C58]" },
                  { label: "Studies included", value: "64", width: "w-[49%]", tone: "bg-[#CBE6D5] text-[#31744F]" },
                ].map((stage, i) => (
                  <Fragment key={stage.label}>
                    <div
                      className={`${stage.width} ${stage.tone} flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:scale-[1.02]`}
                    >
                      <span className="text-[9px] font-semibold">{stage.label}</span>
                      <span className="text-[11px] font-extrabold">{stage.value}</span>
                    </div>
                    {i < 3 && <FiArrowDown className="my-1 text-[16px] text-[#173247]" />}
                  </Fragment>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-[#EDF1F3] pt-4 text-[9px] text-[#82929C]"><FiCheckCircle className="text-[#37835D]" /> Counts stay linked to decisions made across the review</div>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-reveal scroll-mt-24 border-y border-[#E2EAF0] bg-[#F0F5F8] py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12">
          <div className="relative">
            <div className="absolute -inset-5 rounded-[28px] bg-[radial-gradient(ellipse_at_center,rgba(96,171,213,0.14),transparent_72%)]" />
            <div className="relative rounded-[18px] border border-[#DBE6EC] bg-white p-5 shadow-[0_18px_55px_rgba(24,54,75,0.08)] sm:p-6">
              <div className="flex items-center justify-between border-b border-[#E9EEF1] pb-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8B9AA3]">Screening decision</p><h3 className="mt-1 text-[13px] font-bold text-[#173247]">Paper #142</h3></div><span className="rounded-full bg-[#FBF3E6] px-2.5 py-1 text-[9px] font-bold text-[#A17630]">Needs resolution</span></div>
              <p className="py-4 text-[12px] font-semibold leading-5 text-[#334C5B]">“Transformer-based approaches for clinical NLP”</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-xl border border-[#E9EEF1] bg-[#FCFDFD] px-3.5 py-3"><span className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF3F8] text-[9px] font-bold text-[#477BA2]">RA</span><span><b className="block text-[10px] text-[#405866]">Reviewer A</b><small className="text-[9px] text-[#91A0A9]">Independent review</small></span></span><span className="rounded-md bg-[#EDF7F1] px-2.5 py-1 text-[9px] font-bold text-[#37835D]">Include</span></div>
                <div className="flex items-center justify-between rounded-xl border border-[#E9EEF1] bg-[#FCFDFD] px-3.5 py-3"><span className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3EDF8] text-[9px] font-bold text-[#80669B]">RB</span><span><b className="block text-[10px] text-[#405866]">Reviewer B</b><small className="text-[9px] text-[#91A0A9]">Independent review</small></span></span><span className="rounded-md bg-[#F3F4F5] px-2.5 py-1 text-[9px] font-bold text-[#778790]">Exclude</span></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F5F8FA] p-3"><span className="inline-flex items-center gap-2 text-[10px] font-bold text-[#A17630]"><FiGitMerge /> Conflict · decision history saved</span><button onClick={() => navigate(startPath)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#102D40] px-3 py-2 text-[9px] font-bold text-white transition hover:-translate-y-0.5">Resolve decision <FiArrowRight /></button></div>
              <div className="mt-4 flex items-center gap-2 text-[9px] text-[#84949E]"><FiClock /> Both reviewers' decisions remain independent until resolution.</div>
            </div>
          </div>

          <div>
            <Eyebrow>Team review</Eyebrow>
            <h2 className="text-[32px] font-bold leading-tight tracking-[-0.045em] text-[#132B3C] sm:text-[40px]">Designed for collaborative evidence review</h2>
            <p className="mt-4 max-w-[490px] text-[14px] leading-6 text-[#6A7D89]">Coordinate reviewers, compare screening decisions, resolve conflicts, and keep a transparent record of every decision.</p>
            <ul className="mt-7 space-y-3">
              {["Independent screening", "Conflict resolution", "Decision history"].map((item) => <li key={item} className="flex items-center gap-3 text-[13px] font-semibold text-[#405967]"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E5F2F9] text-primary"><FiCheck size={13} /></span>{item}</li>)}
            </ul>
            <button onClick={() => navigate("/projects")} className="group mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">Explore your projects <FiArrowRight className="transition-transform group-hover:translate-x-1" /></button>
          </div>
        </div>
      </section>

      <section className="scroll-reveal px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[22px] bg-[#102B3D] px-6 py-12 text-center shadow-[0_22px_60px_rgba(16,43,61,0.16)] sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(28,131,193,0.30),transparent_44%),radial-gradient(ellipse_at_8%_100%,rgba(48,113,149,0.22),transparent_36%)]" />
          <div className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 items-center gap-3 opacity-[0.13] lg:flex">{workflow.map((stage, i) => <div key={stage.number} className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-white text-[10px] font-bold text-white">{stage.number}</span>{i < workflow.length - 1 && <span className="h-px w-12 bg-white" />}</div>)}</div>
          <div className="relative mx-auto max-w-[620px]">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#86C4E8]">Make your next review clearer</p>
            <h2 className="text-[30px] font-bold leading-tight tracking-[-0.04em] text-white sm:text-[38px]">Ready to start your next review?</h2>
            <p className="mx-auto mt-4 max-w-[500px] text-[13px] leading-6 text-white/70">Create a structured review project and guide your team through the PRISMA workflow.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={() => navigate(startPath)} className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[11px] font-bold text-[#12354A] transition hover:-translate-y-0.5 hover:bg-[#EFF8FC]">Start a Review <FiArrowRight className="transition-transform group-hover:translate-x-0.5" /></button>
              <button onClick={() => navigate("/projects")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 text-[11px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10">View Projects <FiArrowUpRight /></button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
