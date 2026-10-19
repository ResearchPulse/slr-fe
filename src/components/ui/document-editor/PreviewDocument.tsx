import React from "react";
import type {
  DocumentDraft,
  ItemBlock,
  SectionBlock,
} from "../../../types/documentEditor";
import type {
  StudySelectionChecklistItem,
  StudySelectionChecklistTemplate,
  StudySelectionChecklistTemplateSection,
} from "../../../types/studySelectionChecklistTemplate";

interface PreviewDocumentProps {
  draft?: DocumentDraft;
  template?: StudySelectionChecklistTemplate | null;
  renderItem?: (
    item: (ItemBlock | StudySelectionChecklistItem) & { isChecked?: boolean },
  ) => React.ReactNode;
  renderSectionTitle?: (
    section: (SectionBlock | StudySelectionChecklistTemplateSection) & {
      isChecked?: boolean;
    },
  ) => React.ReactNode;
}

export const PreviewDocument: React.FC<PreviewDocumentProps> = ({
  draft,
  template,
  renderItem,
  renderSectionTitle,
}) => {
  // If template is provided, map its fields to the display structure
  const displayData = template
    ? {
        title: template.name,
        paragraphs: template.description
          ? [{ id: "desc", text: template.description, order: 0 }]
          : [],
        sections: template.sections || [],
      }
    : draft;

  if (!displayData) {
    return (
      <div className="mx-auto flex min-h-[320px] w-full max-w-3xl flex-col items-center justify-center rounded-xl border border-border bg-surface-white p-6 text-center">
        <p className="text-sm italic text-text-secondary">No document data provided.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[720px] w-full max-w-3xl flex-col gap-8 rounded-xl border border-border bg-surface-white p-6 shadow-sm sm:min-h-[800px] sm:gap-10 sm:p-10 lg:p-12">
      {/* Title */}
      <header>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-4xl">
          {displayData.title || (
            <span className="text-text-tertiary italic">Untitled Document</span>
          )}
        </h1>
        <div aria-hidden="true" className="mt-4 h-1 w-16 rounded-full bg-primary" />
      </header>

      {/* Paragraphs / Description */}
      <div className="space-y-4">
        {displayData.paragraphs.length > 0 ? (
          displayData.paragraphs.map((p) => (
            <p
              key={p.id}
              className="whitespace-pre-wrap text-base leading-7 text-text-secondary sm:text-lg"
            >
              {p.text || (
                <span className="text-text-tertiary">Empty paragraph...</span>
              )}
            </p>
          ))
        ) : (
          <p className="text-sm italic text-text-tertiary">
            No introductory paragraphs added.
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-8 sm:space-y-10">
        {displayData.sections.length > 0 ? (
          displayData.sections.map((section) => (
            <section key={section.id} className="space-y-4 sm:space-y-5">
              <div>
                <h2 className="flex items-center justify-between gap-3 text-xl font-semibold text-text-primary sm:text-2xl">
                  <span>
                    {section.title || (
                      <span className="text-text-tertiary italic">
                        Untitled Section
                      </span>
                    )}
                  </span>
                  {renderSectionTitle && renderSectionTitle(section)}
                </h2>
                {section.description && (
                  <p className="mt-2 text-sm italic text-text-secondary">
                    {section.description}
                  </p>
                )}
              </div>

              <div className="ml-5 sm:ml-8">
                {section.items.length > 0 ? (
                  <ol className="list-decimal space-y-4 marker:font-bold marker:text-primary">
                    {section.items.map((item) => (
                      <li
                        key={item.id}
                        className="pl-2 text-sm font-medium leading-6 text-text-primary sm:pl-3 sm:text-base"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span>
                            {item.text || (
                              <span className="text-text-tertiary italic">
                                No text provided
                              </span>
                            )}
                          </span>
                          {renderItem && renderItem(item)}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm italic text-text-tertiary">
                    No items in this section.
                  </p>
                )}
              </div>
            </section>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
            <p className="text-sm font-medium italic text-text-tertiary">
              Your sections will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Footer / Meta */}
      <footer className="mt-auto border-t border-border pt-8 text-center text-xs text-text-tertiary sm:pt-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
          Generated Document • {new Date().toLocaleDateString()}
        </p>
      </footer>
    </div>
  );
};
