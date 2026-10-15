import { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { v4 as uuidv4 } from "uuid";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
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
        criteria: template.criteria.map((c) => newCriterion(c.question, c.weight)),
      }
    : { name: "", description: "", source: "", criteria: [newCriterion()] };

const inputClass =
  "w-full rounded-xl border border-border bg-surface-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

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
      criteria: prev.criteria.map((c) => (c.key === key ? { ...c, ...changes } : c)),
    }));

  const handleSave = () => {
    const name = draft.name.trim();
    if (!name) {
      toastError("The template needs a name.");
      return;
    }
    if (draft.criteria.length === 0 || draft.criteria.some((c) => !c.question.trim())) {
      toastError("Fill in every question or remove the empty ones.");
      return;
    }
    if (draft.criteria.some((c) => !(c.weight >= MIN_WEIGHT && c.weight <= MAX_WEIGHT))) {
      toastError(`Weights must be between ${MIN_WEIGHT} and ${MAX_WEIGHT}.`);
      return;
    }
    onSave({
      name,
      description: draft.description.trim(),
      source: draft.source.trim() || null,
      criteria: draft.criteria.map((c) => ({ question: c.question.trim(), weight: c.weight })),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={template ? "Edit system template" : "New system template"}
      description="System templates are offered to every project leader as a starting point for their quality criteria."
    >
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto py-2 pr-1">
        <div>
          <label htmlFor="qct-name" className="mb-1 block text-xs font-bold uppercase tracking-wider text-text-secondary">
            Name
          </label>
          <input
            id="qct-name"
            value={draft.name}
            maxLength={200}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. Checklist for empirical software engineering studies"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="qct-description" className="mb-1 block text-xs font-bold uppercase tracking-wider text-text-secondary">
            Description
          </label>
          <textarea
            id="qct-description"
            value={draft.description}
            maxLength={1000}
            rows={2}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="When should a project use this checklist?"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="qct-source" className="mb-1 block text-xs font-bold uppercase tracking-wider text-text-secondary">
            Source
          </label>
          <textarea
            id="qct-source"
            value={draft.source}
            maxLength={500}
            rows={2}
            onChange={(e) => setDraft({ ...draft, source: e.target.value })}
            placeholder="Citation or link of the published checklist these questions come from"
            className={`${inputClass} resize-none`}
          />
          <p className="mt-1 text-xs text-text-secondary">
            Leaders see this next to the template. Leave it empty only if the origin is unknown.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Questions ({draft.criteria.length})
            </span>
            <span className="text-xs text-text-secondary">Weight multiplies the points of a question (Yes = 1, Unclear = 0.5, No = 0)</span>
          </div>

          <div className="space-y-3">
            {draft.criteria.map((criterion, index) => (
              <div key={criterion.key} className="flex items-start gap-3 rounded-xl border border-border bg-surface-white p-3">
                <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-secondary text-[10px] font-black text-text-secondary">
                  {index + 1}
                </span>
                <textarea
                  aria-label={`Question ${index + 1}`}
                  value={criterion.question}
                  maxLength={1000}
                  rows={2}
                  onChange={(e) => updateCriterion(criterion.key, { question: e.target.value })}
                  placeholder="Enter assessment question..."
                  className={`${inputClass} flex-1 resize-none`}
                />
                <div className="w-20 shrink-0">
                  <input
                    type="number"
                    aria-label={`Weight of question ${index + 1}`}
                    min={MIN_WEIGHT}
                    max={MAX_WEIGHT}
                    step={0.5}
                    value={criterion.weight}
                    onChange={(e) => updateCriterion(criterion.key, { weight: Number(e.target.value) })}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-center text-[10px] uppercase tracking-wider text-text-secondary">Weight</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, criteria: prev.criteria.filter((c) => c.key !== criterion.key) }))}
                  className="mt-1 rounded-xl p-2 text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
                  title="Remove question"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setDraft((prev) => ({ ...prev, criteria: [...prev.criteria, newCriterion()] }))}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-xs font-black uppercase tracking-widest text-text-secondary transition-all hover:border-primary/30 hover:bg-primary-light/30 hover:text-accent"
          >
            <FiPlus className="h-4 w-4" />
            Add question
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
        <Button variant="secondary" onClick={onClose} className="rounded-xl px-6">
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={isSaving} className="rounded-xl px-8">
          {template ? "Save changes" : "Create template"}
        </Button>
      </div>
    </Modal>
  );
}
