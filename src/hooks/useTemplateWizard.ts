import { useCallback, useState } from "react";
import type { ResearchQuestion } from "../types/coreAndGovernance";
import type {
  DataItemDefinitionExtended,
  ExtractionMatrixColumnDto,
  ExtractionTemplateDto,
  ExtractionTemplateResponseDto,
  SectionTypeEnum,
} from "../types/dataExtraction";
import { SectionTypeEnum as SectionType } from "../types/dataExtraction";
import type {
  MatrixSectionData,
  WizardSection,
  WizardState,
  WizardStep,
} from "../types/templateWizard";
import { dataItemsToTemplate } from "../services/dataExtractionService";
import { generateId } from "../utils/uuid";

interface UseTemplateWizardProps {
  projectId: string;
  existingTemplate?: ExtractionTemplateDto | ExtractionTemplateResponseDto | null;
}

function getSectionStep(sectionType: SectionTypeEnum): WizardStep {
  return sectionType === SectionType.MatrixGrid ? 3 : 2;
}

function mapTemplateSectionsToWizardSections(
  template: ExtractionTemplateDto | ExtractionTemplateResponseDto
): WizardSection[] {
  const sections = (template.sections || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);

  return sections.map((section, index) => ({
    id: section.sectionId || `legacy_${index + 1}_${generateId()}`,
    name: section.name,
    orderIndex: section.orderIndex || index + 1,
    sectionType: section.sectionType,
    isPicoc: section.isPicoc ?? false,
    linkedResearchQuestionId: section.linkedResearchQuestionId ?? null,
    isLockedName: Boolean(section.isPicoc || section.linkedResearchQuestionId),
    isLegacy: !section.isPicoc && !section.linkedResearchQuestionId,
  }));
}

function mapTemplateFieldsToSectionData(
  template: ExtractionTemplateDto | ExtractionTemplateResponseDto,
  sections: WizardSection[]
): Map<string, DataItemDefinitionExtended[]> {
  const sectionData = new Map<string, DataItemDefinitionExtended[]>();

  for (const section of template.sections || []) {
    const wizardSection = sections.find((item) =>
      section.sectionId ? item.id === section.sectionId
        : item.name === section.name && item.orderIndex === section.orderIndex
    );
    if (!wizardSection) continue;

    const mapField = (
      field: (typeof section.fields)[number],
      index: number,
    ): DataItemDefinitionExtended => ({
      data_item_id: field.fieldId || `temp_${generateId()}`,
      form_id: wizardSection.id,
      parent_field_id: field.parentFieldId ?? undefined,
      name: field.name,
      data_type: field.fieldType === 1 || field.fieldType === 2
        ? "Number"
        : field.fieldType === 3
          ? "Boolean"
          : field.fieldType === 4
            ? "SingleSelect"
            : field.fieldType === 5
              ? "MultiSelect"
              : "Text",
      description: field.instruction || "",
      is_required: field.isRequired,
      display_order: field.orderIndex || index + 1,
      options: (field.options || []).map((option, optionIndex) => ({
        option_id: option.optionId || `opt_${generateId()}`,
        field_id: field.fieldId || `temp_${generateId()}`,
        option_value: option.value,
        display_order: option.displayOrder || optionIndex + 1,
      })),
      subItems: (field.subFields || []).map(mapField),
    });

    sectionData.set(wizardSection.id, (section.fields || []).map(mapField));
  }

  return sectionData;
}

function mapTemplateMatrixData(
  template: ExtractionTemplateDto | ExtractionTemplateResponseDto,
  sections: WizardSection[],
): Map<string, MatrixSectionData> {
  const matrixData = new Map<string, MatrixSectionData>();
  for (const section of template.sections || []) {
    if (section.sectionType !== SectionType.MatrixGrid) continue;
    const wizardSection = sections.find((item) =>
      section.sectionId ? item.id === section.sectionId
        : item.name === section.name && item.orderIndex === section.orderIndex
    );
    if (!wizardSection) continue;
    matrixData.set(wizardSection.id, {
      rows: (section.fields || [])
        .slice()
        .sort((left, right) => left.orderIndex - right.orderIndex)
        .map((field) => field.name),
      columns: (section.matrixColumns || [])
        .slice()
        .sort((left, right) => left.orderIndex - right.orderIndex)
        .map((column) => column.name),
    });
  }
  return matrixData;
}

function createSuggestedPicocFields(sectionId: string): DataItemDefinitionExtended[] {
  return [
    {
      data_item_id: `temp_${generateId()}`,
      form_id: sectionId,
      name: "Tiêu đề nghiên cứu",
      data_type: "Text",
      description: "Tiêu đề nghiên cứu",
      is_required: true,
      display_order: 1,
      options: [],
      subItems: [],
    },
    {
      data_item_id: `temp_${generateId()}`,
      form_id: sectionId,
      name: "Tác giả",
      data_type: "Text",
      description: "Tác giả của nghiên cứu",
      is_required: false,
      display_order: 2,
      options: [],
      subItems: [],
    },
    {
      data_item_id: `temp_${generateId()}`,
      form_id: sectionId,
      name: "Năm xuất bản",
      data_type: "Number",
      description: "Năm xuất bản",
      is_required: true,
      display_order: 3,
      options: [],
      subItems: [],
    },
    {
      data_item_id: `temp_${generateId()}`,
      form_id: sectionId,
      name: "Phát hiện chính",
      data_type: "Text",
      description: "Phát hiện chính của nghiên cứu",
      is_required: true,
      display_order: 4,
      options: [],
      subItems: [],
    },
    {
      data_item_id: `temp_${generateId()}`,
      form_id: sectionId,
      name: "Kết luận",
      data_type: "Text",
      description: "Kết luận của nghiên cứu",
      is_required: false,
      display_order: 5,
      options: [],
      subItems: [],
    },
  ];
}

export function useTemplateWizard({ projectId, existingTemplate }: UseTemplateWizardProps) {
  const [state, setState] = useState<WizardState>(() => {
    if (existingTemplate) {
      const sections = mapTemplateSectionsToWizardSections(existingTemplate);
      const sectionData = mapTemplateFieldsToSectionData(existingTemplate, sections);

      return {
        currentStep: 1,
        sectionInProgress: null,
        sections,
        sectionData,
        templateMeta: {
          name: existingTemplate.name || "",
          description: existingTemplate.description || "",
        },
        matrixData: mapTemplateMatrixData(existingTemplate, sections),
      };
    }

    return {
      currentStep: 1,
      sectionInProgress: null,
      sections: [],
      sectionData: new Map(),
      templateMeta: {
        name: "",
        description: "",
      },
      matrixData: new Map(),
    };
  });

  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const initializeSectionsForNewTemplate = useCallback((researchQuestions: ResearchQuestion[]) => {
    setState((prev) => {
      if (prev.sections.length > 0) {
        return prev;
      }

      const picocSection: WizardSection = {
        id: `temp_section_${generateId()}`,
        name: "PICOC & Study Metadata",
        orderIndex: 1,
        sectionType: SectionType.FlatForm,
        isPicoc: true,
        linkedResearchQuestionId: null,
        isLockedName: true,
      };

      const picocFields = createSuggestedPicocFields(picocSection.id);

      const rqSections: WizardSection[] = researchQuestions.map((rq, index) => ({
        id: `temp_section_${generateId()}`,
        name: `RQ${index + 1}: ${rq.questionText}`,
        orderIndex: index + 2,
        sectionType: SectionType.FlatForm,
        isPicoc: false,
        linkedResearchQuestionId: rq.researchQuestionId,
        isLockedName: true,
      }));

      return {
        ...prev,
        sections: [picocSection, ...rqSections],
        sectionData: new Map([[picocSection.id, picocFields]]),
        templateMeta: {
          name: prev.templateMeta.name || "RQ-Driven Extraction Template",
          description:
            prev.templateMeta.description ||
            "Template initialized from PICOC context and project Research Questions.",
        },
      };
    });
  }, []);

  const startSectionSetup = useCallback((sectionId: string) => {
    setState((prev) => {
      const section = prev.sections.find((s) => s.id === sectionId);
      if (!section) {
        return prev;
      }

      return {
        ...prev,
        sectionInProgress: sectionId,
        currentStep: getSectionStep(section.sectionType),
      };
    });
  }, []);

  const updateSectionData = useCallback((sectionId: string, items: DataItemDefinitionExtended[]) => {
    setState((prev) => {
      const next = new Map(prev.sectionData);
      next.set(sectionId, items);
      return { ...prev, sectionData: next };
    });
  }, []);

  const updateMatrixData = useCallback((sectionId: string, data: MatrixSectionData) => {
    setState((prev) => {
      const next = new Map(prev.matrixData);
      next.set(sectionId, data);
      return { ...prev, matrixData: next };
    });
  }, []);

  const updateTemplateMeta = useCallback((name: string, description: string) => {
    setState((prev) => ({
      ...prev,
      templateMeta: { name, description },
    }));
  }, []);

  const getCompletedTemplate = useCallback(
    (overrideName?: string, overrideDescription?: string): ExtractionTemplateDto | null => {
      const templateName = overrideName?.trim() || state.templateMeta.name.trim();
      const templateDescription = overrideDescription ?? state.templateMeta.description;

      if (!templateName) {
        return null;
      }

      const allItems = state.sections.flatMap((section) => {
        const sectionItems = state.sectionData.get(section.id) || [];
        const matrix = state.matrixData.get(section.id);
        const items =
          section.sectionType === SectionType.MatrixGrid && matrix
            ? matrix.rows.map((rowName, index) => {
                const existingItem = sectionItems.find((item) => item.name === rowName);
                return {
                  ...existingItem,
                  data_item_id: existingItem?.data_item_id || `temp_${generateId()}`,
                  form_id: section.id,
                  name: rowName,
                  data_type: existingItem?.data_type || "Text",
                  description: existingItem?.description || "",
                  is_required: existingItem?.is_required || false,
                  display_order: index + 1,
                  options: existingItem?.options || [],
                  subItems: existingItem?.subItems || [],
                };
              })
            : sectionItems;
        return items
          .slice()
          .sort((left, right) => left.display_order - right.display_order)
          .map((item, index) => ({
            ...item,
            form_id: section.id,
            display_order: index + 1,
          }));
      });

      const hasMatrixData = Array.from(state.matrixData.values()).some(
        (matrix) => matrix.rows.length > 0 || matrix.columns.length > 0,
      );
      if (allItems.length === 0 && !hasMatrixData) {
        return null;
      }
      const matrixColumnsBySection = new Map<string, ExtractionMatrixColumnDto[]>();
      for (const section of state.sections) {
        if (section.sectionType !== SectionType.MatrixGrid) continue;
        const matrix = state.matrixData.get(section.id);
        if (!matrix) continue;
        const existingSection = existingTemplate?.sections?.find(
          (candidate) => candidate.sectionId === section.id,
        );
        const existingColumns = existingSection?.matrixColumns || [];
        matrixColumnsBySection.set(
          section.id,
          matrix.columns.map((name, index) => ({
            columnId: (
              existingColumns.find((column) => column.name === name) ??
              existingColumns.find((column) => column.orderIndex === index + 1)
            )?.columnId,
            name,
            orderIndex: index + 1,
          })),
        );
      }

      return dataItemsToTemplate(
        allItems,
        projectId,
        templateName,
        templateDescription,
        existingTemplate?.templateId || undefined,
        state.matrixData,
        state.sections,
        matrixColumnsBySection,
      );
    },
    [projectId, existingTemplate, state]
  );

  const resetWizard = useCallback(() => {
    setState({
      currentStep: 1,
      sectionInProgress: null,
      sections: [],
      sectionData: new Map(),
      templateMeta: {
        name: "",
        description: "",
      },
      matrixData: new Map(),
    });
  }, []);

  return {
    state,
    goToStep,
    initializeSectionsForNewTemplate,
    startSectionSetup,
    updateSectionData,
    updateMatrixData,
    updateTemplateMeta,
    getCompletedTemplate,
    resetWizard,
  };
}
