import { useNavigate } from "react-router";
import {
  FiSearch,
  FiFilter,
  FiFileText,
  FiLayers,
  FiBookOpen,
  FiCpu,
  FiUsers,
  FiShield,
} from "react-icons/fi";
import Button from "../../components/ui/Button";
import PrismaStep from "../../components/home/PrismaStep";

function HomePage() {
  const navigate = useNavigate();

  const workflowStages = [
    {
      icon: FiSearch,
      label: "Search",
      number: "01",
      description: "Collect studies from multiple sources.",
    },
    {
      icon: FiFilter,
      label: "Screen",
      number: "02",
      description: "Review and classify relevant records.",
    },
    {
      icon: FiFileText,
      label: "Extract",
      number: "03",
      description: "Capture structured evidence.",
    },
    {
      icon: FiLayers,
      label: "Report",
      number: "04",
      description: "Build a transparent review process.",
    },
  ];

  const coreFeatures = [
    {
      title: "Justification & Governance",
      icon: FiBookOpen,
      desc: "Step-by-step guidance for project justification and governance management.",
    },
    {
      title: "Smart Screening",
      icon: FiCpu,
      desc: "AI-assisted screening tools to accelerate study selection.",
    },
    {
      title: "Team Collaboration",
      icon: FiUsers,
      desc: "Real-time multi-reviewer support with conflict resolution.",
    },
    {
      title: "Data Integrity",
      icon: FiShield,
      desc: "Secure data extraction and reproduction-ready logs.",
    },
  ];

  return (
    <div className="bg-bg-primary min-h-screen font-sans">
      {/* ── Hero Section ── */}
      <section className="pt-20 pb-20 lg:pt-32 lg:pb-28 border-b border-border">
        <div className="container mx-auto px-5 sm:px-8 lg:px-12 max-w-[1200px]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-7">
              Systematic Literature Review System
            </p>

            <h1 className="text-[38px] sm:text-[52px] lg:text-[64px] xl:text-[72px] font-semibold leading-[1.06] tracking-[-0.02em] text-text-primary mb-7">
              Systematic reviews,
              <br />
              <span className="text-primary">done properly</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-text-secondary max-w-xl mx-auto mb-12">
              Search, screen, extract, and report with a workflow built on the
              PRISMA 2020 standard — transparent, reproducible, and
              collaborative.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto min-w-[180px]"
                onClick={() => navigate("/projects")}
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-w-[180px]"
                onClick={() => navigate("/auth/signin")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-5 sm:px-8 lg:px-12 max-w-[1200px]">
          <div className="text-center mb-14">
            <h2 className="text-[28px] sm:text-[32px] font-semibold text-text-primary leading-tight mb-4 tracking-[-0.01em]">
              A standardized workflow
            </h2>
            <p className="text-text-secondary text-base leading-relaxed max-w-xl mx-auto">
              Every project follows the four PRISMA 2020 stages, so your review
              stays transparent and reproducible from search to synthesis.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowStages.map((stage) => (
              <PrismaStep
                key={stage.label}
                icon={stage.icon}
                label={stage.label}
                number={stage.number}
                description={stage.description}
              />
            ))}
          </div>

          <p className="text-center mt-10 text-[11px] text-text-muted uppercase tracking-[0.25em]">
            PRISMA 2020 Workflow
          </p>
        </div>
      </section>

      {/* ── Core Features ── */}
      <section className="py-20 lg:py-28 border-t border-border">
        <div className="container mx-auto px-5 sm:px-8 lg:px-12 max-w-[1200px]">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-5">
              Capabilities
            </p>
            <h2 className="text-[28px] sm:text-[32px] font-semibold text-text-primary leading-tight mb-5 tracking-[-0.01em]">
              Built for research teams
            </h2>
            <p className="text-text-secondary text-base leading-relaxed">
              Everything you need to conduct a rigorous systematic literature
              review, from protocol to final report.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {coreFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-7 border border-border bg-surface-white rounded-[16px] shadow-[0_1px_2px_rgba(18,35,49,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-text-muted/60"
              >
                <div className="w-11 h-11 rounded-[10px] bg-soft-blue text-primary flex items-center justify-center mb-6">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="pb-24 lg:pb-32 pt-4">
        <div className="container mx-auto px-5 sm:px-8 lg:px-12 max-w-[1200px]">
          <div className="bg-text-primary rounded-[20px] px-8 py-16 lg:py-24 text-center text-white">
            <h2 className="text-[30px] sm:text-[40px] font-semibold mb-6 leading-tight tracking-[-0.01em]">
              Start your next review
            </h2>
            <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
              Set up a project, invite your team, and follow the PRISMA
              workflow from identification to synthesis.
            </p>
            <button
              onClick={() => navigate("/auth/signin")}
              className="min-h-[52px] px-10 rounded-[10px] uppercase tracking-[0.12em] font-medium text-[13px] border border-white/40 text-white hover:bg-white/10 hover:-translate-y-[1px] active:translate-y-0 transition-[color,background-color,border-color,transform] duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
