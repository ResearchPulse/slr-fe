import Select from "../../ui/Select";
import React, { useLayoutEffect, useState } from "react";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import ConfirmModal from "../../ui/ConfirmModal";
import { Plus, Trash2, ShieldCheck, ChevronRight, BookMarked } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toastError } from "../../../utils/toast";
import { useQualityAssessment } from "../../../pages/reviewProcess/qualityAssessment/hooks/useQualityAssessment";
import { useQualityCriteriaTemplates } from "../../../pages/reviewProcess/qualityAssessment/hooks/useQualityCriteriaTemplates";
import type { QualityCriteriaTemplate } from "../../../types/qualityAssessment";

interface QualityAssessmentCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  qualityAssessmentProcessId: string;
}

interface CriterionDraft {
  id: string;
  text: string;
  weight: number;
}

const BLANK_TEMPLATE = "";

const resizeQuestionTextarea = (element: HTMLTextAreaElement | null) => {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
};

const QualityAssessmentCriteriaModal: React.FC<
  QualityAssessmentCriteriaModalProps
> = ({ isOpen, onClose, qualityAssessmentProcessId }) => {
  const { upsertStrategy, bulkChecklists, bulkCriteria } = useQualityAssessment(
    qualityAssessmentProcessId,
    true,
  );
  const {
    templates,
    isLoadingTemplates,
    createTemplate,
    isSavingTemplate,
    updateTemplate,
    isUpdatingTemplate,
    deleteTemplate,
    isDeletingTemplate,
  } = useQualityCriteriaTemplates(isOpen);

  const [criteria, setCriteria] = useState<CriterionDraft[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(BLANK_TEMPLATE);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [templateToApply, setTemplateToApply] = useState<QualityCriteriaTemplate | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useLayoutEffect(() => {
    const resizeAllQuestions = () => {
      document
        .querySelectorAll<HTMLTextAreaElement>("[data-qa-criterion-input]")
        .forEach(resizeQuestionTextarea);
    };

    resizeAllQuestions();
    window.addEventListener("resize", resizeAllQuestions);
    return () => window.removeEventListener("resize", resizeAllQuestions);
  }, [criteria]);

  const selectedTemplate: QualityCriteriaTemplate | undefined = templates.find(
    (template) => template.id === selectedTemplateId,
  );
  const ownEditableTemplate =
    selectedTemplate && selectedTemplate.scope === "USER" && selectedTemplate.canEdit ? selectedTemplate : undefined;
  const systemTemplates = templates.filter((template) => template.scope === "SYSTEM");
  const ownTemplates = templates.filter((template) => template.scope === "USER");

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    const hasWork = criteria.some((c) => c.text.trim());
    if (template && hasWork) {
      setTemplateToApply(template);
      return;
    }
    applyTemplate(templateId, template);
  };

  const applyTemplate = (templateId: string, template?: QualityCriteriaTemplate) => {
    setSelectedTemplateId(templateId);
    setNewTemplateName(template && template.scope === "USER" ? template.name : "");
    if (template) {
      setCriteria(
        template.criteria.map((c) => ({ id: uuidv4(), text: c.question, weight: c.weight })),
      );
    }
  };

  const handleAddCriterion = () => {
    setCriteria([...criteria, { id: uuidv4(), text: "", weight: 1 }]);
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  const handleUpdateCriterion = (id: string, text: string) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, text } : c)));
  };

  /** The name and questions to store, or null (after telling the user why) when they are not ready. */
  const readTemplateFields = () => {
    const name = newTemplateName.trim();
    if (!name) {
      toastError("Give the template a name first.");
      return null;
    }
    if (criteria.length === 0 || criteria.some((c) => !c.text.trim())) {
      toastError("Fill in all questions or remove empty ones before saving a template.");
      return null;
    }
    return { name, criteria: criteria.map((c) => ({ question: c.text.trim(), weight: c.weight })) };
  };

  const handleSaveAsTemplate = async () => {
    const fields = readTemplateFields();
    if (!fields) return;
    try {
      const response = await createTemplate(fields);
      // Keep working on the template that was just saved.
      setSelectedTemplateId(response.data?.id ?? BLANK_TEMPLATE);
    } catch {
      // The mutation already showed the error.
    }
  };

  const handleUpdateTemplate = async () => {
    const fields = readTemplateFields();
    if (!fields || !ownEditableTemplate) return;
    try {
      await updateTemplate({
        id: ownEditableTemplate.id,
        data: {
          ...fields,
          description: ownEditableTemplate.description,
          source: ownEditableTemplate.source,
        },
      });
    } catch {
      // The mutation already showed the error.
    }
  };

  const handleDeleteTemplate = async () => {
    if (!ownEditableTemplate) return;
    try {
      await deleteTemplate(ownEditableTemplate.id);
      setSelectedTemplateId(BLANK_TEMPLATE);
      setNewTemplateName("");
    } catch {
      // The mutation already showed the error.
    }
  };

  const handleApplyCriteria = async () => {
    if (criteria.some((c) => !c.text.trim())) {
      toastError("Please fill in all criteria or remove empty ones.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upsert Strategy
      const strategyResponse = await upsertStrategy({
        qaStrategyId: null!,
        qualityAssessmentProcessId: qualityAssessmentProcessId,
        description: selectedTemplate?.name ?? "Quality Assessment Strategy",
        checklists: [],
      });

      const strategyId = strategyResponse.data?.qaStrategyId;
      if (!strategyId) throw new Error("Failed to get Strategy ID");

      // 2. Bulk Checklists
      const checklistResponse = await bulkChecklists([
        {
          checklistId: null!,
          qaStrategyId: strategyId,
          name: selectedTemplate?.name ?? "Quality Checklist",
          criteria: [],
        },
      ]);

      const checklistId = checklistResponse.data?.[0]?.checklistId;
      if (!checklistId) throw new Error("Failed to get Checklist ID");

      // 3. Upsert Criteria
      const criteriaPayload = criteria.map((c) => ({
        criterionId: null!,
        checklistId: checklistId,
        question: c.text,
        weight: c.weight,
      }));

      await bulkCriteria(criteriaPayload);

      onClose();
    } catch (error) {
      console.error("Failed to save QA configuration:", error);
      toastError(
        "Failed to save Quality Assessment configuration. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderTemplateOptions = (group: QualityCriteriaTemplate[]) =>
    group.map((template) => (
      <option key={template.id} value={template.id}>
        {template.name} ({template.criteria.length} questions)
      </option>
    ));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quality Assessment Criteria"
      size="xl"
    >
      <div className="flex flex-col gap-4 py-2 h-auto sm:h-[75vh]">
        {/* Header Section */}
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-primary/20 bg-primary-light px-4 py-3">
          <div className="p-2 bg-surface-white rounded-lg shadow-sm border border-primary/20 shrink-0">
            <ShieldCheck className="w-5 h-5 text-accent" />
          </div>
          <p className="text-sm text-text-secondary">
            <span className="font-bold text-text-primary">Configure Quality Assessment.</span>{" "}
            Each reviewer rates every criterion below for every included paper.
          </p>
        </div>

        {/* Template picker */}
        <div className="rounded-xl border border-border bg-surface-white p-4 shrink-0">
          <label
            htmlFor="qa-template"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-text-secondary"
          >
            <BookMarked className="w-4 h-4" />
            Start from
          </label>
          <Select
            id="qa-template"
            value={selectedTemplateId}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            disabled={isLoadingTemplates}
            className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-accent/30"
          >
            <option value={BLANK_TEMPLATE}>
              {isLoadingTemplates ? "Loading templates..." : "Blank - write my own questions"}
            </option>
            {systemTemplates.length > 0 && (
              <optgroup label="System templates">{renderTemplateOptions(systemTemplates)}</optgroup>
            )}
            {ownTemplates.length > 0 && (
              <optgroup label="My templates">{renderTemplateOptions(ownTemplates)}</optgroup>
            )}
          </Select>
          {selectedTemplate ? (
            <div className="mt-2 space-y-1 text-xs text-text-secondary">
              {selectedTemplate.description && <p>{selectedTemplate.description}</p>}
              {/* A personal template without a source is simply the leader's own list, nothing to warn about. */}
              {(selectedTemplate.source || selectedTemplate.scope === "SYSTEM") && (
                <p>
                  <span className="font-semibold">Source:</span>{" "}
                  {selectedTemplate.source ?? "not documented - check where these questions come from before citing them"}
                </p>
              )}
            </div>
          ) : (
            !isLoadingTemplates &&
            templates.length === 0 && (
              <p className="mt-2 text-xs text-text-secondary">
                No templates available yet. Write your questions below, then save them as a template to reuse later.
              </p>
            )
          )}
        </div>

        {/* Scrollable Criteria List */}
        <div className="min-h-[160px] flex-1 pr-2 space-y-3 custom-scrollbar sm:overflow-y-auto">
          {criteria.length === 0 && (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-secondary">
              No questions yet. Pick a template above or add your own.
            </div>
          )}
          {criteria.map((criterion, index) => (
            <div
              key={criterion.id}
              className="group flex items-start gap-3 rounded-xl border border-border bg-surface-white p-4 transition-colors duration-150 hover:border-primary/30 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-150 motion-reduce:animate-none motion-reduce:transition-none"
            >
              <div className="mt-2.5 flex h-6 w-6 items-center justify-center rounded-lg border border-border bg-bg-secondary text-[10px] font-black text-text-secondary transition-colors duration-150 group-hover:border-primary/30 group-hover:bg-primary-light group-hover:text-accent motion-reduce:transition-none">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <textarea
                  ref={resizeQuestionTextarea}
                  data-qa-criterion-input
                  rows={3}
                  value={criterion.text}
                  onChange={(e) => {
                    resizeQuestionTextarea(e.currentTarget);
                    handleUpdateCriterion(criterion.id, e.target.value);
                  }}
                  placeholder="Enter assessment question..."
                  className="min-h-20 w-full resize-none border-none bg-transparent text-sm font-medium leading-relaxed text-text-primary placeholder:text-text-secondary focus:ring-0"
                />
              </div>

              <button
                onClick={() => handleRemoveCriterion(criterion.id)}
                className="mt-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors duration-150 hover:bg-error/10 hover:text-error focus-visible:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
                title="Remove Criterion"
                aria-label={`Remove criterion ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddCriterion}
            className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-text-secondary transition-colors duration-150 hover:border-primary/30 hover:bg-primary-light/30 hover:text-accent motion-reduce:transition-none"
          >
            <Plus className="h-4 w-4 transition-transform duration-150 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none" />
            <span className="text-xs font-black uppercase tracking-widest">
              Add Custom Criterion
            </span>
          </button>
        </div>

        {/* Save, update or delete a personal template */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="text"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="Name to save these questions as my template"
            aria-label="Template name"
            className="min-h-11 w-full min-w-0 flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent focus:ring-accent/30 sm:w-auto"
          />
          <Button
            variant="secondary"
            onClick={handleSaveAsTemplate}
            disabled={criteria.length === 0 || isSavingTemplate}
            isLoading={isSavingTemplate}
            className="w-full rounded-xl sm:w-auto"
          >
            Save as new template
          </Button>
          {ownEditableTemplate && (
            <>
              <Button
                variant="secondary"
                onClick={handleUpdateTemplate}
                disabled={criteria.length === 0 || isUpdatingTemplate}
                isLoading={isUpdatingTemplate}
                className="w-full rounded-xl sm:w-auto"
              >
                Update this template
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isDeletingTemplate}
                isLoading={isDeletingTemplate}
                className="w-full rounded-xl text-error hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 sm:w-auto"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end sm:gap-3 sm:pt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full rounded-xl px-6 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleApplyCriteria}
            className="w-full rounded-xl bg-primary px-8 hover:bg-primary-hover sm:w-auto"
            disabled={criteria.length === 0 || isSaving}
            isLoading={isSaving}
          >
            <ChevronRight className="w-4 h-4 mr-2" />
            Apply & Continue
          </Button>
        </div>
      </div>
      <ConfirmModal
        isOpen={Boolean(templateToApply)}
        onClose={() => setTemplateToApply(null)}
        onConfirm={() => {
          if (templateToApply) applyTemplate(templateToApply.id, templateToApply);
          setTemplateToApply(null);
        }}
        title="Replace your questions?"
        message="The selected template will replace the questions you have written."
        confirmText="Replace questions"
        cancelText="Keep my questions"
        variant="warning"
      />
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          void handleDeleteTemplate().finally(() => setIsDeleteConfirmOpen(false));
        }}
        title="Delete this template?"
        message={ownEditableTemplate ? `Delete “${ownEditableTemplate.name}”? Projects that already used it keep their questions.` : "Delete this template?"}
        confirmText="Delete template"
        cancelText="Keep template"
        isLoading={isDeletingTemplate}
        variant="danger"
      />
    </Modal>
  );
};

export default QualityAssessmentCriteriaModal;
