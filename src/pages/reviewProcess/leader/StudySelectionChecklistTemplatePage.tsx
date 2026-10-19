import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useStudySelectionChecklistTemplate } from "../../../hooks/useStudySelectionChecklistTemplate";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import Button from "../../../components/ui/Button";

import { RiFileList3Line, RiAddLine } from "react-icons/ri";
import { DocumentAuthoringModal } from "../../../components/ui/document-editor/DocumentAuthoringModal";
import { toastSuccess, toastError } from "../../../utils/toast";
import type { CreateStudySelectionChecklistTemplateRequest } from "../../../types/studySelectionChecklistTemplate";
import { ChecklistTemplateVersions } from "./components/checklist-template/ChecklistTemplateVersions";

const StudySelectionChecklistTemplatePage: React.FC = () => {
  const { projectId, screeningProcessId } = useParams<{
    projectId: string;
    screeningProcessId: string;
  }>();
  const { templates, isLoading, error, createTemplate, isCreating } =
    useStudySelectionChecklistTemplate(projectId);

  const [isModalOpen, setIsModalOpen] = useState(false);

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
        setIsModalOpen(false);
      } else {
        toastError("Error", response.message || "Failed to create template");
      }
    } catch (err: any) {
      toastError("Error", err.message || "An unexpected error occurred");
    }
  };

  if (isLoading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && templates.length === 0) {
    return (
      <div className="rounded-xl border border-error/20 bg-error/5 p-8 text-center">
        <p className="font-medium text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none sm:space-y-8">
      {templates.length > 0 ? (
        <div className="min-w-0">
          <div className="relative min-h-0 min-w-0 overflow-hidden rounded-xl border border-border/80 bg-surface-white p-4 shadow-none sm:p-6 lg:min-h-[700px] lg:p-10">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-bg-secondary/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <ChecklistTemplateVersions projectId={projectId!} />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto flex max-w-4xl flex-col items-center overflow-hidden rounded-xl border border-border/80 bg-surface-white p-5 text-center shadow-none sm:p-8 lg:p-20">
          {/* Subtle Decorative Background Element */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-bg-secondary/50 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative group mb-8 flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-secondary text-text-secondary/50 transition-colors hover:border-primary/30 hover:text-accent motion-reduce:transition-none">
            <RiFileList3Line size={48} />
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-bg-primary bg-surface-white text-text-secondary shadow-none transition-colors group-hover:border-primary/30 group-hover:text-accent motion-reduce:transition-none">
              <RiAddLine size={18} />
            </div>
          </div>
          <h2 className="mb-4 text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
            Initialize Eligibility Framework
          </h2>
          <p className="mb-8 text-base font-medium leading-relaxed text-text-secondary sm:mb-12 sm:text-lg">
            Every robust systematic review starts with clear, pre-defined
            eligibility criteria. Your checklist template will serve as the
            single source of truth for all study screening decisions.
          </p>
          <Button
            onClick={() => {
              setIsModalOpen(true);
            }}
            className="h-auto w-full rounded-xl px-4 py-4 text-base font-bold shadow-none transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none sm:w-auto sm:px-8 sm:py-5 sm:text-lg lg:px-12 lg:py-7 lg:text-xl"
          >
            <RiAddLine className="mr-2" size={28} />
            Create Master Template
          </Button>
        </div>
      )}

      <DocumentAuthoringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTemplate}
        isSubmitting={isCreating}
        title="Create Template"
        description="Design your document structure with real-time preview."
        submitText="Create Template"
        template={templates[0] || null}
        screeningProcessId={screeningProcessId}
        allowImportCriterias={true}
      />
    </div>
  );
};

export default StudySelectionChecklistTemplatePage;
