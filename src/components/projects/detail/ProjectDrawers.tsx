import React from "react";
import Drawer from "../../ui/Drawer";
import ReviewNeedForm from "../ReviewNeedForm";
import DocumentForm from "../DocumentForm";
import ObjectiveForm from "../ObjectiveForm";
import ResearchQuestionForm from "../ResearchQuestionForm";
import PICOCForm from "../PICOCForm";
import type { QuestionType } from "../../../types/coreAndGovernance";
import type { PICOCElementType } from "../PICOCForm";

interface ProjectDrawersProps {
  isNeedModalOpen: boolean;
  onCloseNeed: () => void;
  isDocModalOpen: boolean;
  onCloseDoc: () => void;
  isObjModalOpen: boolean;
  onCloseObj: () => void;
  isQuestionModalOpen: boolean;
  onCloseQuestion: () => void;
  isPICOCModalOpen: boolean;
  onClosePICOC: () => void;
  isSubmitting: boolean;
  questionTypes: QuestionType[];
  onAddNeed: (data: {
    description: string;
    justification: string;
    identified_by: string;
  }) => void;
  onAddDocument: (data: {
    sponsor: string;
    scope: string;
    budget: number;
    document_url: string;
  }) => void;
  onAddObjective: (data: { objective_statement: string }) => void;
  onAddQuestion: (data: {
    question_type_id: string;
    question_text: string;
    rationale: string;
  }) => void;
  onAddPICOC: (data: {
    element_type: PICOCElementType;
    description: string;
  }) => void;
}

const ProjectDrawers: React.FC<ProjectDrawersProps> = ({
  isNeedModalOpen,
  onCloseNeed,
  isDocModalOpen,
  onCloseDoc,
  isObjModalOpen,
  onCloseObj,
  isQuestionModalOpen,
  onCloseQuestion,
  isPICOCModalOpen,
  onClosePICOC,
  isSubmitting,
  questionTypes,
  onAddNeed,
  onAddDocument,
  onAddObjective,
  onAddQuestion,
  onAddPICOC,
}) => {
  return (
    <div>
      <Drawer
        isOpen={isNeedModalOpen}
        onClose={onCloseNeed}
        title="Identification of Research Gap"
        side="right"
        maxWidth="max-w-xl"
      >
        <div className="drawer-stagger-item">
          <ReviewNeedForm
            onSubmit={onAddNeed}
            onCancel={onCloseNeed}
            isLoading={isSubmitting}
          />
        </div>
      </Drawer>

      <Drawer
        isOpen={isDocModalOpen}
        onClose={onCloseDoc}
        title="Commission Document"
        side="right"
        maxWidth="max-w-xl"
      >
        <div className="drawer-stagger-item">
          <DocumentForm
            onSubmit={onAddDocument}
            onCancel={onCloseDoc}
            isLoading={isSubmitting}
          />
        </div>
      </Drawer>

      <Drawer
        isOpen={isObjModalOpen}
        onClose={onCloseObj}
        title="Define Review Objective"
        side="right"
        maxWidth="max-w-xl"
      >
        <div className="drawer-stagger-item">
          <ObjectiveForm
            onSubmit={onAddObjective}
            onCancel={onCloseObj}
            isLoading={isSubmitting}
          />
        </div>
      </Drawer>

      <Drawer
        isOpen={isQuestionModalOpen}
        onClose={onCloseQuestion}
        title="Formulate Research Question"
        side="right"
        maxWidth="max-w-xl"
      >
        <div className="drawer-stagger-item">
          <ResearchQuestionForm
            questionTypes={questionTypes}
            onSubmit={onAddQuestion}
            onCancel={onCloseQuestion}
            isLoading={isSubmitting}
          />
        </div>
      </Drawer>

      <Drawer
        isOpen={isPICOCModalOpen}
        onClose={onClosePICOC}
        title="Define PICOC Element"
        side="right"
        maxWidth="max-w-xl"
      >
        <div className="drawer-stagger-item">
          <PICOCForm
            onSubmit={onAddPICOC}
            onCancel={onClosePICOC}
            isLoading={isSubmitting}
          />
        </div>
      </Drawer>
    </div>
  );
};

export default ProjectDrawers;
