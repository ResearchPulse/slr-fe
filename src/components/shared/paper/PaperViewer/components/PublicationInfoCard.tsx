import React from "react";
import { Sparkles } from "lucide-react";
import type { ScreeningPaper } from "../../../../../pages/reviewProcess/studySelection/titleAbstractScreening/types";

interface PublicationInfoCardProps {
  paper: ScreeningPaper;
  isFieldUpdated: (f: string) => boolean;
  variant?: "card" | "embedded";
}

export const PublicationInfoCard: React.FC<PublicationInfoCardProps> = ({
  paper,
  isFieldUpdated,
  variant = "card",
}) => {
  const fields = [
    {
      label: "Journal",
      value: paper.journal,
      isUpdated: isFieldUpdated("Journal"),
      wide: true,
    },
    {
      label: "Conference",
      value: paper.conferenceName,
      isUpdated: isFieldUpdated("Conference"),
      wide: true,
    },
    {
      label: "Publisher",
      value: paper.publisher,
      isUpdated: isFieldUpdated("Publisher"),
      wide: true,
    },
    {
      label: "Volume",
      value: paper.volume,
      isUpdated: isFieldUpdated("Volume"),
    },
    { label: "Issue", value: paper.issue, isUpdated: isFieldUpdated("Issue") },
    { label: "Pages", value: paper.pages, isUpdated: isFieldUpdated("Pages") },
    {
      label: "Pub. Date",
      value: paper.publicationDate,
      isUpdated: isFieldUpdated("publicationDate"),
    },
    {
      label: "Language",
      value: paper.language,
      isUpdated: isFieldUpdated("Language"),
    },
    { label: "Pub. Type", value: paper.publicationType, isUpdated: false },
  ].filter((f) => f.value);

  if (fields.length === 0) return null;

  return (
    <section className={variant === "embedded" ? "px-4 py-4 sm:px-5" : "rounded-xl border border-border bg-surface-white p-4 sm:p-5"}>
      <h2 className="mb-3 text-sm font-semibold text-text-primary">
        Publication Details
      </h2>
      <dl className={`grid gap-x-4 gap-y-3 ${variant === "embedded" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
        {fields.map((field) => (
          <div key={field.label} className={`min-w-0 space-y-0.5 ${variant === "embedded" && "wide" in field && field.wide ? "col-span-2" : ""}`}>
            <div className="flex items-center gap-2">
              <dt className="text-[11px] font-medium text-text-secondary">
                {field.label}
              </dt>
              {field.isUpdated && (
                <div className="group/spark relative flex items-center">
                  <Sparkles className="w-2.5 h-2.5 text-accent" />
                  <div className="absolute left-full ml-2 px-2 py-1 bg-text-primary text-surface-white text-[9px] font-black uppercase tracking-[0.1em] rounded-xl opacity-0 group-hover/spark:opacity-100 transition-opacity whitespace-nowrap z-(--z-index-tooltip) pointer-events-none shadow-none border border-white/10 backdrop-blur-md">
                    Suggested applied
                  </div>
                </div>
              )}
            </div>
            <dd className="break-words text-sm font-medium leading-5 text-text-primary">
              {field.value || "N/A"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
