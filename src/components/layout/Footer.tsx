import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

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
