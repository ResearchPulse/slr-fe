import { useNavigate } from "react-router";
import {
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiLayers,
  FiBookOpen,
  FiCpu,
  FiUsers,
  FiShield,
} from "react-icons/fi";
import Button from "../../components/ui/Button";
import PrismaStep from "../../components/home/PrismaStep";
import FlowArrow from "../../components/home/FlowArrow";

function HomePage() {
  const navigate = useNavigate();

  const prismaSteps = [
    {
      icon: FiSearch,
      label: "Identification",
      number: "01",
      description: "Search across multiple databases",
    },
    {
      icon: FiFilter,
      label: "Screening",
      number: "02",
      description: "Filter by title and abstract",
    },
    {
      icon: FiCheckCircle,
      label: "Eligibility",
      number: "03",
      description: "Full-text assessment",
    },
    {
      icon: FiLayers,
      label: "Included",
      number: "04",
      description: "Synthesized for analysis",
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
      <section className="pt-20 pb-16 lg:pt-28 lg:pb-24 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-6">
              Systematic Literature Review System
            </p>

            <h1 className="font-cormorant text-[40px] sm:text-[56px] lg:text-[64px] font-normal leading-[1.05] tracking-tight text-text-primary mb-6">
              Systematic reviews,
              <br />
              <span className="italic">done properly</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-text-secondary max-w-xl mx-auto mb-10">
              Search, screen, extract, and report with a workflow built on the
              PRISMA 2020 standard — transparent, reproducible, and
              collaborative.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="min-h-[44px] px-8"
                onClick={() => navigate("/projects")}
              >
                Get Started
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="min-h-[44px] px-8"
                onClick={() => navigate("/auth/signin")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRISMA Workflow ── */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
          <div className="text-center mb-10">
            <h2 className="font-cormorant text-[32px] sm:text-[40px] font-normal text-text-primary leading-tight mb-3">
              A standardized workflow
            </h2>
            <p className="text-text-secondary text-[15px] leading-relaxed max-w-xl mx-auto">
              Every project follows the four PRISMA 2020 stages, so your review
              stays transparent and reproducible from search to synthesis.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-0 bg-bg-secondary p-6 sm:p-8 border border-border">
              {prismaSteps.map((step, index) => (
                <div
                  key={step.label}
                  className="flex flex-col lg:flex-row items-center"
                >
                  <PrismaStep
                    icon={step.icon}
                    label={step.label}
                    number={step.number}
                    description={step.description}
                    isActive={index === 3}
                  />
                  {index < prismaSteps.length - 1 && <FlowArrow />}
                </div>
              ))}
            </div>
            <p className="text-center mt-6 text-[11px] text-text-secondary uppercase tracking-[0.25em]">
              PRISMA 2020 Workflow
            </p>
          </div>
        </div>
      </section>

      {/* ── Core Features ── */}
      <section className="py-16 lg:py-24 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
          <div className="max-w-2xl mb-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-4">
              Capabilities
            </p>
            <h2 className="font-cormorant text-[32px] sm:text-[40px] font-normal text-text-primary leading-tight mb-4">
              Built for research teams
            </h2>
            <p className="text-text-secondary text-[15px] leading-relaxed">
              Everything you need to conduct a rigorous systematic literature
              review, from protocol to final report.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coreFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-6 border border-border bg-surface-white"
              >
                <div className="w-10 h-10 border border-border flex items-center justify-center text-text-secondary mb-5">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-[12px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">
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
      <section className="pb-20 lg:pb-28 pt-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
          <div className="bg-text-primary px-8 py-14 lg:py-20 text-center text-bg-primary">
            <h2 className="font-cormorant text-[32px] sm:text-[44px] font-normal mb-5 leading-tight">
              Start your next review
            </h2>
            <p className="text-bg-primary/60 text-[15px] max-w-xl mx-auto leading-relaxed mb-8">
              Set up a project, invite your team, and follow the PRISMA
              workflow from identification to synthesis.
            </p>
            <button
              onClick={() => navigate("/auth/signin")}
              className="min-h-[44px] px-8 rounded-[4px] uppercase tracking-[0.1em] font-medium text-[13px] border border-bg-primary/40 text-bg-primary hover:bg-bg-primary/10 transition-colors duration-200"
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
