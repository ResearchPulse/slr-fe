import { useState } from "react";
import { FiArrowLeft, FiCheck, FiEdit2, FiLock, FiPlus, FiTrash2 } from "react-icons/fi";
import type { ResearchQuestion } from "../../../../../types/coreAndGovernance";
import type {
  DataItemDefinitionExtended,
  DataItemType,
  FieldOption,
} from "../../../../../types/dataExtraction";
import type { WizardSection } from "../../../../../types/templateWizard";
import { toastWarning } from "../../../../../utils/toast";
import { generateId } from "../../../../../utils/uuid";
import Button from "../../../../ui/Button";
import Input from "../../../../ui/Input";
import Label from "../../../../ui/Label";
import Select from "../../../../ui/Select";
import Textarea from "../../../../ui/Textarea";
import TemplateSectionNavigator from "./TemplateSectionNavigator";

interface Step2_FlatSetupProps {
  section: WizardSection | undefined;
  sections: WizardSection[];
  sectionFieldCounts: Record<string, number>;
  initialItems?: DataItemDefinitionExtended[];
  onComplete: (items: DataItemDefinitionExtended[], nextSectionId?: string) => void;
  researchQuestions?: ResearchQuestion[];
}

interface FieldEditorState {
  id: string;
  name: string;
  fieldType: 0 | 1 | 2 | 3 | 4 | 5;
  required: boolean;
  description: string;
  options: Array<{ id: string; value: string }>;
  subItems: DataItemDefinitionExtended[];
}


const FIELD_TYPES: Array<{ value: 0 | 1 | 2 | 3 | 4 | 5; label: string }> = [
  { value: 0, label: "Text" },
  { value: 1, label: "Number (Integer)" },
  { value: 2, label: "Number (Decimal)" },
  { value: 3, label: "Yes/No" },
  { value: 4, label: "Single Select" },
  { value: 5, label: "Multi Select" },
];

function mapFieldTypeToDataType(
  fieldType: 0 | 1 | 2 | 3 | 4 | 5,
): DataItemType {
  switch (fieldType) {
    case 1:
    case 2:
      return "Number";
    case 3:
      return "Boolean";
    case 4:
      return "SingleSelect";
    case 5:
      return "MultiSelect";
    default:
      return "Text";
  }
}

function mapDataTypeToFieldType(dataType: DataItemType): 0 | 1 | 2 | 3 | 4 | 5 {
  switch (dataType) {
    case "Number":
      return 1;
    case "Boolean":
      return 3;
    case "SingleSelect":
      return 4;
    case "MultiSelect":
      return 5;
    default:
      return 0;
  }
}

function mapInitialItemsToEditableFields(
  initialItems: DataItemDefinitionExtended[],
): FieldEditorState[] {
  return initialItems
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((item) => ({
      id: item.data_item_id,
      name: item.name,
      fieldType: mapDataTypeToFieldType(item.data_type),
      required: item.is_required,
      description: item.description || "",
      options: (item.options || []).map((opt) => ({
        id: opt.option_id,
        value: opt.option_value,
      })),
      subItems: item.subItems ?? [],
    }));
}


export default function Step2_FlatSetup({
  section,
  sections,
  sectionFieldCounts,
  initialItems = [],
  onComplete,
  researchQuestions = [],
}: Step2_FlatSetupProps) {
  const [customFields, setCustomFields] = useState<FieldEditorState[]>(
    mapInitialItemsToEditableFields(initialItems),
  );
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FieldEditorState>({
    id: "",
    name: "",
    fieldType: 0,
    required: false,
    description: "",
    options: [],
    subItems: [],
  });

  const sectionResearchQuestion = section?.linkedResearchQuestionId
    ? researchQuestions.find(
        (rq) => rq.researchQuestionId === section.linkedResearchQuestionId,
      ) || null
    : null;

  if (!section) {
    return <div className="p-4 text-red-600">Invalid section</div>;
  }

  const handleAddCustomField = () => {
    if (!formState.name.trim()) {
      toastWarning("Validation", "Field name is required.");
      return;
    }

    const isSelectField =
      formState.fieldType === 4 || formState.fieldType === 5;
    if (isSelectField && formState.options.length < 2) {
      toastWarning("Validation", "Select fields must have at least 2 options.");
      return;
    }

    if (formState.options.some((opt) => !opt.value.trim())) {
      toastWarning("Validation", "Option values cannot be empty.");
      return;
    }

    const savedField = { ...formState, id: editingFieldId ?? `temp_${generateId()}` };
    setCustomFields((prev) => editingFieldId
      ? prev.map((field) => field.id === editingFieldId ? savedField : field)
      : [...prev, savedField]);

    setFormState({
      id: "",
      name: "",
      fieldType: 0,
      required: false,
      description: "",
      options: [],
      subItems: [],
    });
    setEditingFieldId(null);
    setShowCustomForm(false);
  };

  const handleEditField = (field: FieldEditorState) => {
    setEditingFieldId(field.id);
    setFormState({ ...field, options: field.options.map((option) => ({ ...option })) });
    setShowCustomForm(true);
  };

  const handleRemoveCustomField = (fieldId: string) => {
    setCustomFields((prev) => prev.filter((field) => field.id !== fieldId));
    if (editingFieldId === fieldId) {
      setShowCustomForm(false);
      setEditingFieldId(null);
    }
  };


  const buildItems = (): DataItemDefinitionExtended[] => customFields.map(
      (field, idx) => {
        const options: FieldOption[] = (field.options || []).map(
          (opt, optionIdx) => ({
            option_id: opt.id,
            field_id: field.id,
            option_value: opt.value,
            display_order: optionIdx + 1,
          }),
        );

        return {
          data_item_id: field.id,
          form_id: section.id,
          name: field.name,
          data_type: mapFieldTypeToDataType(field.fieldType),
          description: field.description,
          is_required: field.required,
          display_order: idx + 1,
          options,
          subItems: field.subItems,
        };
      },
    );

  const handleSave = () => {
    if (showCustomForm) {
      toastWarning("Finish field editing", "Save or cancel the field form before leaving this section.");
      return;
    }

    onComplete(buildItems());
  };

  const handleBackToSections = () => {
    handleSave();
  };

  const handleSelectSection = (sectionId: string) => {
    if (sectionId === section.id) return;
    if (showCustomForm) {
      toastWarning("Finish field editing", "Save or cancel the field form before switching sections.");
      return;
    }
    onComplete(buildItems(), sectionId);
  };

  const hasOptionType = formState.fieldType === 4 || formState.fieldType === 5;

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
      <TemplateSectionNavigator
        sections={sections}
        activeSectionId={section.id}
        sectionFieldCounts={sectionFieldCounts}
        onSelect={handleSelectSection}
      />
      <div className="min-w-0 space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBackToSections}
          className="p-2 hover:bg-bg-secondary rounded-xl transition"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-text-primary sm:text-xl">
              {section.name.replace(/^(RQ\d+\s*:\s*)+/i, "$1")}
            </h2>
            {section.isPicoc ? (
              <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                Context
              </span>
            ) : section.linkedResearchQuestionId ? (
              <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
                RQ Linked
              </span>
            ) : section.isLegacy ? (
              <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-secondary" title="Retained for compatibility">
                Compatible section
              </span>
            ) : null}
            {section.isLockedName && (
              <FiLock className="w-4 h-4 text-text-secondary" />
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
            {sectionResearchQuestion
              ? `This section is linked to: ${sectionResearchQuestion.questionText}`
              : section.isPicoc
                ? "Capture study metadata and PICOC context."
                : "Add extraction fields for this section."}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface-white">
        <div className="mb-0 flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Extraction fields</h3>
            <p className="mt-0.5 text-xs text-text-secondary">{customFields.length} fields configured</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">

            {!showCustomForm && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingFieldId(null);
                  setFormState({ id: "", name: "", fieldType: 0, required: false, description: "", options: [], subItems: [] });
                  setShowCustomForm(true);
                }}
              >
                <FiPlus className="mr-2 h-4 w-4" /> Add field
              </Button>
            )}
          </div>
        </div>

        {showCustomForm && (
          <div className="m-3 space-y-3 rounded-lg border border-border bg-bg-primary p-3 sm:m-4 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-text-primary">{editingFieldId ? "Edit field" : "New field"}</h4>
              <span className="text-xs text-text-secondary">Configure the field reviewers will see</span>
            </div>
            <div>
              <Label htmlFor="custom_name">Field Name *</Label>
              <Input
                id="custom_name"
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Primary Outcome"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <Label htmlFor="custom_type">Field Type</Label>
                <Select
                  id="custom_type"
                  value={String(formState.fieldType)}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      fieldType: Number(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5,
                    }))
                  }
                  options={FIELD_TYPES.map((type) => ({
                    value: String(type.value),
                    label: type.label,
                  }))}
                  containerClassName="w-full"
                  className="h-10 rounded-lg px-3.5 pr-5"
                />
              </div>

              <div className="flex items-end">
                <label className="flex min-h-10 items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={formState.required}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        required: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                  />
                  <span>Required</span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="custom_desc">Instruction / Description</Label>
              <Textarea
                id="custom_desc"
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Guidance for reviewers extracting this field..."
                rows={2}
              />
            </div>

            {hasOptionType && (
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="mb-0">Options</Label>
                  <button
                    onClick={() => {
                      const newOption = {
                        id: `opt_${generateId()}`,
                        value: "",
                      };
                      setFormState((prev) => ({
                        ...prev,
                        options: [...prev.options, newOption],
                      }));
                    }}
                    className="text-sm text-accent hover:text-primary-hover font-medium"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="space-y-2">
                  {formState.options.map((opt, idx) => (
                    <div key={opt.id} className="flex gap-2 items-center">
                      <span className="text-sm text-text-secondary w-6">
                        {idx + 1}.
                      </span>
                      <Input
                        value={opt.value}
                        onChange={(e) => {
                          const next = [...formState.options];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setFormState((prev) => ({ ...prev, options: next }));
                        }}
                        placeholder="Option value"
                      />
                      <button
                        onClick={() => {
                          setFormState((prev) => ({
                            ...prev,
                            options: prev.options.filter((_, i) => i !== idx),
                          }));
                        }}
                        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-error/5 hover:text-error"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 border-t border-border pt-4">
              <Button
                variant="primary"
                onClick={handleAddCustomField}
                className="sm:flex-1"
              >
                {editingFieldId ? "Save changes" : "Add field"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCustomForm(false);
                  setEditingFieldId(null);
                  setFormState({ id: "", name: "", fieldType: 0, required: false, description: "", options: [], subItems: [] });
                }}
                className="sm:flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {customFields.length > 0 && (
          <div className="divide-y divide-border px-4 sm:px-5">
            {customFields.map((field, index) => (
              <div
                key={field.id}
                className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 py-3 transition-colors hover:bg-bg-primary/60"
              >
                <span className="w-6 shrink-0 text-xs tabular-nums text-text-muted">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{field.name}</p>
                  {field.description && <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">{field.description}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                  <span className="rounded-md border border-border px-2 py-1 text-[11px] text-text-secondary">
                    {FIELD_TYPES.find((type) => type.value === field.fieldType)?.label ?? mapFieldTypeToDataType(field.fieldType)}
                  </span>
                  <span className={`rounded-md px-2 py-1 text-[11px] ${field.required ? "bg-primary-light text-primary" : "bg-bg-secondary text-text-secondary"}`}>
                    {field.required ? "Required" : "Optional"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" aria-label={`Edit ${field.name}`} onClick={() => handleEditField(field)} className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                    <FiEdit2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`Delete ${field.name}`} onClick={() => handleRemoveCustomField(field.id)} className="rounded-lg p-2 text-text-muted transition-colors hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/25">
                    <FiTrash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {customFields.length === 0 && !showCustomForm && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-medium text-text-primary">No fields in this section yet</p>
            <p className="mt-1 text-xs text-text-secondary">Add a field to capture evidence for this section.</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex gap-3 justify-between border-t border-border bg-surface-white/95 px-3 py-3 backdrop-blur-sm sm:px-4">
        <button
          onClick={handleBackToSections}
          className="min-h-10 rounded-xl border border-border bg-surface-white px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-secondary"
        >
          Back to sections
        </button>
        <button
          onClick={handleSave}
          disabled={showCustomForm}
          className="flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiCheck className="w-4 h-4" />
          Save section
        </button>
      </div>
      </div>
    </div>
  );
}
