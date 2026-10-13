import { useState, useCallback } from "react";
import { dataExtractionTemplateService } from "../services/dataExtractionService";
import type {
  ExtractionTemplateDto,
  ExtractionTemplateInputDto,
  ExtractionTemplateResponseDto,
} from "../types/dataExtraction";
import { toastError, toastSuccess } from "../utils/toast";
type LoadedExtractionTemplate = ExtractionTemplateDto & { version?: number };

interface UseExtractionTemplatesResult {
  templates: ExtractionTemplateDto[];
  isLoading: boolean;
  error: string | null;
  loadTemplates: (projectId: string) => Promise<void>;
  loadTemplate: (projectId: string, templateId: string) => Promise<LoadedExtractionTemplate | null>;
  saveTemplate: (
    projectId: string,
    template: ExtractionTemplateInputDto,
    templateId?: string,
    expectedVersion?: number,
  ) => Promise<ExtractionTemplateResponseDto | null>;
  deleteTemplate: (projectId: string, templateId: string) => Promise<boolean>;
}

export function useExtractionTemplates(): UseExtractionTemplatesResult {
  const [templates, setTemplates] = useState<ExtractionTemplateDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async (projectId: string) => {
    if (!projectId) {
      setTemplates([]);
      setError("Project ID is required");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      setTemplates(await dataExtractionTemplateService.list(projectId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load templates";
      setError(message);
      console.error("Failed to load extraction templates:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTemplate = useCallback(async (projectId: string, templateId: string) => {
    const template = templates.find((item) => item.templateId === templateId);
    if (!projectId || !templateId || !template) {
      setError(!projectId ? "Project ID is required" : "Template not found");
      return null;
    }
    return template as LoadedExtractionTemplate;
  }, [templates]);

  const saveTemplate = useCallback(async (
    projectId: string,
    template: ExtractionTemplateInputDto,
    templateId?: string,
    expectedVersion?: number,
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      let savedTemplate: ExtractionTemplateResponseDto;
      if (templateId) {
        if (expectedVersion === undefined) {
          throw new Error("Template version is required to update an existing template.");
        }
        savedTemplate = await dataExtractionTemplateService.update(projectId, templateId, {
          ...template,
          expectedVersion,
        });
      } else {
        savedTemplate = await dataExtractionTemplateService.create(projectId, template);
      }
      setTemplates((prev) => {
        const index = prev.findIndex((item) => item.templateId === savedTemplate.templateId);
        if (index < 0) return [...prev, savedTemplate];
        const updated = [...prev];
        updated[index] = savedTemplate;
        return updated;
      });
      toastSuccess(
        templateId ? "Template Updated" : "Template Created",
        `Extraction template ${templateId ? "updated" : "created"} successfully.`,
      );
      return savedTemplate;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save template";
      setError(message);
      console.error("Failed to save template:", err);
      toastError("Save Failed", message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (projectId: string, templateId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await dataExtractionTemplateService.delete(projectId, templateId);
      setTemplates((prev) => prev.filter((item) => item.templateId !== templateId));
      toastSuccess("Template Deleted", "Extraction template has been deleted.");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete template";
      setError(message);
      console.error("Failed to delete template:", err);
      toastError("Delete Failed", message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { templates, isLoading, error, loadTemplates, loadTemplate, saveTemplate, deleteTemplate };
}