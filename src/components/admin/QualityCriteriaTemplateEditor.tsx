import { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { v4 as uuidv4 } from "uuid";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { cn } from "../../utils/cn";
import { toastError } from "../../utils/toast";
import type {
  QualityCriteriaTemplate,
  SaveQualityCriteriaTemplateRequest,
} from "../../types/qualityAssessment";

interface CriterionDraft {
  key: string;
  question: string;
  weight: number;
}

interface TemplateDraft {
  name: string;
  description: string;
  source: string;
  criteria: CriterionDraft[];
}

type TemplateFields = Omit<SaveQualityCriteriaTemplateRequest, "scope">;

interface QualityCriteriaTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  /** The template being edited, or null to create a new one. */
  template: QualityCriteriaTemplate | null;
  isSaving: boolean;
  onSave: (fields: TemplateFields) => void;
}

const MIN_WEIGHT = 0.5;
const MAX_WEIGHT = 10;

const newCriterion = (question = "", weight = 1): CriterionDraft => ({ key: uuidv4(), question, weight });

const toDraft = (template: QualityCriteriaTemplate | null): TemplateDraft =>
  template
    ? {
        name: template.name,
        description: template.description,
        source: template.source ?? "",
        criteria: template.criteria.map((criterion) => newCriterion(criterion.question, criterion.weight)),
      }
    : { name: "", description: "", source: "", criteria: [newCriterion()] };

const inputClass =
  "h-10 min-h-0 w-full rounded-lg border border-border bg-surface-white px-3 py-2 text-sm text-text-primary outline-none transition-colors motion-reduce:transition-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function QualityCriteriaTemplateEditor({
  isOpen,
  onClose,
  template,
  isSaving,
  onSave,
}: QualityCriteriaTemplateEditorProps) {
  const [draft, setDraft] = useState<TemplateDraft>(() => toDraft(template));

  useEffect(() => {
    if (isOpen) setDraft(toDraft(template));
  }, [isOpen, template]);

  const updateCriterion = (key: string, changes: Partial<CriterionDraft>) =>
    setDraft((prev) => ({
      ...prev,
      criteria: prev.criteria.map((criterion) => (criterion.key === key ? { ...criterion, ...changes } : criterion)),
    }));

  const handleSave = () => {
    const name = draft.name.trim();
    if (!name) {
      toastError("The template needs a name.");
      return;
    }
    if (draft.criteria.length === 0 || draft.criteria.some((criterion) => !criterion.question.trim())) {
      toastError("Fill in every question or remove the empty ones.");
      return;
    }
    if (draft.criteria.some((criterion) => !(criterion.weight >= MIN_WEIGHT && criterion.weight <= MAX_WEIGHT))) {
      toastError(`Weights must be between ${MIN_WEIGHT} and ${MAX_WEIGHT}.`);
      return;
    }
    onSave({
      name,
      description: draft.description.trim(),
      source: draft.source.trim() || null,
      criteria: draft.criteria.map((criterion) => ({ question: criterion.question.trim(), weight: criterion.weight })),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="w-[min(900px,calc(100vw-32px))] max-w-none max-h-[88vh]"
      bodyClassName="p-5 sm:p-6"
      headerClassName="px-5 py-4 sm:px-6 sm:py-4"
      footerClassName="px-5 py-3 sm:px-6 sm:py-3"
      descriptionClassName="text-[13px] leading-5"
      title={<span className="text-[20px]">{template ? "Edit system template" : "New system template"}</span>}
      description="System templates are offered to every project leader as a starting point for their quality criteria."
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="h-10 rounded-lg px-4" disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={isSaving} className="h-10 rounded-lg px-4">
            {template ? "Save changes" : "Create template"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <label htmlFor="qct-name" className="block text-xs font-semibold text-text-secondary">Template name</label>
          <input
            id="qct-name"
            value={draft.name}
            maxLength={200}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="e.g. Checklist for empirical software engineering studies"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="qct-description" className="block text-xs font-semibold text-text-secondary">Description</label>
          <textarea
            id="qct-description"
            value={draft.description}
            maxLength={1000}
            rows={2}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            placeholder="When should a project use this checklist?"
            className="min-h-[64px] w-full resize-y rounded-lg border border-border bg-surface-white px-3 py-2 text-sm text-text-primary outline-none transition-colors motion-reduce:transition-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="qct-source" className="block text-xs font-semibold text-text-secondary">Source</label>
          <input
            id="qct-source"
            type="text"
            value={draft.source}
            maxLength={500}
            onChange={(event) => setDraft({ ...draft, source: event.target.value })}
            placeholder="Citation or link of the published checklist these questions come from"
            className={inputClass}
          />
          <p className="text-xs leading-4 text-text-secondary">
            Leaders see this beside the template. Leave it empty only if the origin is unknown.
          </p>
        </div>

        <section className="border-t border-border pt-4" aria-labelledby="qct-questions-heading">
          <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="qct-questions-heading" className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              Questions
              <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">{draft.criteria.length}</span>
            </h2>
            <p className="text-xs leading-4 text-text-secondary">Weight multiplies the points (Yes = 1, Unclear = 0.5, No = 0).</p>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_76px_2.25rem] items-center gap-2 px-2 text-[11px] font-medium text-text-secondary">
              <span aria-hidden="true" />
              <span>Question</span>
              <span className="text-center">Weight</span>
              <span aria-hidden="true" />
            </div>
            {draft.criteria.map((criterion, index) => (
              <div key={criterion.key} className="grid grid-cols-[1.25rem_minmax(0,1fr)_76px_2.25rem] items-center gap-2 rounded-lg border border-border bg-surface-white p-2">
                <span className="text-center text-xs font-medium tabular-nums text-text-muted" aria-hidden="true">{index + 1}</span>
                <input
                  aria-label={`Question ${index + 1}`}
                  type="text"
                  value={criterion.question}
                  maxLength={1000}
                  onChange={(event) => updateCriterion(criterion.key, { question: event.target.value })}
                  placeholder="Enter assessment question..."
                  className={cn(inputClass, "min-w-0 px-2.5")}
                />
                <input
                  type="number"
                  aria-label={`Weight of question ${index + 1}`}
                  min={MIN_WEIGHT}
                  max={MAX_WEIGHT}
                  step={0.5}
                  value={criterion.weight}
                  onChange={(event) => updateCriterion(criterion.key, { weight: Number(event.target.value) })}
                  className={cn(inputClass, "w-[76px] px-2 text-center")}
                />
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, criteria: prev.criteria.filter((item) => item.key !== criterion.key) }))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 motion-reduce:transition-none"
                  title="Remove question"
                  aria-label={`Remove question ${index + 1}`}
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDraft((prev) => ({ ...prev, criteria: [...prev.criteria, newCriterion()] }))}
            className="mt-3 h-10 gap-1.5 rounded-lg px-3 normal-case tracking-normal"
          >
            <FiPlus className="h-4 w-4" />
            Add Question
          </Button>
        </section>
      </div>
    </Modal>
  );
}
