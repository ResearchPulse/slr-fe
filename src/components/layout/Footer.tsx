import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const isLandingPage = useLocation().pathname === "/";
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (isLandingPage) {
    return (
      <footer className="border-t border-border bg-surface-white">
        <div className="mx-auto grid w-full max-w-[1360px] grid-cols-2 gap-x-5 gap-y-6 px-5 py-8 sm:px-8 md:gap-8 lg:gap-10 lg:px-10 xl:grid-cols-[1.4fr_0.8fr_1fr_0.9fr] xl:px-12">
          <div className="col-span-2 xl:col-span-1">
            <Link to="/" className="inline-flex min-h-11 flex-col items-start justify-center">
              <img src="/brand/logo-horizontal.png" alt="SLRS" className="h-8 w-auto select-none" draggable={false} />
              <span className="mt-1 text-xs text-text-secondary">Systematic Literature Review System</span>
            </Link>
          </div>

          <nav aria-label="Explore SLRS" className="flex flex-col items-start gap-1.5">
            <h2 className="mb-1 text-sm font-semibold text-text-primary">Explore</h2>
            <Link className="inline-flex min-h-8 items-center text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none" to="/projects">Projects</Link>
            <a className="inline-flex min-h-8 items-center text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none" href="#workflow">Workflow</a>
            <a className="inline-flex min-h-8 items-center text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none" href="#features">Capabilities</a>
            <a className="inline-flex min-h-8 items-center text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none" href="#about">About</a>
          </nav>

          <nav aria-label="Research resources" className="flex flex-col items-start gap-1.5">
            <h2 className="mb-1 text-sm font-semibold text-text-primary">Resources</h2>
            <a className="inline-flex min-h-8 items-center text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none" href="https://www.prisma-statement.org/" target="_blank" rel="noreferrer">PRISMA 2020 statement</a>
            <Link className="inline-flex min-h-8 items-center text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none" to="/auth/policy">Privacy policy</Link>
          </nav>

          <nav aria-label="Workspace" className="col-span-2 flex flex-col items-start gap-1.5 md:col-span-1">
            <h2 className="mb-1 text-sm font-semibold text-text-primary">Workspace</h2>
            <Link className="inline-flex min-h-8 items-center text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none" to={isAuthenticated ? "/projects" : "/auth/signin"}>Start a review</Link>
            <Link className="inline-flex min-h-8 items-center text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none" to="/projects">View projects</Link>
          </nav>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-1 px-5 py-3 text-xs leading-5 text-text-secondary sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10 xl:px-12">
            <p>&copy; {currentYear} Systematic Literature Review System</p>
            <p>PRISMA 2020 reporting support</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-border bg-surface-white py-4 sm:py-5">
      <div className="container mx-auto px-5 sm:px-8 lg:px-12">
        <p className="text-center text-[11px] tracking-[0.04em] text-text-muted sm:text-xs">
          &copy; {currentYear} Systematic Review Support System
          <span className="mx-3 text-border">|</span>
          Following PRISMA Framework
        </p>
      </div>
    </footer>
  );
};

export default Footer;
