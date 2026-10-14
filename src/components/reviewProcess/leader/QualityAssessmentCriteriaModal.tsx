import React, { useState } from "react";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
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
    if (
      template &&
      hasWork &&
      !window.confirm("Replace the questions you have written with this template?")
    ) {
      return;
    }
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
    if (!window.confirm(`Delete your template "${ownEditableTemplate.name}"? Projects that already used it keep their questions.`)) {
      return;
    }
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
      <div className="flex flex-col gap-4 py-2 h-[75vh]">
        {/* Header Section */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-primary-light to-white rounded-xl border border-primary/20 shadow-sm shrink-0">
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
          <select
            id="qa-template"
            value={selectedTemplateId}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            disabled={isLoadingTemplates}
            className="mt-2 w-full rounded-xl border border-border bg-surface-white px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-accent/30 outline-none"
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
          </select>
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
        <div className="min-h-[160px] flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {criteria.length === 0 && (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-secondary">
              No questions yet. Pick a template above or add your own.
            </div>
          )}
          {criteria.map((criterion, index) => (
            <div
              key={criterion.id}
              className="group flex items-start gap-3 p-4 bg-surface-white border border-border rounded-xl transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mt-2.5 flex items-center justify-center w-6 h-6 rounded-lg bg-bg-secondary text-[10px] font-black text-text-secondary border border-border group-hover:bg-primary-light group-hover:text-accent group-hover:border-primary/30 transition-colors">
                {index + 1}
              </div>

              <div className="flex-1">
                <textarea
                  value={criterion.text}
                  onChange={(e) =>
                    handleUpdateCriterion(criterion.id, e.target.value)
                  }
                  placeholder="Enter assessment question..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm text-text-primary placeholder:text-slate-300 min-h-[60px] resize-none font-medium leading-relaxed"
                />
              </div>

              <button
                onClick={() => handleRemoveCriterion(criterion.id)}
                className="mt-1 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                title="Remove Criterion"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddCriterion}
            className="w-full py-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-text-secondary hover:border-primary/30 hover:text-accent hover:bg-primary-light/30 transition-all group"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">
              Add Custom Criterion
            </span>
          </button>
        </div>

        {/* Save, update or delete a personal template */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            type="text"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="Name to save these questions as my template"
            aria-label="Template name"
            className="min-w-0 flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:border-accent focus:ring-accent/30 outline-none"
          />
          <Button
            variant="secondary"
            onClick={handleSaveAsTemplate}
            disabled={criteria.length === 0 || isSavingTemplate}
            isLoading={isSavingTemplate}
            className="rounded-xl"
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
                className="rounded-xl"
              >
                Update this template
              </Button>
              <Button
                variant="secondary"
                onClick={handleDeleteTemplate}
                disabled={isDeletingTemplate}
                isLoading={isDeletingTemplate}
                className="rounded-xl text-rose-600"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border shrink-0">
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-6 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleApplyCriteria}
            className="px-8 rounded-xl shadow-lg shadow-primary/10 bg-primary hover:bg-primary-hover border-none"
            disabled={criteria.length === 0 || isSaving}
            isLoading={isSaving}
          >
            <ChevronRight className="w-4 h-4 mr-2" />
            Apply & Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QualityAssessmentCriteriaModal;
