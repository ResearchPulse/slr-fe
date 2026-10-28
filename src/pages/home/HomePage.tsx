import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
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
import scrollCraftRuntimeUrl from "./vendor/scrollcraft.js?url";
import "./home.css";

gsap.registerPlugin(ScrollTrigger);

interface ScrollCraftInstance {
  destroy: () => void;
}

declare global {
  interface Window {
    ScrollCraft?: {
      mount: (root: HTMLElement) => ScrollCraftInstance;
    };
  }
}

let scrollCraftRuntime: Promise<void> | null = null;

function loadScrollCraftRuntime(): Promise<void> {
  if (window.ScrollCraft) return Promise.resolve();
  if (scrollCraftRuntime) return scrollCraftRuntime;

  scrollCraftRuntime = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scrollCraftRuntimeUrl;
    script.async = true;
    script.dataset.scrollCraftRuntime = "true";
    script.onload = () => resolve();
    script.onerror = () => {
      scrollCraftRuntime = null;
      reject(new Error("Scroll Craft runtime failed to load"));
    };
    document.head.appendChild(script);
  });

  return scrollCraftRuntime;
}

const workflowSteps = [
  { number: "01", title: "Set the protocol", detail: "Define the review question and eligibility criteria.", icon: FiClipboard },
  { number: "02", title: "Identify records", detail: "Import search results and retain their source context.", icon: FiSearch },
  { number: "03", title: "Select studies", detail: "Screen titles, abstracts, and full-text reports.", icon: FiFilter },
  { number: "04", title: "Extract evidence", detail: "Capture study findings in a shared data structure.", icon: FiDatabase },
  { number: "05", title: "Assess quality", detail: "Appraise included studies with review criteria.", icon: FiCheckCircle },
  { number: "06", title: "Synthesize", detail: "Compare findings and prepare review outputs.", icon: FiGitMerge },
];

function ResearchPaperPreview() {
  return (
    <div className="landing-hero-art" aria-label="Illustrative research workspace preview">
      <div className="landing-hero-art__wash" aria-hidden="true" />
      <div className="landing-hero-art__source" data-sc-parallax="-0.14" aria-hidden="true">
        <span>PROTOCOL</span>
        <i />
        <i />
        <i />
      </div>
      <article className="landing-paper-sheet">
        <div className="landing-paper-sheet__topline">
          <span><FiFileText aria-hidden="true" /> ILLUSTRATIVE STUDY RECORD</span>
          <span>RECORD · PROTOCOL</span>
        </div>
        <h2>Study record in context</h2>
        <p className="landing-paper-sheet__citation">Title, authors, publication details and source</p>
        <div className="landing-paper-sheet__abstract">
          <span>REVIEW CONTEXT</span>
          <p>
            Compare each study with protocol criteria, then keep the decision,
            rationale, and extracted findings connected to the source record.
          </p>
        </div>
        <div className="landing-paper-sheet__footer">
          <span><FiCheck aria-hidden="true" /> Decision rationale</span>
          <span><FiBookOpen aria-hidden="true" /> Source-linked evidence</span>
        </div>
      </article>
      <div className="landing-hero-art__annotation" data-sc-parallax="0.12">
        <span className="landing-hero-art__annotation-mark"><FiLayers aria-hidden="true" /></span>
        <span><b>Evidence field</b><small>Structured for comparison</small></span>
      </div>
      <p className="landing-hero-art__caption">Illustrative interface · no project data</p>
    </div>
  );
}

function WorkflowTimeline() {
  return (
    <>
    <ol className="landing-workflow">
      {workflowSteps.map((step) => {
        const Icon = step.icon;
        return (
          <li key={step.number} className="landing-workflow__step">
            <div className="landing-workflow__marker">
              <span>{step.number}</span>
              <Icon aria-hidden="true" />
            </div>
            <h3>{step.title}</h3>
            <p>{step.detail}</p>
          </li>
        );
      })}
    </ol>
    <p className="landing-workflow__note"><FiGitMerge aria-hidden="true" /> Source records, criteria, decisions and findings move through one documented review path.</p>
    </>
  );
}

function ScreeningPreview() {
  return (
    <div className="landing-screening-preview">
      <div className="landing-screening-preview__paper">
        <div className="landing-preview-label"><FiFileText aria-hidden="true" /> ILLUSTRATIVE REVIEW STATE</div>
        <h3>Study eligibility</h3>
        <p>Review the source record against the saved inclusion criteria.</p>
        <div className="landing-preview-quote">
          <span>CRITERION</span>
          <p>Population and study design align with the review scope.</p>
        </div>
      </div>
      <div className="landing-reviewers" aria-label="Reviewer collaboration capabilities">
        <div className="landing-reviewer">
          <span className="landing-reviewer__label"><FiUsers aria-hidden="true" /> REVIEW WORKSPACE</span>
          <strong><FiCheckCircle aria-hidden="true" /> Independent decisions</strong>
          <small>Each reviewer records a rationale</small>
        </div>
        <div className="landing-reviewer landing-reviewer--pending">
          <span className="landing-reviewer__label"><FiGitMerge aria-hidden="true" /> RESOLUTION</span>
          <strong><FiFileText aria-hidden="true" /> Conflict history</strong>
          <small>Consensus remains traceable</small>
        </div>
      </div>
    </div>
  );
}

function ExtractionPreview() {
  const fields = [
    ["Study design", "Design and method"],
    ["Population", "Population and context"],
    ["Main finding", "Finding linked to source"],
  ];

  return (
    <div className="landing-extraction-preview">
      <div className="landing-extraction-preview__head">
        <span><FiDatabase aria-hidden="true" /> ILLUSTRATIVE EXTRACTION</span>
        <span>FIELD · EVIDENCE</span>
      </div>
      {fields.map(([field, description]) => (
        <div className="landing-extraction-preview__row" key={field}>
          <span>{field}</span>
          <span>{description}</span>
        </div>
      ))}
    </div>
  );
}

function EvidenceSpine() {
  return (
    <section className="landing-evidence-act" data-sc-act="pin" data-sc-span="2.1" aria-labelledby="evidence-spine-title">
      <div className="landing-evidence-stage" data-sc-stage>
        <div className="landing-evidence-stage__inner">
          <div className="landing-evidence-copy">
            <h2 id="evidence-spine-title">Separate studies.<br /><span>One connected review.</span></h2>
            <p>Keep each decision, extracted field and source connected as the review takes shape.</p>
            <div className="landing-evidence-legend">
              <span><i className="landing-legend-dot landing-legend-dot--source" /> Source record</span>
              <span><i className="landing-legend-dot landing-legend-dot--decision" /> Review decision</span>
              <span><i className="landing-legend-dot landing-legend-dot--evidence" /> Extracted evidence</span>
            </div>
          </div>
          <div className="landing-evidence-visual" aria-label="Illustration of records connecting to a traceable evidence path">
            <svg className="landing-evidence-path" viewBox="0 0 700 420" fill="none" aria-hidden="true">
              <path className="landing-evidence-path__line" pathLength="1" d="M105 93 C196 93 174 205 270 205 S350 105 425 142 S486 280 590 302" />
              <path className="landing-evidence-path__line landing-evidence-path__line--branch" pathLength="1" d="M116 323 C194 323 206 208 270 205" />
            </svg>
            <div className="landing-evidence-fragment landing-evidence-fragment--source">
              <span><FiFileText aria-hidden="true" /> SOURCE</span>
              <b>Study record</b>
              <small>Metadata and abstract</small>
            </div>
            <div className="landing-evidence-fragment landing-evidence-fragment--decision">
              <span><FiFilter aria-hidden="true" /> DECISION</span>
              <b>Eligibility review</b>
              <small>Criteria and rationale</small>
            </div>
            <div className="landing-evidence-fragment landing-evidence-fragment--review">
              <span><FiUsers aria-hidden="true" /> REVIEW</span>
              <b>Reviewer input</b>
              <small>Independent and attributable</small>
            </div>
            <div className="landing-evidence-fragment landing-evidence-fragment--evidence">
              <span><FiDatabase aria-hidden="true" /> EVIDENCE</span>
              <b>Structured finding</b>
              <small>Linked back to the source</small>
            </div>
            <div className="landing-evidence-endpoint"><FiGitMerge aria-hidden="true" /><span>Review record</span></div>
          </div>
          <p className="landing-evidence-stage__note">Criteria <span>→</span> decision <span>→</span> extracted evidence <span>→</span> reporting</p>
        </div>
      </div>
    </section>
  );
}

function MethodologyScene() {
  return (
    <section id="about" className="landing-methodology" data-sc-act="flow" aria-labelledby="methodology-title">
      <div className="landing-methodology__copy">
        <h2 id="methodology-title">A review you can follow.</h2>
        <p>Carry the question and eligibility criteria through screening, appraisal and reporting. Preserve the context behind decisions as evidence is compared.</p>
        <a href="https://www.prisma-statement.org/" target="_blank" rel="noreferrer" className="landing-text-link">
          PRISMA 2020 reporting support <FiArrowUpRight aria-hidden="true" />
        </a>
        <p className="landing-methodology__disclaimer">PRISMA is a reporting guideline. SLRS is not affiliated with or endorsed by the PRISMA Group.</p>
        <ul className="landing-methodology__details">
          <li><FiCheck aria-hidden="true" /><span><b>Criteria are set before screening.</b> Apply a consistent scope from title review through full text.</span></li>
          <li><FiCheck aria-hidden="true" /><span><b>Reviewer decisions remain attributable.</b> Keep rationale and conflict resolution in view.</span></li>
          <li><FiCheck aria-hidden="true" /><span><b>Evidence stays connected to its source.</b> Compare structured findings in their study context.</span></li>
        </ul>
      </div>
      <div className="landing-methodology__visual">
        <div className="landing-methodology__visual-head">
          <span><FiShield aria-hidden="true" /> TRACEABLE REVIEW</span>
          <span>PRISMA 2020</span>
        </div>
        <ol className="landing-report-flow">
          <li><span className="landing-report-flow__node"><FiSearch aria-hidden="true" /></span><span><b>Identify</b><small>Sources and records</small></span></li>
          <li><span className="landing-report-flow__node"><FiFilter aria-hidden="true" /></span><span><b>Screen</b><small>Eligibility decisions</small></span></li>
          <li><span className="landing-report-flow__node"><FiLayers aria-hidden="true" /></span><span><b>Assess</b><small>Included study evidence</small></span></li>
          <li><span className="landing-report-flow__node"><FiBookOpen aria-hidden="true" /></span><span><b>Report</b><small>Review flow and outputs</small></span></li>
        </ol>
        <p className="landing-methodology__caption">A reporting pathway, without sample counts.</p>
      </div>
    </section>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const startPath = isAuthenticated ? "/projects" : "/auth/signin";
  const landingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let instance: ScrollCraftInstance | undefined;
    const root = landingRef.current;
    if (!root) return undefined;

    const media = gsap.matchMedia(root);
    media.add({
      reducedMotion: "(prefers-reduced-motion: reduce)",
      desktop: "(min-width: 768px)",
    }, ({ conditions }) => {
      if (conditions?.reducedMotion) return undefined;

      const hero = gsap.timeline({ defaults: { ease: "power3.out" } });
      hero
        .fromTo(".landing-hero__message .landing-eyebrow", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0)
        .fromTo(".landing-hero__message h1", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.42 }, 0.04)
        .fromTo(".landing-hero__description", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.32 }, 0.14)
        .fromTo(".landing-hero__actions > *", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.04 }, 0.22)
        .fromTo(".landing-hero__proof > *", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.26, stagger: 0.04 }, 0.3)
        .fromTo(".landing-hero__visual", { autoAlpha: 0, x: 26, y: 14, scale: 0.985 }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.72 }, 0.04);

      gsap.fromTo(".landing-workflow__step",
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.62,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".landing-workflow", start: "top 76%", once: true },
        },
      );
      gsap.fromTo(".landing-workflow",
        { "--line-progress": 0 },
        {
          "--line-progress": 1,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: { trigger: ".landing-workflow", start: "top 76%", once: true },
        },
      );

      const capabilities = gsap.timeline({
        scrollTrigger: { trigger: ".landing-capability-grid", start: "top 78%", once: true },
      });
      capabilities
        .fromTo(".landing-capability-main", { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.72, ease: "power3.out" })
        .fromTo(".landing-capability-secondary", { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.72, ease: "power3.out" }, "-=0.52")
        .fromTo(".landing-capability-note", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.1, ease: "power3.out" }, "-=0.28");

      const evidence = gsap.timeline({
        scrollTrigger: conditions?.desktop
          ? { trigger: ".landing-evidence-act", start: "top 64px", end: "bottom bottom", scrub: 0.35, invalidateOnRefresh: true }
          : { trigger: ".landing-evidence-act", start: "top 78%", once: true },
      });
      if (conditions?.desktop) {
        evidence
          .fromTo(".landing-evidence-path__line", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.72, stagger: 0.04, ease: "none" }, 0.08)
          .fromTo(".landing-evidence-fragment", { autoAlpha: 0.25, y: 22, scale: 0.965 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, stagger: 0.13, ease: "none" }, 0)
          .fromTo(".landing-evidence-endpoint", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.18, ease: "none" }, 0.82);
      } else {
        evidence
          .fromTo(".landing-evidence-fragment", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.08, ease: "power2.out" })
          .fromTo(".landing-evidence-path__line", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.65, stagger: 0.06, ease: "power2.out" }, "-=0.18");
      }

      const methodology = gsap.timeline({
        scrollTrigger: { trigger: ".landing-methodology", start: "top 76%", once: true },
      });
      methodology
        .fromTo(".landing-methodology__copy", { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" })
        .fromTo(".landing-methodology__visual", { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.72, ease: "power3.out" }, "-=0.48")
        .fromTo(".landing-report-flow", { "--line-progress": 0 }, { "--line-progress": 1, duration: 0.62, ease: "power2.out" }, "-=0.34")
        .fromTo(".landing-report-flow__node", { scale: 0.86 }, { scale: 1, duration: 0.42, stagger: 0.09, ease: "power3.out" }, "-=0.22");

      gsap.fromTo(".landing-close-scene__copy, .landing-close-scene__path",
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          stagger: 0.16,
          ease: "power3.out",
          scrollTrigger: { trigger: ".landing-close-scene", start: "top 82%", once: true },
        },
      );

      return undefined;
    });

    void loadScrollCraftRuntime()
      .then(() => {
        if (active && landingRef.current && window.ScrollCraft) {
          instance = window.ScrollCraft.mount(landingRef.current);
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }
      })
      .catch(() => {
        // The full page remains visible and readable if the optional motion runtime fails.
      });

    return () => {
      active = false;
      instance?.destroy();
      media.revert();
    };
  }, []);

  return (
    <div ref={landingRef} className="landing-page">
      <section className="landing-hero" data-sc-act="flow" aria-labelledby="landing-title">
        <div className="landing-shell landing-hero__grid">
          <div className="landing-hero__copy">
            <div className="landing-hero__message">
              <p className="landing-eyebrow">SYSTEMATIC REVIEW WORKSPACE</p>
              <h1 id="landing-title">A clearer way to review <span>research.</span></h1>
              <p className="landing-hero__description">
                Plan the review, assess source records, and keep screening decisions and extracted findings connected in one collaborative workspace.
              </p>
            </div>
            <div className="landing-hero__actions">
              <button type="button" onClick={() => navigate(startPath)} className="landing-button landing-button--primary">
                Start a Review <FiArrowRight aria-hidden="true" />
              </button>
              <a href="#workflow" className="landing-button landing-button--secondary">
                Explore Workflow <FiArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <div className="landing-hero__proof">
              <span><FiCheckCircle aria-hidden="true" /> PRISMA reporting support</span>
              <span><FiShield aria-hidden="true" /> Traceable decisions</span>
            </div>
          </div>
          <div className="landing-hero__visual">
            <ResearchPaperPreview />
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-workflow-scene" data-sc-act="flow" aria-labelledby="workflow-title">
        <div className="landing-shell">
          <div className="landing-section-heading">
            <div>
              <h2 id="workflow-title">From question to evidence.</h2>
            </div>
          <p>Follow the question from protocol to synthesis, with source records and decisions carried across each stage.</p>
          </div>
          <WorkflowTimeline />
        </div>
      </section>

      <section id="features" className="landing-capability-scene" data-sc-act="flow" aria-labelledby="capabilities-title">
        <div className="landing-shell">
          <div className="landing-section-heading landing-section-heading--compact">
            <div>
              <h2 id="capabilities-title">Decisions stay with the evidence.</h2>
            </div>
            <p>Review together, resolve differences, and keep study data structured.</p>
          </div>
          <div className="landing-capability-grid">
            <article className="landing-capability-main">
              <div className="landing-capability-main__heading">
                <span className="landing-icon-tile"><FiFilter aria-hidden="true" /></span>
                <h3>Independent review with a clear route to resolution.</h3>
            <p>Reviewers screen independently, record a reason for each decision, and resolve disagreement through a traceable consensus process.</p>
              </div>
              <ScreeningPreview />
            </article>
            <article className="landing-capability-secondary">
              <div className="landing-capability-secondary__heading">
                <span className="landing-icon-tile"><FiDatabase aria-hidden="true" /></span>
                <div><h3>Structured study evidence.</h3></div>
              </div>
              <p>Use shared fields to compare findings and connect each value to its source.</p>
              <ExtractionPreview />
            </article>
            <div className="landing-capability-note">
              <span><FiUsers aria-hidden="true" /> Collaboration</span>
              <p>Keep each reviewer decision and rationale visible when a paper reaches consensus or adjudication.</p>
            </div>
            <div className="landing-capability-note">
              <span><FiShield aria-hidden="true" /> Quality assessment</span>
              <p>Assess the quality of included studies and consider those appraisals alongside the extracted findings.</p>
            </div>
          </div>
        </div>
      </section>

      <EvidenceSpine />

      <MethodologyScene />

      <section className="landing-close-scene" data-sc-act="flow" aria-labelledby="landing-close-title">
        <div className="landing-shell landing-close-scene__inner">
          <div className="landing-close-scene__copy">
            <p className="landing-eyebrow"><FiLayers aria-hidden="true" /> YOUR NEXT REVIEW</p>
            <h2 id="landing-close-title">Bring your evidence into focus.</h2>
            <p className="landing-close-scene__description">
              Begin with a clear research question, then keep study records, screening decisions, and findings connected as your team moves toward synthesis.
            </p>
            <p className="landing-close-scene__note"><FiShield aria-hidden="true" /> A documented path from review criteria to research outputs.</p>
            <div className="landing-close-scene__actions">
              <button type="button" onClick={() => navigate(startPath)} className="landing-button landing-button--primary">
                Start a Review <FiArrowRight aria-hidden="true" />
              </button>
              <button type="button" onClick={() => navigate("/projects")} className="landing-button landing-button--secondary">
                View Projects <FiArrowUpRight aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="landing-close-scene__path" role="group" aria-labelledby="landing-close-path-title">
            <p id="landing-close-path-title" className="landing-close-scene__path-title">One connected review</p>
            <ol>
              <li>
                <span className="landing-close-scene__path-node"><FiClipboard aria-hidden="true" /></span>
                <span><b>Set the scope</b><small>Question and eligibility criteria</small></span>
              </li>
              <li>
                <span className="landing-close-scene__path-node"><FiFilter aria-hidden="true" /></span>
                <span><b>Review the studies</b><small>Records, decisions, and rationale</small></span>
              </li>
              <li>
                <span className="landing-close-scene__path-node"><FiGitMerge aria-hidden="true" /></span>
                <span><b>Bring findings together</b><small>Evidence ready for synthesis</small></span>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
