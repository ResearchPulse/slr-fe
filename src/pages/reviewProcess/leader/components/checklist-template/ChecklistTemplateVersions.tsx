import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../../../../components/ui/Table";
import Button from "../../../../../components/ui/Button";
import LoadingSpinner from "../../../../../components/ui/LoadingSpinner";
import { useStudySelectionChecklistTemplate } from "../../../../../hooks/useStudySelectionChecklistTemplate";
import {
  RiEyeLine,
  RiCheckboxCircleLine,
  RiHistoryLine,
  RiAddLine,
} from "react-icons/ri";
import { ChecklistTemplateDetailModal } from "./ChecklistTemplateDetailModal";
import { DocumentAuthoringModal } from "../../../../../components/ui/document-editor/DocumentAuthoringModal";
import { toastSuccess, toastError } from "../../../../../utils/toast";
import type { CreateStudySelectionChecklistTemplateRequest } from "../../../../../types/studySelectionChecklistTemplate";

interface ChecklistTemplateVersionsProps {
  projectId: string;
}

export const ChecklistTemplateVersions: React.FC<
  ChecklistTemplateVersionsProps
> = ({ projectId }) => {
  const { screeningProcessId } = useParams<{ screeningProcessId: string }>();
  const {
    templates,
    isLoading,
    error,
    createTemplate,
    isCreating,
    activateTemplate,
    isActivating,
  } = useStudySelectionChecklistTemplate(projectId);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const handleViewDetail = (id: string) => {
    setSelectedTemplateId(id);
    setIsDetailModalOpen(true);
  };

  const handleActivateTemplate = async (templateId: string) => {
    try {
      const response = await activateTemplate(templateId);
      if (response.isSuccess) {
        toastSuccess("Success", "Template activated successfully!");
      } else {
        toastError("Error", response.message || "Failed to activate template");
      }
    } catch (err: any) {
      toastError("Error", err.message || "An unexpected error occurred");
    }
  };

  const handleCreateTemplate = async (
    data: CreateStudySelectionChecklistTemplateRequest | null,
  ) => {
    if (!data) {
      toastError(
        "Creation Failed",
        "Please provide at least some information for the template.",
      );
      return;
    }

    try {
      const response = await createTemplate(data);
      if (response.isSuccess) {
        toastSuccess("Success", "Template created successfully!");
        setIsCreateModalOpen(false);
      } else {
        toastError("Error", response.message || "Failed to create template");
      }
    } catch (err: any) {
      toastError("Error", err.message || "An unexpected error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <LoadingSpinner size="lg" />
        <p className="text-text-secondary font-medium mt-4">
          Loading templates...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/20 bg-surface-white p-8 text-center" role="alert">
        <p className="font-medium text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-1 motion-safe:duration-150 motion-reduce:animate-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-text-primary sm:gap-3 sm:text-2xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-secondary text-accent sm:h-10 sm:w-10">
              <RiHistoryLine size={24} />
            </div>
            Template Versions
          </h3>
          <p className="mt-1 text-sm font-medium text-text-secondary">
            Manage your study selection checklist templates and versions
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full justify-center rounded-xl px-4 py-2.5 font-bold shadow-none transition-transform duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transition-none sm:w-auto sm:px-6 sm:py-3"
        >
          <RiAddLine className="mr-2" size={20} />
          Create Template
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {templates.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface-white p-5 text-center text-sm text-text-secondary">
            No templates found
          </p>
        ) : (
          templates.map((template) => (
            <article key={template.id} className="min-w-0 rounded-xl border border-border bg-surface-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-lg bg-bg-secondary px-2.5 py-1 text-xs font-bold text-accent">
                      v{template.version}
                    </span>
                    {template.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">
                        <RiCheckboxCircleLine aria-hidden="true" size={13} />
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full border border-border bg-bg-secondary px-2 py-1 text-[11px] font-semibold text-text-secondary">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h4 className="break-words text-sm font-semibold text-text-primary">{template.name}</h4>
                  <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-text-secondary">
                    {template.description || "No description"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-11 flex-1 text-text-secondary hover:text-accent"
                  onClick={() => handleViewDetail(template.id)}
                >
                  <RiEyeLine className="mr-1.5" aria-hidden="true" />
                  View Detail
                </Button>
                <Button
                  size="sm"
                  className="min-h-11 flex-1"
                  disabled={template.isActive || isActivating}
                  onClick={() => handleActivateTemplate(template.id)}
                >
                  {template.isActive ? "Active" : "Activate"}
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface-white shadow-none md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent cursor-default">
              <TableHead>Version</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow className="hover:bg-transparent cursor-default">
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-text-secondary"
                >
                  No templates found
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <span className="font-black text-accent bg-bg-secondary px-3 py-1 rounded-xl text-sm">
                      v{t.version}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-text-primary">
                    {t.name}
                  </TableCell>
                  <TableCell className="text-text-secondary max-w-xs truncate">
                    {t.description || "No description"}
                  </TableCell>
                  <TableCell>
                    {t.isActive ? (
                      <span className="flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                        <RiCheckboxCircleLine size={14} />
                        Active
                      </span>
                    ) : (
                      <span className="text-text-secondary text-xs font-bold bg-bg-secondary px-2.5 py-1 rounded-full border border-border">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-text-secondary hover:text-accent"
                        onClick={() => handleViewDetail(t.id)}
                      >
                        <RiEyeLine className="mr-1.5" />
                        View Detail
                      </Button>
                      <Button
                        size="sm"
                        disabled={t.isActive || isActivating}
                        onClick={() => handleActivateTemplate(t.id)}
                      >
                        {t.isActive ? "Active" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ChecklistTemplateDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        projectId={projectId}
        templateId={selectedTemplateId}
      />

      <DocumentAuthoringModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTemplate}
        isSubmitting={isCreating}
        title="Create Template"
        description="Design your document structure with real-time preview."
        submitText="Create Template"
        screeningProcessId={screeningProcessId}
        allowImportCriterias={true}
      />
    </div>
  );
};
