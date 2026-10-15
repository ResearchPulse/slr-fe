import { useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiFileText,
  FiLoader,
  FiTarget,
} from "react-icons/fi";
import type { ResearchQuestion } from "../../../../../types/coreAndGovernance";
import type {
  DataItemDefinitionExtended,
  ExtractionTemplateDto,
  ExtractionTemplateResponseDto,
} from "../../../../../types/dataExtraction";
import type { WizardState } from "../../../../../types/templateWizard";
import {
  dataExtractionTemplateService,
  sanitizeExtractionTemplateInput,
} from "../../../../../services/dataExtractionService";
import {
  dismissToast,
  toastError,
  toastLoading,
  toastSuccess,
  toastWarning,
} from "../../../../../utils/toast";
import Input from "../../../../ui/Input";
import Label from "../../../../ui/Label";
import Textarea from "../../../../ui/Textarea";

function preserveMatrixColumnIds(
  template: ExtractionTemplateDto,
  existingTemplate?: ExtractionTemplateDto | ExtractionTemplateResponseDto | null,
): ExtractionTemplateDto {
  if (!existingTemplate) return template;

  return {
    ...template,
    sections: (template.sections || []).map((section) => {
      const existingSection = existingTemplate.sections?.find(
        (candidate) => candidate.sectionId === section.sectionId,
      );
      if (!section.matrixColumns?.length || !existingSection?.matrixColumns?.length) {
        return section;
      }

      return {
        ...section,
        matrixColumns: section.matrixColumns.map((column) => ({
          ...column,
          columnId: (
            existingSection.matrixColumns?.find(
              (candidate) => candidate.name === column.name,
            ) ??
            existingSection.matrixColumns?.find(
              (candidate) => candidate.orderIndex === column.orderIndex,
            )
          )?.columnId,
        })),
      };
    }),
  };
}

interface Step4_PreviewProps {
  projectId: string;
  expectedVersion?: number;
  existingTemplate?: ExtractionTemplateDto | ExtractionTemplateResponseDto | null;
  state: WizardState;
  onPublish: (savedTemplate: ExtractionTemplateResponseDto) => void;
  onBack: (name?: string, description?: string) => void;
  getCompletedTemplate: (
    name?: string,
    description?: string,
  ) => ExtractionTemplateDto | null;
  isViewOnly?: boolean;
  researchQuestions?: ResearchQuestion[];
}

export default function Step4_Preview({
  projectId,
  expectedVersion,
  existingTemplate,
  state,
  onPublish,
  onBack,
  getCompletedTemplate,
  isViewOnly = false,
  researchQuestions = [],
}: Step4_PreviewProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState(state.templateMeta.name);
  const [templateDescription, setTemplateDescription] = useState(
    state.templateMeta.description,
  );

  const totalFields = useMemo(() => {
    const countItems = (items: DataItemDefinitionExtended[]): number =>
      items.reduce((sum, item) => sum + 1 + (item.subItems?.length ? countItems(item.subItems) : 0), 0);
    const flatFieldCount = Array.from(state.sectionData.values()).reduce((sum, items) => sum + countItems(items), 0);
    const matrixRowCount = Array.from(state.matrixData.values()).reduce((sum, matrix) => sum + matrix.rows.length, 0);
    return flatFieldCount + matrixRowCount;
  }, [state.matrixData, state.sectionData]);
  const requiredFields = useMemo(() => {
    const countRequired = (items: DataItemDefinitionExtended[]): number =>
      items.reduce((sum, item) => sum + (item.is_required ? 1 : 0) + (item.subItems?.length ? countRequired(item.subItems) : 0), 0);
    return Array.from(state.sectionData.values()).reduce((sum, items) => sum + countRequired(items), 0);
  }, [state.sectionData]);

  const completedSections = useMemo(() => {
    const configured = state.sections.filter((section) => {
      const flatItems = state.sectionData.get(section.id) || [];
      const matrix = state.matrixData.get(section.id);
      return flatItems.length > 0 || Boolean(matrix?.rows.length || matrix?.columns.length);
    });
    return configured.length;
  }, [state.matrixData, state.sectionData, state.sections]);

  const hasMatrixConfiguration = Array.from(state.matrixData.values()).some(
    (matrix) => matrix.rows.length > 0 || matrix.columns.length > 0,
  );
  const isReadyToPublish = Boolean(templateName.trim()) && (totalFields > 0 || hasMatrixConfiguration);

  const handlePublish = async () => {
    if (isViewOnly) {
      toastWarning(
        "Read-only Mode",
        "Only project leaders can create, update, or delete extraction templates.",
      );
      return;
    }

    if (!templateName.trim()) {
      setPublishError("Template name is required");
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    const loadingToastId = toastLoading(
      "Publishing template",
      "Saving extraction template...",
    );

    try {
      const completedTemplate = getCompletedTemplate(templateName, templateDescription);
      const template = completedTemplate && existingTemplate?.templateId
        ? { ...completedTemplate, templateId: existingTemplate.templateId }
        : completedTemplate;
      const isUpdateAction = Boolean(template?.templateId);
      if (!template) {
        throw new Error(
          "Please add at least one field or configure a matrix before publishing the template.",
        );
      }

      const sanitizedPayload = sanitizeExtractionTemplateInput(
        preserveMatrixColumnIds(template, existingTemplate),
      );
      let savedTemplate: ExtractionTemplateResponseDto;
      if (template.templateId) {
        if (expectedVersion === undefined) {
          throw new Error("Template version is required to update an existing template.");
        }
        savedTemplate = await dataExtractionTemplateService.update(
          projectId,
          template.templateId,
          { ...sanitizedPayload, expectedVersion },
        );
      } else {
        savedTemplate = await dataExtractionTemplateService.create(projectId, sanitizedPayload);
      }

      toastSuccess(
        isUpdateAction ? "Template Updated" : "Template Created",
        "Data extraction template has been published successfully.",
      );

      onPublish(savedTemplate);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to publish template";
      setPublishError(message);
      toastError("Publish Failed", message);
    } finally {
      dismissToast(loadingToastId);
      setIsPublishing(false);
    }
  };

  const coveredResearchQuestions = new Set(
    state.sections
      .filter((section) => (state.sectionData.get(section.id)?.length ?? 0) > 0 || (state.matrixData.get(section.id)?.rows.length ?? 0) > 0)
      .map((section) => section.linkedResearchQuestionId)
      .filter((id): id is string => Boolean(id)),
  ).size;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Preview &amp; publish</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Review the form as reviewers will see it, then publish the template.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Sections", value: state.sections.length },
          { label: "Fields", value: totalFields },
          { label: "Required", value: requiredFields },
          { label: "RQ coverage", value: `${coveredResearchQuestions}/${researchQuestions.length}` },
          { label: "Not configured", value: Math.max(state.sections.length - completedSections, 0) },
          { label: "Readiness", value: isReadyToPublish ? "Ready" : "Needs setup" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-surface-white px-3 py-2.5">
            <p className="text-[11px] font-medium text-text-secondary">{item.label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-text-primary">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface-white p-4 sm:p-5">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">
          Template Information
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="template_name">
              Template Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="template_name"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setPublishError(null);
              }}
              placeholder="e.g., RQ-Driven Software Testing Extraction Template"
              className={
                publishError && !templateName.trim()
                  ? "border-red-500 focus:ring-red-500"
                  : ""
              }
            />
          </div>

          <div>
            <Label htmlFor="template_description">Description (Optional)</Label>
            <Textarea
              id="template_description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Briefly describe scope and intent of this extraction template"
              rows={3}
            />
          </div>
        </div>
      </div>

      {publishError && (
        <div className="rounded-lg border border-error/25 bg-surface-white p-3">
          <p className="text-sm text-red-700 whitespace-pre-wrap">
            {publishError}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {state.sections.map((section) => {
          const flatItems = state.sectionData.get(section.id) || [];
          const matrixData = state.matrixData.get(section.id);
          const isConfigured =
            flatItems.length > 0 || Boolean(matrixData?.rows.length);

          if (!isConfigured) {
            return null;
          }

          return (
            <div
              key={section.id}
              className="overflow-hidden rounded-xl border border-border bg-surface-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-white px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="break-words text-sm font-semibold text-text-primary">
                    {section.name.replace(/^(RQ\d+\s*:\s*)+/i, "$1")}
                  </h3>
                  {section.isPicoc ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary">
                      <FiFileText className="w-3 h-3" />
                      Context
                    </span>
                  ) : section.linkedResearchQuestionId ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                      <FiTarget className="w-3 h-3" />
                      RQ Linked
                    </span>
                  ) : section.isLegacy ? (
                    <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary" title="Retained for compatibility">
                      Compatible
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {flatItems.length > 0 && (
                  <div className="space-y-4">
                    {flatItems.map((item, idx) => (
                      <div
                        key={item.data_item_id}
                        className="pb-3 border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <label className="font-medium text-text-primary">{`${idx + 1}. ${item.name}`}</label>
                          {item.is_required && (
                            <span className="text-red-600 font-bold">*</span>
                          )}
                          <span className="inline-block px-2 py-0.5 bg-bg-secondary text-text-secondary text-xs rounded">
                            {item.data_type}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-sm text-text-secondary mb-2">
                            {item.description}
                          </p>
                        )}

                        <div className="rounded-lg border border-border bg-bg-primary p-3">
                          {item.data_type === "Text" && (
                            <input
                              type="text"
                              disabled
                              placeholder="Text input..."
                              className="w-full px-3 py-2 border border-border rounded bg-surface-white text-text-secondary"
                            />
                          )}
                          {item.data_type === "Number" && (
                            <input
                              type="number"
                              disabled
                              placeholder="0"
                              className="w-full px-3 py-2 border border-border rounded bg-surface-white text-text-secondary"
                            />
                          )}
                          {item.data_type === "Boolean" && (
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  disabled
                                  className="w-4 h-4"
                                />
                                <span>Yes</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  disabled
                                  className="w-4 h-4"
                                />
                                <span>No</span>
                              </label>
                            </div>
                          )}
                          {(item.data_type === "SingleSelect" ||
                            item.data_type === "MultiSelect") && (
                            <div className="space-y-2">
                              {item.options?.map((opt) => (
                                <label
                                  key={opt.option_id}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type={
                                      item.data_type === "SingleSelect"
                                        ? "radio"
                                        : "checkbox"
                                    }
                                    disabled
                                    className="w-4 h-4"
                                  />
                                  <span>{opt.option_value}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {matrixData &&
                  matrixData.rows.length > 0 &&
                  matrixData.columns.length > 0 && (
                    <div className="overflow-x-auto mt-4">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-bg-secondary">
                            <th className="border border-border px-4 py-3 text-left font-semibold text-text-primary">
                              Row
                            </th>
                            {matrixData.columns.map((column, index) => (
                              <th
                                key={`${section.id}_col_${index}`}
                                className="border border-border px-4 py-3 text-left font-semibold text-text-primary"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {matrixData.rows.map((row, rowIndex) => (
                            <tr key={`${section.id}_row_${rowIndex}`}>
                              <td className="border border-border px-4 py-3 font-medium text-text-primary">
                                {row}
                              </td>
                              {matrixData.columns.map((_, colIndex) => (
                                <td
                                  key={`${section.id}_cell_${rowIndex}_${colIndex}`}
                                  className="border border-border px-4 py-3"
                                />
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-surface-white p-4">
        <h4 className="font-semibold text-text-primary mb-2">Summary</h4>
        <ul className="space-y-1 text-sm text-text-primary">
          <li>
            • Sections configured:{" "}
            <strong>
              {completedSections}/{state.sections.length}
            </strong>
          </li>
          <li>
            • Total fields: <strong>{totalFields}</strong>
          </li>
          <li>
            • Template name: <strong>{templateName.trim() || "Not set"}</strong>
          </li>
        </ul>
      </div>

      <div className="sticky bottom-0 -mx-4 flex gap-3 justify-between border-t border-border bg-surface-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <button
          onClick={() => onBack(templateName, templateDescription)}
          disabled={isPublishing}
          className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface-white px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-secondary disabled:opacity-50"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>
        <button
          onClick={handlePublish}
          disabled={isPublishing || !templateName.trim()}
          className={`flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            isPublishing || !templateName.trim()
              ? "cursor-not-allowed bg-border text-text-secondary"
              : "bg-primary text-white hover:bg-primary-hover"
          }`}
        >
          {isPublishing ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <FiCheck className="w-4 h-4" />
              Publish Template
            </>
          )}
        </button>
      </div>
    </div>
  );
}
