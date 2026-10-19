import React from "react";
import type { StudySelectionChecklistTemplate } from "../../../../../types/studySelectionChecklistTemplate";
import { PreviewDocument } from "../../../../../components/ui/document-editor/PreviewDocument";

interface ChecklistTemplatePreviewProps {
  template: StudySelectionChecklistTemplate;
}

export const ChecklistTemplatePreview: React.FC<
  ChecklistTemplatePreviewProps
> = ({ template }) => {
  return (
    <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 motion-reduce:animate-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-text-primary tracking-tight">
            Document Preview
          </h3>
          <p className="text-text-secondary font-medium text-sm">
            Review the layout and content of your master eligibility checklist
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <PreviewDocument template={template} />
      </div>
    </div>
  );
};
