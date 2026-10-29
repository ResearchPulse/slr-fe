import React from "react";
import { FiLink2, FiHash, FiDatabase, FiCopy } from "react-icons/fi";
import { Sparkles } from "lucide-react";
import type { ScreeningPaper } from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";

interface IdentifierSectionProps {
  paper: ScreeningPaper;
  isFieldUpdated: (f: string) => boolean;
  variant?: "card" | "embedded";
}

export const IdentifierSection: React.FC<IdentifierSectionProps> = ({
  paper,
  isFieldUpdated,
  variant = "card",
}) => {
  const identifiers = [
    {
      label: "DOI",
      value: paper.doi,
      icon: <FiLink2 className="w-3.5 h-3.5" />,
      isUpdated: isFieldUpdated("DOI"),
    },
    {
      label: "ISSN",
      value: paper.journalIssn,
      icon: <FiHash className="w-3.5 h-3.5" />,
      isUpdated: isFieldUpdated("ISSN"),
    },
    {
      label: "E-ISSN",
      value: paper.journalEIssn,
      icon: <FiHash className="w-3.5 h-3.5" />,
      isUpdated: isFieldUpdated("E-ISSN"),
    },
    {
      label: "MD5",
      value: paper.md5,
      icon: <FiDatabase className="w-3.5 h-3.5" />,
      isUpdated: isFieldUpdated("Md5"),
    },
  ].filter((i) => i.value);

  if (identifiers.length === 0) return null;

  return (
    <section className={variant === "embedded" ? "px-4 py-4 sm:px-5" : "rounded-xl border border-border bg-surface-white p-4 sm:p-5"}>
      <h2 className="mb-3 text-sm font-semibold text-text-primary">
        Unique Identifiers
      </h2>
      <dl className="space-y-2.5">
        {identifiers.map((item) => (
          <div
            key={item.label}
            className="group/item flex min-w-0 items-center justify-between gap-2"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary transition-colors group-hover/item:text-primary motion-reduce:transition-none">
                {item.icon}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <dt className="text-[11px] font-medium text-text-secondary">
                    {item.label}
                  </dt>
                  {item.isUpdated && (
                    <div className="group/spark relative flex items-center">
                      <Sparkles className="w-2.5 h-2.5 text-accent" />
                      <div className="absolute left-full ml-2 px-2 py-1 bg-text-primary text-surface-white text-[9px] font-black uppercase tracking-[0.1em] rounded-xl opacity-0 group-hover/spark:opacity-100 transition-opacity whitespace-nowrap z-(--z-index-tooltip) pointer-events-none shadow-none border border-white/10 backdrop-blur-md">
                        Suggested applied
                      </div>
                    </div>
                  )}
                </div>
                <dd className="break-all text-xs font-mono text-text-primary">
                  {item.value}
                </dd>
              </div>
            </div>
            {item.label === "DOI" && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(item.value!)}
                className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
                aria-label="Copy DOI"
                title="Copy DOI"
              >
                <FiCopy className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
};
