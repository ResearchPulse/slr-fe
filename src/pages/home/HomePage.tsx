import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiLayers,
  FiBookOpen,
  FiCpu,
  FiUsers,
  FiShield
} from "react-icons/fi";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "../../components/ui/Button";
import PrismaStep from "../../components/home/PrismaStep";
import FlowArrow from "../../components/home/FlowArrow";

gsap.registerPlugin(ScrollTrigger);

function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const prismaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Text Animation
      gsap.from(".hero-content > *", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        stagger: 0.15,
        ease: "power2.out"
      });

      // PRISMA Process Sequential Animation
      const prismaTl = gsap.timeline({ delay: 0.5 });

      const steps = gsap.utils.toArray("[data-prisma-step]");
      const arrows = gsap.utils.toArray("[data-flow-arrow]");

      steps.forEach((step, i) => {
        prismaTl.to(step as Element, {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out"
        });

        if (i < arrows.length) {
          prismaTl.to(arrows[i] as Element, {
            opacity: 1,
            duration: 0.25,
            ease: "power2.inOut"
          }, "-=0.15");
        }
      });

      // Features Scroll Animation
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        },
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out"
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const prismaSteps = [
    { icon: FiSearch, label: "Identification", number: "01", description: "Search across multiple databases" },
    { icon: FiFilter, label: "Screening", number: "02", description: "Filter by title and abstract" },
    { icon: FiCheckCircle, label: "Eligibility", number: "03", description: "Full-text assessment" },
    { icon: FiLayers, label: "Included", number: "04", description: "Synthesized for analysis" },
  ];

  const coreFeatures = [
    { title: "Justification & Governance", icon: FiBookOpen, desc: "Step-by-step guidance for project justification and governance management." },
    { title: "Smart Screening", icon: FiCpu, desc: "AI-assisted screening tools to accelerate study selection." },
    { title: "Team Collaboration", icon: FiUsers, desc: "Real-time multi-reviewer support with conflict resolution." },
    { title: "Data Integrity", icon: FiShield, desc: "Secure data extraction and reproduction-ready logs." },
  ];

  return (
    <div className="bg-[#F4F0E8] min-h-screen font-sans" ref={heroRef}>
      {/* ── Hero Section ── */}
      <section className="relative pt-24 pb-28 overflow-hidden border-b border-[#D8D2C8]">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <div className="max-w-3xl mx-auto text-center hero-content mb-20">
            {/* Eyebrow label */}
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#5C5C5C] mb-8">
              Systematic Review Platform
            </p>

            {/* H1 — Editorial serif */}
            <h1 className="font-cormorant text-[48px] sm:text-[72px] lg:text-[88px] font-normal leading-[0.95] tracking-[-0.02em] text-[#111111] mb-8">
              Empowering<br />
              <span className="italic">Research Excellence</span>
            </h1>

            <p className="text-[18px] leading-[1.8] text-[#5C5C5C] max-w-xl mx-auto mb-10">
              A comprehensive platform for researchers to conduct systematic literature reviews
              with transparency, reproducibility, and academic integrity.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="min-h-[44px] px-8"
                onClick={() => navigate("/projects")}
              >
                Manage Projects
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="min-h-[44px] px-8"
                onClick={() => window.scrollTo({ top: 800, behavior: "smooth" })}
              >
                Explore Process
              </Button>
            </div>
          </div>

          {/* PRISMA Flow Diagram */}
          <div className="max-w-5xl mx-auto" ref={prismaRef}>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-0 bg-[#ECE8E1] p-8 border border-[#D8D2C8]">
              {prismaSteps.map((step, index) => (
                <div key={step.label} className="flex flex-col lg:flex-row items-center">
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
            <p className="text-center mt-6 text-[11px] text-[#5C5C5C] uppercase tracking-[0.25em]">
              Standardized PRISMA 2020 Workflow Visualization
            </p>
          </div>
        </div>
      </section>

      {/* ── Core Features Grid ── */}
      <section className="py-28 container mx-auto px-4 max-w-[1200px]" ref={featuresRef}>
        <div className="max-w-2xl mb-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#5C5C5C] mb-4">Capabilities</p>
          <h2 className="font-cormorant text-[48px] font-normal text-[#111111] leading-tight mb-4">
            System Infrastructure
          </h2>
          <p className="text-[#5C5C5C] text-[16px] leading-[1.7]">
            Built to handle high-volume data extraction and synthesis while maintaining
            strict adherence to international research standards.
          </p>
        </div>

        {/* Editorial list divider style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0">
          {coreFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`feature-card p-8 border-[#D8D2C8] hover:bg-[#ECE8E1] transition-colors duration-200 ${
                index > 0 ? "border-l" : ""
              } border-t`}
            >
              <div className="w-10 h-10 border border-[#D8D2C8] flex items-center justify-center text-[#5C5C5C] mb-6">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-[13px] font-medium text-[#111111] uppercase tracking-[0.1em] mb-3">
                {feature.title}
              </h3>
              <p className="text-[14px] text-[#5C5C5C] leading-[1.7]">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Bottom Section ── */}
      <section className="pb-28 container mx-auto px-4 max-w-[1200px]">
        <div className="bg-[#111111] p-16 lg:p-24 text-center text-[#F4F0E8] relative overflow-hidden">
          <h2 className="font-cormorant text-[48px] lg:text-[64px] font-normal mb-8 leading-tight">
            Engineered for<br />
            <span className="italic">Academic Rigor</span>
          </h2>
          <p className="text-[#F4F0E8]/60 text-[16px] max-w-2xl mx-auto leading-[1.8] mb-2">
            "Transparency and reproducibility are the twin pillars of scientific credibility.
            PRISMA SLR provides the digital scaffolding to uphold them."
          </p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
