import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-bg-primary">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md mx-auto">{children}</div>
      </div>

      {/* Footer */}
      <footer className="pb-8 text-center text-text-secondary text-[10px] uppercase tracking-[0.2em]">
        SLRS &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default AuthLayout;
