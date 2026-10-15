import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiFileText, FiLock, FiTarget, FiTrash2 } from "react-icons/fi";
import type { ResearchQuestion } from "../../../../../types/coreAndGovernance";
import type { WizardSection } from "../../../../../types/templateWizard";

interface Step1_OverviewProps {
  sections: WizardSection[];
  completedSections: string[];
  sectionFieldCounts: Record<string, number>;
  onSetupSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  isViewOnly?: boolean;
  researchQuestions?: ResearchQuestion[];
  isGuidedGenerationLoading?: boolean;
  guidedGenerationError?: string | null;
}

function getDisplaySectionName(section: WizardSection) {
  return section.name.replace(/^(RQ\d+\s*:\s*)+/i, "$1");
}

export default function Step1_Overview({
  sections,
  completedSections,
  sectionFieldCounts,
  onSetupSection,
  onDeleteSection,
  isViewOnly = false,
  researchQuestions = [],
  isGuidedGenerationLoading = false,
  guidedGenerationError = null,
}: Step1_OverviewProps) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const [sectionToDelete, setSectionToDelete] = useState<WizardSection | null>(null);

  useEffect(() => {
    if (!sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0]?.id ?? "");
    }
  }, [activeSectionId, sections]);

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId, sections],
  );
  const configuredCount = sections.filter((section) => completedSections.includes(section.id)).length;
  const activeQuestion = activeSection?.linkedResearchQuestionId
    ? researchQuestions.find((question) => question.researchQuestionId === activeSection.linkedResearchQuestionId)
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">Configure sections</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Review the protocol sections and manage extraction fields for each one.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg border border-border bg-surface-white px-2.5 py-1.5 text-text-secondary">
            <strong className="text-text-primary">{researchQuestions.length}</strong> research questions
          </span>
          <span className="rounded-lg border border-border bg-surface-white px-2.5 py-1.5 text-text-secondary">
            <strong className="text-text-primary">{sections.length}</strong> sections
          </span>
          <span className="rounded-lg border border-border bg-surface-white px-2.5 py-1.5 text-text-secondary">
            <strong className="text-text-primary">{configuredCount}/{sections.length}</strong> configured
          </span>
        </div>
      </div>

      {isGuidedGenerationLoading && (
        <div className="rounded-lg border border-border bg-surface-white px-3 py-2 text-sm text-text-secondary" role="status">
          Preparing sections from the project protocol…
        </div>
      )}
      {guidedGenerationError && (
        <div className="rounded-lg border border-error/25 bg-surface-white px-3 py-2 text-sm text-error" role="alert">
          {guidedGenerationError}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-white px-3 py-2.5 text-xs text-text-secondary">
        <FiLock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
        <p>Section names follow the project protocol. You can remove sections you do not need; their fields will be removed too.</p>
      </div>

      {sectionToDelete && (
        <div className="flex flex-col gap-3 rounded-lg border border-error/25 bg-surface-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between" role="alertdialog" aria-labelledby="delete-section-title" aria-describedby="delete-section-description">
          <div className="min-w-0">
            <p id="delete-section-title" className="text-sm font-semibold text-text-primary">Delete this section?</p>
            <p id="delete-section-description" className="mt-0.5 text-xs text-text-secondary">
              “{getDisplaySectionName(sectionToDelete)}” and its extraction fields will be removed from this template.
            </p>
          </div>
          <div className="flex shrink-0 justify-end gap-2">
            <button type="button" onClick={() => setSectionToDelete(null)} className="min-h-9 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteSection(sectionToDelete.id);
                setSectionToDelete(null);
              }}
              className="min-h-9 rounded-lg bg-error px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-error/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30"
            >
              Delete section
            </button>
          </div>
        </div>
      )}

      {activeSection ? (
        <div className="grid min-h-[390px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <nav className="rounded-xl border border-border bg-surface-white p-2" aria-label="Template sections">
            <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Sections
            </div>
            <div className="space-y-1">
              {sections.map((section, index) => {
                const isActive = section.id === activeSection.id;
                const isConfigured = completedSections.includes(section.id);
                const typeLabel = section.isPicoc ? "Shared context" : section.linkedResearchQuestionId ? `RQ${index}` : "Legacy";
                return (
                  <div key={section.id} className={`group flex items-center gap-1 rounded-lg p-1 transition-colors ${isActive ? "bg-primary-light" : "hover:bg-bg-primary"}`}>
                  <button
                    type="button"
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${isActive ? "text-primary" : "text-text-primary"}`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isActive ? "bg-surface-white" : "bg-bg-secondary text-text-secondary"}`} aria-hidden="true">
                      {section.isPicoc ? <FiFileText className="h-3.5 w-3.5" /> : <FiTarget className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold" title={getDisplaySectionName(section)}>
                        {getDisplaySectionName(section)}
                      </span>
                      <span className={`mt-0.5 block text-[11px] ${isActive ? "text-primary/75" : "text-text-muted"}`}>
                        {typeLabel} <span aria-hidden="true">·</span> {sectionFieldCounts[section.id] ?? 0} fields
                      </span>
                    </span>
                    {isConfigured && <FiCheck className="h-4 w-4 shrink-0 text-success" aria-label="Configured" />}
                  </button>
                  {!isViewOnly && (
                    <button
                      type="button"
                      onClick={() => setSectionToDelete(section)}
                      aria-label={`Delete section ${getDisplaySectionName(section)}`}
                      title="Delete section"
                      className="mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted opacity-70 transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                  </div>
                );
              })}
            </div>
          </nav>

          <section className="flex min-w-0 flex-col rounded-xl border border-border bg-surface-white p-4 sm:p-5" aria-labelledby="active-template-section">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {activeSection.isPicoc ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary">
                      <FiFileText className="h-3 w-3" /> Shared context
                    </span>
                  ) : activeSection.linkedResearchQuestionId ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                      <FiTarget className="h-3 w-3" /> Research question
                    </span>
                  ) : activeSection.isLegacy ? (
                    <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary" title="Retained for compatibility with this template">Compatible section</span>
                  ) : null}
                  {activeSection.isLockedName && <FiLock className="h-3.5 w-3.5 text-text-muted" aria-label="Section name is managed by the protocol" />}
                </div>
                <h3 id="active-template-section" className="break-words text-base font-semibold text-text-primary">
                  {getDisplaySectionName(activeSection)}
                </h3>
                {activeQuestion ? (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">{activeQuestion.questionText}</p>
                ) : (
                  <p className="mt-2 text-sm text-text-secondary">
                    {activeSection.isPicoc
                      ? "Shared study metadata and PICOC context used across the review."
                      : "This section is retained from the existing template for compatibility."}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-lg bg-bg-primary px-2.5 py-1.5 text-xs text-text-secondary">
                {sectionFieldCounts[activeSection.id] ?? 0} fields
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-5 pt-4">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Extraction fields</h4>
                <p className="mt-1 text-sm text-text-secondary">
                  {completedSections.includes(activeSection.id)
                    ? "Fields are configured. You can continue editing them at any time."
                    : "No fields have been configured for this section yet."}
                </p>
              </div>
              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 text-xs text-text-secondary">
                  {completedSections.includes(activeSection.id) ? (
                    <><FiCheck className="h-4 w-4 text-success" /> Configured</>
                  ) : (
                    <><span className="h-2 w-2 rounded-full bg-text-muted" /> Not configured</>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onSetupSection(activeSection.id)}
                  disabled={isViewOnly}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {completedSections.includes(activeSection.id) ? "Edit fields" : "Configure fields"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface-white px-5 py-10 text-center text-sm text-text-secondary">
          {isGuidedGenerationLoading ? "Preparing protocol sections…" : "No sections are available for this template yet."}
        </div>
      )}
    </div>
  );
}
