import React from "react";
import { Link, useLocation } from "react-router-dom";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const isLandingPage = useLocation().pathname === "/";

  if (isLandingPage) {
    return (
      <footer className="border-t border-[#DCE6EC] bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <Link to="/" className="group inline-flex flex-col items-start">
            <span className="text-[19px] font-extrabold tracking-[0.06em] text-[#102B3D]">SLR<span className="text-primary">S</span></span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#7B8C97]">Systematic Literature Review System</span>
          </Link>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-semibold text-[#647885]">
            <Link className="transition hover:text-primary" to="/projects">Projects</Link>
            <a className="transition hover:text-primary" href="/#workflow">Workflow</a>
            <a className="transition hover:text-primary" href="https://www.prisma-statement.org/" target="_blank" rel="noreferrer">Documentation</a>
          </nav>
          <div className="md:text-right">
            <p className="text-[10px] font-semibold text-[#506977]">Following the PRISMA 2020 framework</p>
            <p className="mt-1.5 text-[10px] text-[#8A9AA4]">© {currentYear} SLRS</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-surface-white border-t border-border py-10 mt-auto">
      <div className="container mx-auto px-5 sm:px-8 lg:px-12">
        <p className="text-center text-text-muted text-[13px] tracking-[0.05em]">
          © {currentYear} Systematic Review Support System
          <span className="mx-3 text-border">|</span>
          Following PRISMA Framework
        </p>
      </div>
    </footer>
  );
};

export default Footer;
