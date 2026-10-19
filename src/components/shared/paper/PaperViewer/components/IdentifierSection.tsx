import React from "react";
import { FiLink2, FiHash, FiDatabase, FiCopy } from "react-icons/fi";
import { Sparkles } from "lucide-react";
import type { ScreeningPaper } from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";

interface IdentifierSectionProps {
  paper: ScreeningPaper;
  isFieldUpdated: (f: string) => boolean;
}

export const IdentifierSection: React.FC<IdentifierSectionProps> = ({
  paper,
  isFieldUpdated,
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
    <div className="bg-surface-white rounded-xl border border-border p-6 shadow-none">
      <h2 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-6">
        Unique Identifiers
      </h2>
      <div className="space-y-4">
        {identifiers.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between group/item"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-bg-secondary flex items-center justify-center text-text-secondary group-hover/item:bg-primary-light group-hover/item:text-accent transition-colors">
                {item.icon}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                    {item.label}
                  </span>
                  {item.isUpdated && (
                    <div className="group/spark relative flex items-center">
                      <Sparkles className="w-2.5 h-2.5 text-accent" />
                      <div className="absolute left-full ml-2 px-2 py-1 bg-text-primary text-surface-white text-[9px] font-black uppercase tracking-[0.1em] rounded-xl opacity-0 group-hover/spark:opacity-100 transition-opacity whitespace-nowrap z-(--z-index-tooltip) pointer-events-none shadow-none border border-white/10 backdrop-blur-md">
                        Suggested applied
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs font-mono font-bold text-text-secondary truncate max-w-[200px]">
                  {item.value}
                </p>
              </div>
            </div>
            {item.label === "DOI" && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(item.value!)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-secondary opacity-100 transition-colors hover:bg-bg-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:opacity-0 sm:group-hover/item:opacity-100 motion-reduce:transition-none"
                aria-label="Copy DOI"
                title="Copy DOI"
              >
                <FiCopy className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
