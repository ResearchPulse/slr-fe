import { useState } from "react";
import { FiAlertTriangle, FiBookOpen, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import QualityCriteriaTemplateEditor from "../../components/admin/QualityCriteriaTemplateEditor";
import { useQualityCriteriaTemplates } from "../reviewProcess/qualityAssessment/hooks/useQualityCriteriaTemplates";
import type { QualityCriteriaTemplate } from "../../types/qualityAssessment";

/** Admin screen for the system templates of quality assessment criteria. */
export default function QualityCriteriaTemplates() {
  const {
    templates,
    isLoadingTemplates,
    createTemplate,
    isSavingTemplate,
    updateTemplate,
    isUpdatingTemplate,
    deleteTemplate,
    isDeletingTemplate,
  } = useQualityCriteriaTemplates();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editing, setEditing] = useState<QualityCriteriaTemplate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QualityCriteriaTemplate | null>(null);

  // Personal templates belong to their owners; this screen is only for the shared ones.
  const systemTemplates = templates.filter((template) => template.scope === "SYSTEM");

  const openEditor = (template: QualityCriteriaTemplate | null) => {
    setEditing(template);
    setIsEditorOpen(true);
  };

  const handleSave = async (fields: Parameters<typeof createTemplate>[0]) => {
    try {
      if (editing) {
        await updateTemplate({ id: editing.id, data: fields });
      } else {
        await createTemplate({ ...fields, scope: "SYSTEM" });
      }
      setIsEditorOpen(false);
    } catch {
      // The mutation already showed the error and the editor stays open for another try.
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteTemplate(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // Error already shown by the mutation.
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">System configuration</p>
          <h1 className="mt-2 text-3xl font-semibold text-text-primary">Quality assessment criteria</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Templates that project leaders can start from when they set up the Quality Assessment phase. Applying a
            template copies its questions into the project, so changing a template here does not alter projects that
            already used it.
          </p>
        </div>
        <Button variant="primary" onClick={() => openEditor(null)} className="shrink-0 rounded-xl">
          <FiPlus className="mr-2 h-4 w-4" />
          New template
        </Button>
      </header>

      {isLoadingTemplates && <p className="text-sm text-text-secondary">Loading templates...</p>}

      {!isLoadingTemplates && systemTemplates.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface-white p-10 text-center">
          <FiBookOpen className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-text-primary">No system templates yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Leaders will start from a blank list. Create a template, ideally from a published checklist, and cite its source.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {systemTemplates.map((template) => (
          <article key={template.id} className="rounded-xl border border-border bg-surface-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-text-primary">{template.name}</h2>
                  <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                    {template.criteria.length} questions
                  </span>
                </div>
                {template.description && <p className="mt-1 text-sm text-text-secondary">{template.description}</p>}
                {template.source ? (
                  <p className="mt-2 text-xs text-text-secondary">
                    <span className="font-semibold">Source:</span> {template.source}
                  </p>
                ) : (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                    <FiAlertTriangle className="h-3.5 w-3.5" />
                    Source not documented. Add the citation before relying on this template.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditor(template)} className="rounded-xl">
                  <FiEdit2 className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPendingDelete(template)} className="rounded-xl text-rose-600">
                  <FiTrash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>

            <details className="mt-4 group">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-accent">
                View questions
              </summary>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text-primary">
                {template.criteria.map((criterion, index) => (
                  <li key={index}>
                    {criterion.question}
                    {criterion.weight !== 1 && (
                      <span className="ml-2 text-xs text-text-secondary">(weight {criterion.weight})</span>
                    )}
                  </li>
                ))}
              </ol>
            </details>
          </article>
        ))}
      </div>

      <QualityCriteriaTemplateEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        template={editing}
        isSaving={isSavingTemplate || isUpdatingTemplate}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete this template?"
        message={`"${pendingDelete?.name ?? ""}" will no longer be offered to leaders. Projects that already used it keep their questions.`}
        confirmText="Delete"
        isLoading={isDeletingTemplate}
        variant="danger"
      />
    </div>
  );
}
