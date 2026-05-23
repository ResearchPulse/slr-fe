import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-primary border-t border-border py-8 mt-auto">
      <div className="container mx-auto px-4">
        <p className="text-center text-text-secondary text-[11px] uppercase tracking-[0.2em] font-medium">
          © {currentYear} Systematic Review Support System
          <span className="mx-3 text-border">|</span>
          Following PRISMA Framework
        </p>
      </div>
    </footer>
  );
};

export default Footer;
