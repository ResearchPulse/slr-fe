import api from "../config/axios";
import type { AxiosResponse } from "axios";
import type {
  ExtractionTemplateDto,
  ExtractionTemplateResponseDto,
  ExtractionTemplateInputDto,
  ExtractionSectionDto,
  ExtractionFieldDto,
  ExtractionMatrixColumnDto,
  FieldOptionDto,
  SectionTypeEnum,
  DataItemDefinitionExtended,
  FieldOption,
} from "../types/dataExtraction";
import type { MatrixSectionData } from "../types/templateWizard";
import type { WizardSection } from "../types/templateWizard";
import { SectionTypeEnum as TemplateSectionTypeEnum } from "../types/dataExtraction";
import {
  FRONTEND_TO_BACKEND_TYPE,
  BACKEND_TO_FRONTEND_TYPE,
} from "../constants/dataExtraction";
import { TEMPLATE_SECTIONS } from "../constants/templateSections";




// ==================== MAPPING FUNCTIONS ====================

function mapFieldOptionToBackend(option: FieldOption): FieldOptionDto {
  return {
    optionId: option.option_id || null,
    fieldId: option.field_id || null,
    value: option.option_value,
    displayOrder: option.display_order,
  };
}

function mapFieldOptionFromBackend(dto: FieldOptionDto): FieldOption {
  return {
    option_id: dto.optionId || "",
    field_id: dto.fieldId || "",
    option_value: dto.value,
    display_order: dto.displayOrder,
  };
}

function mapExtractionFieldToBackend(
  field: DataItemDefinitionExtended
): ExtractionFieldDto {
  return {
    fieldId: field.data_item_id || null,
    sectionId: field.form_id || null,
    parentFieldId: field.parent_field_id || null,
    name: field.name,
    instruction: field.description || undefined,
    fieldType: FRONTEND_TO_BACKEND_TYPE[field.data_type],
    isRequired: field.is_required,
    orderIndex: field.display_order,
    options: (field.options || []).map(mapFieldOptionToBackend),
    subFields: (field.subItems || []).map(mapExtractionFieldToBackend),
  };
}

function mapExtractionFieldFromBackend(
  dto: ExtractionFieldDto,
  formId: string
): DataItemDefinitionExtended {
  return {
    data_item_id: dto.fieldId || "",
    form_id: formId,
    parent_field_id: dto.parentFieldId ?? undefined,
    name: dto.name,
    data_type: BACKEND_TO_FRONTEND_TYPE[dto.fieldType] || "Text",
    description: dto.instruction || "",
    is_required: dto.isRequired,
    display_order: dto.orderIndex,
    options: dto.options.map(mapFieldOptionFromBackend),
    subItems: dto.subFields.map((sub) => mapExtractionFieldFromBackend(sub, formId)),
  };
}

function sanitizeFieldForBackend(field: ExtractionFieldDto): ExtractionFieldDto {
  return {
    ...field,
    options: field.options.map((option) => ({ ...option })),
    subFields: field.subFields.map(sanitizeFieldForBackend),
  };
}

function mapTemplateSectionType(type: "flat" | "matrix"): SectionTypeEnum {
  return type === "matrix"
    ? TemplateSectionTypeEnum.MatrixGrid
    : TemplateSectionTypeEnum.FlatForm;
}

function sanitizeSectionForBackend(section: ExtractionSectionDto): ExtractionSectionDto {
  return {
    ...section,
    isPicoc: section.isPicoc ?? false,
    fields: section.fields.map(sanitizeFieldForBackend),
    matrixColumns: section.matrixColumns?.map((column) => ({ ...column })),
  };
}

function buildSectionsFromLegacyFields(
  fields: ExtractionFieldDto[]
): ExtractionSectionDto[] {
  const grouped = new Map<string, ExtractionFieldDto[]>();

  for (const field of fields || []) {
    const sectionId = field.sectionId || "identification";
    const list = grouped.get(sectionId) || [];
    list.push(field);
    grouped.set(sectionId, list);
  }

  const sections = [...TEMPLATE_SECTIONS]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((section) => ({
      name: section.name,
      orderIndex: section.orderIndex,
      sectionType: mapTemplateSectionType(section.type),
      fields: grouped.get(section.id) || [],
    }))
    .filter((section) => section.fields.length > 0);

  return sections.length > 0
    ? sections
    : [
        {
          name: "Identification",
          orderIndex: 1,
          sectionType: TemplateSectionTypeEnum.FlatForm,
          fields,
        },
      ];
}

function mapExtractionTemplateToBackend(
  template: ExtractionTemplateDto
): ExtractionTemplateDto {
  const sections =
    template.sections && template.sections.length > 0
      ? template.sections
      : buildSectionsFromLegacyFields(template.fields || []);

  return {
    ...template,
    sections: sections.map(sanitizeSectionForBackend),
  };
}


/**
 * Preserve canonical fields, nested structures, and matrix metadata.
 */
export function sanitizeExtractionTemplateInput(
  template: ExtractionTemplateDto
): ExtractionTemplateDto {
  return mapExtractionTemplateToBackend(template);
}

// ==================== API SERVICE ====================


interface CanonicalApiResponse<T> {
  success: boolean;
  data: T;
}

function unwrapCanonicalResponse<T>(response: AxiosResponse<CanonicalApiResponse<T>>): T {
  if (!response.data.success) {
    throw new Error("Extraction API request failed");
  }

  return response.data.data;
}


export const dataExtractionTemplateService = {
  async list(projectId: string): Promise<ExtractionTemplateResponseDto[]> {
    const response = await api.get<CanonicalApiResponse<{ templates: ExtractionTemplateResponseDto[] }>>(
      `/projects/${projectId}/extraction/templates`
    );
    return unwrapCanonicalResponse(response).templates;
  },

  async create(projectId: string, template: ExtractionTemplateInputDto): Promise<ExtractionTemplateResponseDto> {
    const response = await api.post<CanonicalApiResponse<ExtractionTemplateResponseDto>>(
      `/projects/${projectId}/extraction/templates`,
      {
        name: template.name,
        description: template.description,
        sections: template.sections,
        fields: template.fields,
      }
    );
    return unwrapCanonicalResponse(response);
  },

  async update(
    projectId: string,
    templateId: string,
    template: ExtractionTemplateInputDto & { expectedVersion: number }
  ): Promise<ExtractionTemplateResponseDto> {
    const response = await api.put<CanonicalApiResponse<ExtractionTemplateResponseDto>>(
      `/projects/${projectId}/extraction/templates/${templateId}`,
      {
        name: template.name,
        description: template.description,
        sections: template.sections,
        fields: template.fields,
        expectedVersion: template.expectedVersion,
      }
    );
    return unwrapCanonicalResponse(response);
  },

  async clone(projectId: string, templateId: string, name: string): Promise<ExtractionTemplateResponseDto> {
    const response = await api.post<CanonicalApiResponse<ExtractionTemplateResponseDto>>(
      `/projects/${projectId}/extraction/templates/${templateId}/clone`,
      { name }
    );
    return unwrapCanonicalResponse(response);
  },

  async delete(projectId: string, templateId: string): Promise<void> {
    const response = await api.delete<CanonicalApiResponse<unknown>>(
      `/projects/${projectId}/extraction/templates/${templateId}`
    );
    unwrapCanonicalResponse(response);
  },
};

// ==================== HELPER FUNCTIONS FOR FRONTEND ====================

/**
 * Convert DataItemDefinitionExtended array to ExtractionTemplateDto
 * Used when saving form data to backend
 */
export function dataItemsToTemplate(
  dataItems: DataItemDefinitionExtended[],
  projectId: string,
  templateName: string,
  templateDescription?: string,
  templateId?: string,
  matrixDataMap?: Map<string, MatrixSectionData>,
  wizardSections?: WizardSection[],
  matrixColumnsBySection?: Map<string, ExtractionMatrixColumnDto[]>
): ExtractionTemplateDto {

  // ✅ Filter root-level items only (no parent_field_id)
  const rootItems = (dataItems || []).filter((item) => !item.parent_field_id);


  // Group by wizard section id (form_id)
  const groupedItems = new Map<string, DataItemDefinitionExtended[]>();
  for (const item of rootItems) {
    const sectionId = item.form_id || "identification";
    const items = groupedItems.get(sectionId) || [];
    items.push(item);
    groupedItems.set(sectionId, items);
  }

  const mapMatrixColumns = (sectionId: string): ExtractionMatrixColumnDto[] => {
    const existingColumns = matrixColumnsBySection?.get(sectionId);
    if (existingColumns) {
      return existingColumns.map((column) => ({ ...column }));
    }

    const columns = matrixDataMap?.get(sectionId)?.columns || [];
    return columns.map((columnName, index) => ({
      name: columnName,
      orderIndex: index + 1,
    }));
  };

  const sectionsFromWizard: ExtractionSectionDto[] = (wizardSections || [])
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((section) => {
      const sectionItems = [...(groupedItems.get(section.id) || [])].sort(
        (a, b) => a.display_order - b.display_order
      );

      return {
        sectionId: section.id,
        name: section.name,
        orderIndex: section.orderIndex,
        sectionType: section.sectionType,
        isPicoc: section.isPicoc ?? false,
        linkedResearchQuestionId: section.linkedResearchQuestionId ?? null,
        fields: sectionItems.map((item, index) =>
          mapExtractionFieldToBackend({
            ...item,
            display_order: index + 1,
          })
        ),
        matrixColumns:
          section.sectionType === TemplateSectionTypeEnum.MatrixGrid
            ? mapMatrixColumns(section.id)
            : undefined,
      };
    });

  const sectionsFallback: ExtractionSectionDto[] = [...TEMPLATE_SECTIONS]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((section) => {
      const sectionType = mapTemplateSectionType(section.type);
      const sectionItems = [...(groupedItems.get(section.id) || [])].sort(
        (a, b) => a.display_order - b.display_order
      );

      return {
        name: section.name,
        orderIndex: section.orderIndex,
        sectionType,
        fields: sectionItems.map((item, index) =>
          mapExtractionFieldToBackend({
            ...item,
            display_order: index + 1,
          })
        ),
        matrixColumns:
          sectionType === TemplateSectionTypeEnum.MatrixGrid
            ? mapMatrixColumns(section.id)
            : undefined,
      };
    });

  const sections = sectionsFromWizard.length > 0 ? sectionsFromWizard : sectionsFallback;


  return {
    templateId,
    projectId,
    name: templateName || "Untitled Template",
    description: templateDescription,
    sections,
    fields: sections.flatMap((section) => section.fields),
  };
}

/**
 * Convert ExtractionTemplateDto to DataItemDefinitionExtended array
 * Used when loading template data from backend
 */
export function templateToDataItems(
  template: ExtractionTemplateDto,
  formId: string
): DataItemDefinitionExtended[] {

  // New API shape: template.sections[].fields[]
  if (template.sections && template.sections.length > 0) {
    const sectionNameToId = new Map(
      TEMPLATE_SECTIONS.map((section) => [section.name, section.id])
    );

    return template.sections.flatMap((section) => {
      const targetFormId =
        section.sectionId ||
        sectionNameToId.get(section.name) ||
        formId;

      return (section.fields || []).map((field) =>
        mapExtractionFieldFromBackend(field, targetFormId)
      );
    });
  }

  // Legacy fallback: template.fields[]
  return (template.fields || []).map((field) =>
    mapExtractionFieldFromBackend(field, formId)
  );
}