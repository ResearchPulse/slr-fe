import React from "react";
import { FiBarChart2, FiFileText, FiSearch, FiShield } from "react-icons/fi";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const workflow = [
    { number: "01", label: "Search", detail: "Bring research sources together.", icon: FiSearch },
    { number: "02", label: "Screen", detail: "Apply criteria consistently.", icon: FiShield },
    { number: "03", label: "Extract", detail: "Keep findings tied to evidence.", icon: FiFileText },
    { number: "04", label: "Synthesize", detail: "Turn results into a clear report.", icon: FiBarChart2 },
  ];

  return (
    <div className="min-h-screen w-full bg-bg-primary text-text-primary">
      <main className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(430px,0.85fr)]">
        <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#12354A] px-12 py-10 text-white lg:flex xl:px-20 xl:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-44 h-[520px] w-[520px] rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-[360px] w-[360px] rounded-full border border-white/10" />

          <div className="relative z-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-black tracking-tight text-primary">S</span>
            <div>
              <p className="text-sm font-bold tracking-[0.12em]">SLRS</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Research workbench</p>
            </div>
          </div>

          <div className="relative z-10 my-12 max-w-[660px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-500 motion-reduce:animate-none">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#86C4E8]">Systematic literature review</p>
            <h1 className="max-w-[620px] text-[42px] font-bold leading-[1.08] tracking-[-0.03em] text-white xl:text-[52px]">
              Make every research decision traceable.
            </h1>
            <p className="mt-5 max-w-[520px] text-[15px] leading-7 text-white/70">
              Plan the review, coordinate your team, and carry evidence from search through synthesis in one structured workspace.
            </p>

            <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {workflow.map(({ number, label, detail, icon: Icon }) => (
                <div key={number} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#A8D9F5]">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">{number} / {label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
            PRISMA-aligned workflow <span className="mx-2 text-white/20">·</span> Independent review <span className="mx-2 text-white/20">·</span> Clear audit trail
          </p>
        </section>

        <section className="flex min-h-screen flex-col justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">S</span>
              <div>
                <p className="text-sm font-bold tracking-[0.12em] text-text-primary">SLRS</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-secondary">Research workbench</p>
              </div>
            </div>
            {children}
            <footer className="mt-8 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-text-secondary">
              SLRS &copy; {new Date().getFullYear()}
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthLayout;
