import React, { useEffect, useId, useRef, useState } from "react";
import { FiChevronDown, FiChevronUp, FiFileText, FiTag } from "react-icons/fi";
import { Sparkles } from "lucide-react";
import type { PaperDetailsResponse } from "../../../../../types/paper";

interface ContentSectionProps {
  paper: PaperDetailsResponse;
  isFieldUpdated: (f: string) => boolean;
  collapsibleAbstract?: boolean;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  paper,
  isFieldUpdated,
  collapsibleAbstract = false,
}) => {
  const abstractRef = useRef<HTMLParagraphElement>(null);
  const abstractId = useId();
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);
  const [canExpandAbstract, setCanExpandAbstract] = useState(false);

  useEffect(() => {
    if (!collapsibleAbstract) return;
    setIsAbstractExpanded(false);
  }, [paper.id, collapsibleAbstract]);

  useEffect(() => {
    if (!collapsibleAbstract) return;
    const paragraph = abstractRef.current;
    if (!paragraph) return;
    if (isAbstractExpanded) {
      setCanExpandAbstract(true);
      return;
    }

    const measureOverflow = () => {
      setCanExpandAbstract(paragraph.scrollHeight > paragraph.clientHeight + 1);
    };

    measureOverflow();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measureOverflow);
      if (paragraph.parentElement) observer.observe(paragraph.parentElement);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", measureOverflow);
    return () => window.removeEventListener("resize", measureOverflow);
  }, [paper.abstract, isAbstractExpanded, collapsibleAbstract]);

  return (
    <article className="rounded-xl border border-border bg-surface-white p-4 sm:p-5 lg:p-6">
      <div className="space-y-5">
        {/* Abstract */}
        <section aria-labelledby="paper-abstract-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="paper-abstract-heading" className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <FiFileText className="h-4 w-4 text-primary" aria-hidden="true" />
              Abstract
            </h2>
            {isFieldUpdated("Abstract") && (
              <div className="group/spark relative flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-text-primary text-surface-white text-[9px] font-black uppercase tracking-[0.1em] rounded-xl opacity-0 group-hover/spark:opacity-100 transition-opacity whitespace-nowrap z-(--z-index-tooltip) pointer-events-none shadow-none border border-white/10 backdrop-blur-md">
                  Suggested fields applied
                </div>
              </div>
            )}
          </div>
          {paper.abstract ? (
            <p
              id={abstractId}
              ref={abstractRef}
              className={`text-[15px] leading-7 font-normal text-text-primary selection:bg-primary-light [text-wrap:pretty] ${collapsibleAbstract && !isAbstractExpanded ? "max-h-[10.5rem] max-w-[92ch] overflow-hidden" : "max-w-[72ch]"}`}
            >
              {paper.abstract}
            </p>
          ) : (
            <p className="rounded-lg bg-warning/10 px-3.5 py-3 text-sm leading-6 text-warning">
              Missing abstract. Review this record with caution or add metadata when available.
            </p>
          )}
          {collapsibleAbstract && canExpandAbstract && paper.abstract && (
            <button
              type="button"
              aria-expanded={isAbstractExpanded}
              aria-controls={abstractId}
              onClick={() => setIsAbstractExpanded((expanded) => !expanded)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              {isAbstractExpanded ? "Show less" : "Show full abstract"}
              {isAbstractExpanded ? (
                <FiChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <FiChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </section>

        {/* Keywords */}
        {paper.keywords && (
          <section aria-labelledby="paper-keywords-heading" className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <h2 id="paper-keywords-heading" className="text-sm font-semibold text-text-primary">
                Keywords
              </h2>
              {isFieldUpdated("Keywords") && (
                <div className="group/spark relative flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-text-primary text-surface-white text-[9px] font-black uppercase tracking-[0.1em] rounded-xl opacity-0 group-hover/spark:opacity-100 transition-opacity whitespace-nowrap z-(--z-index-tooltip) pointer-events-none shadow-none border border-white/10 backdrop-blur-md">
                    Suggested fields applied
                  </div>
                </div>
              )}
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {paper.keywords.split(/[;,]/).map((kw, i) => (
                <li
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-md bg-bg-secondary px-2.5 py-1.5 text-xs font-medium text-text-secondary"
                >
                  <FiTag className="h-3 w-3 text-primary" aria-hidden="true" />
                  {kw.trim()}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Conference Info */}
        {paper.conferenceName && (
          <section aria-labelledby="paper-conference-heading" className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <h2 id="paper-conference-heading" className="text-sm font-semibold text-text-primary">
                Conference Information
              </h2>
              {isFieldUpdated("ConferenceName") && (
                <div className="group/spark relative flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-text-primary text-surface-white text-[9px] font-black uppercase tracking-[0.1em] rounded-xl opacity-0 group-hover/spark:opacity-100 transition-opacity whitespace-nowrap z-(--z-index-tooltip) pointer-events-none shadow-none border border-white/10 backdrop-blur-md">
                    Suggested fields applied
                  </div>
                </div>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <dt className="text-xs font-medium text-text-secondary">Conference</dt>
                <dd className="break-words text-sm font-medium text-text-primary">{paper.conferenceName}</dd>
              </div>
              {paper.conferenceLocation && <div className="space-y-1">
                <dt className="text-xs font-medium text-text-secondary">Location</dt>
                <dd className="break-words text-sm font-medium text-text-primary">{paper.conferenceLocation}</dd>
              </div>}
              {paper.conferenceCountry && <div className="space-y-1">
                <dt className="text-xs font-medium text-text-secondary">Country</dt>
                <dd className="break-words text-sm font-medium text-text-primary">{paper.conferenceCountry}</dd>
              </div>}
              {paper.conferenceYear && <div className="space-y-1">
                <dt className="text-xs font-medium text-text-secondary">Year</dt>
                <dd className="break-words text-sm font-medium text-text-primary">{paper.conferenceYear}</dd>
              </div>}
            </dl>
          </section>
        )}
      </div>
    </article>
  );
};
