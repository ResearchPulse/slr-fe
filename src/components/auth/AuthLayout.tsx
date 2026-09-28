import React from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-bg-primary">
      {/* Branding */}
      <header className="w-full pt-10 lg:pt-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <Link
            to="/"
            className="inline-flex flex-col items-center group"
            aria-label="ResearchPulse home"
          >
            <span className="font-cormorant text-[28px] lg:text-[30px] leading-none tracking-[0.08em] font-medium text-text-primary group-hover:text-accent transition-colors">
              Research<span className="italic text-accent">Pulse</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-text-secondary mt-1.5">
              Systematic Literature Review
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md mx-auto">{children}</div>
      </div>

      {/* Footer */}
      <footer className="pb-8 text-center text-text-secondary text-[10px] uppercase tracking-[0.2em]">
        ResearchPulse &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default AuthLayout;
