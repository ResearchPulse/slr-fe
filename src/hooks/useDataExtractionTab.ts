import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useExtractionTemplates } from "./useExtractionTemplates";
import { templateToDataItems, dataItemsToTemplate } from "../services/dataExtractionService";
import type { DataItemDefinitionExtended, ExtractionTemplateDto } from "../types/dataExtraction";
import { generateId } from "../utils/uuid";

interface UseDataExtractionTabResult {
  templates: ExtractionTemplateDto[];
  currentTemplate: ExtractionTemplateDto | null;
  dataItems: DataItemDefinitionExtended[];
  isLoading: boolean;
  error: string | null;
  handleSelectTemplate: (templateId: string) => Promise<void>;
  handleDeleteTemplate: (templateId: string) => Promise<boolean>;
  handleCreateNewTemplate: () => void;
  handleDataItemsChange: (items: DataItemDefinitionExtended[]) => void;
  handleUpdateTemplateMeta: (name: string, description?: string) => void;
  getCurrentTemplateData: () => ExtractionTemplateDto | null;
  refreshTemplates: () => void;
}

export function useDataExtractionTab(): UseDataExtractionTabResult {
  const { projectId = "" } = useParams<{ projectId?: string }>();
  const {
    templates,
    isLoading,
    error,
    loadTemplates,
    loadTemplate,
    deleteTemplate,
  } = useExtractionTemplates();

  const [currentTemplate, setCurrentTemplate] = useState<ExtractionTemplateDto | null>(null);
  const [dataItems, setDataItems] = useState<DataItemDefinitionExtended[]>([]);

  useEffect(() => {
    if (projectId) void loadTemplates(projectId);
  }, [projectId, loadTemplates]);

  const handleSelectTemplate = useCallback(async (templateId: string) => {
    const template = await loadTemplate(projectId, templateId);
    if (template) {
      setCurrentTemplate(template);
      setDataItems(templateToDataItems(template, `form_${generateId()}`));
    }
  }, [loadTemplate, projectId]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    const success = await deleteTemplate(projectId, templateId);
    if (success && currentTemplate?.templateId === templateId) {
      setCurrentTemplate(null);
      setDataItems([]);
    }
    return success;
  }, [deleteTemplate, projectId, currentTemplate]);

  const handleCreateNewTemplate = useCallback(() => {
    setCurrentTemplate({
      projectId,
      name: "",
      description: "",
      sections: [],
      fields: [],
    });
    setDataItems([]);
  }, [projectId]);

  const handleDataItemsChange = useCallback((items: DataItemDefinitionExtended[]) => {
    setDataItems(items);
  }, []);

  const handleUpdateTemplateMeta = useCallback((name: string, description?: string) => {
    setCurrentTemplate((prev) => prev ? { ...prev, name, description: description || "" } : null);
  }, []);

  const getCurrentTemplateData = useCallback((): ExtractionTemplateDto | null => {
    if (!currentTemplate || !projectId || !currentTemplate.name.trim()) return null;
    const templateData = dataItemsToTemplate(
      dataItems,
      projectId,
      currentTemplate.name,
      currentTemplate.description ?? undefined,
      currentTemplate.templateId ?? undefined,
    );
    return {
      ...templateData,
      templateId: currentTemplate.templateId ?? undefined,
      sections: templateData.sections || [],
      fields: templateData.fields || [],
    };
  }, [currentTemplate, projectId, dataItems]);

  const refreshTemplates = useCallback(() => {
    if (projectId) void loadTemplates(projectId);
  }, [projectId, loadTemplates]);

  return {
    templates,
    currentTemplate,
    dataItems,
    isLoading,
    error,
    handleSelectTemplate,
    handleDeleteTemplate,
    handleCreateNewTemplate,
    handleDataItemsChange,
    handleUpdateTemplateMeta,
    getCurrentTemplateData,
    refreshTemplates,
  };
}