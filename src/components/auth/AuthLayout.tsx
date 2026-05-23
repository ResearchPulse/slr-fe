import React from "react";
import SystemSignature from "../logo/SystemSignature";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full relative flex flex-col bg-bg-primary">
      {/* Subtle Editorial Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Faint radial gradients for warmth */}
        <div className="absolute top-0 right-0 w-[60vw] h-[60vh] bg-[radial-gradient(circle_at_top_right,rgba(91,0,0,0.015),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.01),transparent_50%)]" />
      </div>

      {/* Header/Branding - Standard Container */}
      <header className="relative z-20 w-full pt-10 lg:pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center lg:justify-start">
          <Link to="/" className="inline-flex">
            <SystemSignature />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-1000 ease-out">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-20 pb-8 text-center text-text-secondary text-[10px] uppercase tracking-[0.2em]">
        SLRS &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default AuthLayout;
