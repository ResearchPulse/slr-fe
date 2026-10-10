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
      <div className="p-8 text-center bg-surface-white rounded-xl border border-red-100">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-accent">
              <RiHistoryLine size={24} />
            </div>
            Template Versions
          </h3>
          <p className="text-text-secondary font-medium text-sm mt-1">
            Manage your study selection checklist templates and versions
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl px-6 py-3 font-bold shadow-none shadow-primary/10 transition-all hover:-translate-y-0.5"
        >
          <RiAddLine className="mr-2" size={20} />
          Create Template
        </Button>
      </div>

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden shadow-none">
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
                      <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
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
