import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { SynthesisThemeDto } from "../../../types/synthesisExecution";

interface EvidenceMatrixViewProps {
  themes: SynthesisThemeDto[];
}

function getThemeColor(theme: SynthesisThemeDto): string {
  return theme.colorCode ?? "#2563eb";
}

export default function EvidenceMatrixView({ themes }: EvidenceMatrixViewProps) {
  const paperTitles = React.useMemo(() => {
    const titles = new Set<string>();

    for (const theme of themes) {
      for (const evidence of theme.evidences) {
        if (evidence.paperTitle.trim()) {
          titles.add(evidence.paperTitle.trim());
        }
      }
    }

    return Array.from(titles).sort((left, right) => left.localeCompare(right));
  }, [themes]);

  const matrixRows = React.useMemo(() => {
    return themes.map((theme) => {
      const evidencePaperTitles = new Set(theme.evidences.map((evidence) => evidence.paperTitle.trim()));

      return {
        theme,
        evidencePaperTitles,
      };
    });
  }, [themes]);

  if (themes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        No themes available for evidence matrix rendering.
      </div>
    );
  }

  if (paperTitles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        No evidence papers available to build the matrix.
      </div>
    );
  }

  const totalEvidenceLinks = themes.reduce((total, theme) => total + theme.evidences.length, 0);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          {themes.length} themes
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          {paperTitles.length} papers
        </span>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          {totalEvidenceLinks} links
        </span>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[75vh] rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-max border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th
              className="sticky left-0 top-0 z-30 border-b border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm"
              scope="col"
            >
              Theme / Paper
            </th>
            {paperTitles.map((paperTitle) => (
              <th
                key={paperTitle}
                className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm"
                scope="col"
              >
                <span className="block min-w-40 max-w-64 truncate">{paperTitle}</span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {matrixRows.map(({ theme, evidencePaperTitles }) => {
            const themeColor = getThemeColor(theme);

            return (
              <tr key={theme.id} className="group hover:bg-slate-50/50">
                <th
                  className="sticky left-0 z-10 border-b border-slate-100 bg-white px-4 py-3 text-left font-medium text-slate-900 group-hover:bg-slate-50/50"
                  scope="row"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: themeColor }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate">{theme.name}</p>
                      {theme.description ? <p className="mt-0.5 truncate text-xs text-slate-500">{theme.description}</p> : null}
                    </div>
                  </div>
                </th>

                {paperTitles.map((paperTitle) => {
                  const hasEvidence = evidencePaperTitles.has(paperTitle);

                  return (
                    <td key={`${theme.id}-${paperTitle}`} className="border-b border-slate-100 px-4 py-3 text-center align-middle">
                      {hasEvidence ? (
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                          style={{ color: themeColor, backgroundColor: `${themeColor}14` }}
                          title={`${theme.name} has evidence from ${paperTitle}`}
                          aria-label={`${theme.name} has evidence from ${paperTitle}`}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                      ) : (
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300"
                          title={`${theme.name} has no evidence from ${paperTitle}`}
                          aria-label={`${theme.name} has no evidence from ${paperTitle}`}
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden="true" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}