import { useParams } from "react-router";
import { FiAlertCircle } from "react-icons/fi";
import type { AIProjectSetupWizardProps } from "./aiSetupWizard/types";
import { AISkeleton } from "./aiSetupWizard/components/Common";
import SetupEditForm from "./aiSetupWizard/components/SetupEditForm";
import SetupSummaryView from "./aiSetupWizard/components/SetupSummaryView";
import SetupWizardFlow from "./aiSetupWizard/components/SetupWizardFlow";
import { useAIProjectSetupState } from "./aiSetupWizard/hooks/useAIProjectSetupState";
import { useProjectMember } from "../../hooks/useProjectMember";

export default function AIProjectSetupWizard({
  embedded = false,
  projectId,
  projectTitle,
  projectDomain,
  onSetupSaved,
  hideEditButton = false,
  hidePicoc = false,
  hideResearchQuestions = false,
}: AIProjectSetupWizardProps) {
  const { id: routeProjectId } = useParams<{ id: string }>();
  const resolvedProjectId = projectId ?? routeProjectId ?? "";

  const state = useAIProjectSetupState(resolvedProjectId, onSetupSaved);
  const { member } = useProjectMember(resolvedProjectId);
  const isLeader = member?.isLeader ?? false;

  if (state.isLoadingSetup) {
    return (
      <div
        className={[
          embedded
            ? "bg-transparent"
            : "min-h-screen bg-bg-primary px-4 py-8",
        ].join(" ")}
      >
        <div className="mx-auto max-w-6xl">
          <AISkeleton title="Loading existing setup details..." />
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        embedded
          ? "bg-transparent"
          : "min-h-screen bg-bg-primary px-4 py-8",
      ].join(" ")}
    >
      <div className="mx-auto max-w-6xl">
        {state.viewMode === "wizard" && (
          <div className="mb-6 border-b border-border pb-5">
            <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
              Review protocol
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-text-secondary">
              Define the scope, objectives, research questions, and review criteria.
            </p>
          </div>
        )}

        {state.viewMode === "wizard" &&
          (isLeader ? (
            <SetupWizardFlow
              currentStep={state.currentStep}
              completionMap={state.completionMap}
              isAnalyzingIdea={state.isAnalyzingIdea}
              isGeneratingPicoc={state.isGeneratingPicoc}
              isGeneratingRQ={state.isGeneratingRQ}
              isSavingSetup={state.isSavingSetup}
              topic={state.topic}
              scopeForm={state.scopeForm}
              picocForm={state.picocForm}
              rqOptions={state.rqOptions}
              selectedRqIndexes={state.selectedRqIndexes}
              customRQInput={state.customRQInput}
              customRQs={state.customRQs}
              finalizedWizardRQs={state.finalizedWizardRQs}
              isStep2Valid={state.isStep2Valid}
              isStep3Valid={state.isStep3Valid}
              onSetCurrentStep={state.setCurrentStep}
              onTopicChange={state.setTopic}
              onScopeChange={(field, value) =>
                state.setScopeForm((prev) => ({
                  ...prev,
                  [field]: value,
                }))
              }
              onPicocChange={(field, value) =>
                state.setPicocForm((prev) => ({
                  ...prev,
                  [field]: value,
                }))
              }
              onCustomRQInputChange={state.setCustomRQInput}
              onAnalyzeIdea={() => void state.handleAnalyzeIdea()}
              onGeneratePicoc={() => void state.handleGeneratePicoc()}
              onGenerateRQ={() => void state.handleGenerateRQ()}
              onToggleSuggestedRQ={state.handleToggleSuggestedRQ}
              onAddCustomRQ={state.handleAddCustomRQ}
              onRemoveCustomRQ={state.handleRemoveCustomRQ}
              onConfirmAndReview={state.handleConfirmAndReview}
              onSaveWizardSetup={() => void state.handleSaveWizardSetup()}
            />
          ) : (
            <div className="border-l-2 border-accent bg-bg-primary px-4 py-3">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="mt-0.5 shrink-0 text-text-secondary" />
                <p className="text-sm leading-6 text-text-secondary">
                  The review protocol has not been completed. A project leader
                  must complete the initial setup.
                </p>
              </div>
            </div>
          ))}

        {state.viewMode === "summary" && (
          <div>
            <SetupSummaryView
              topic={state.topic}
              projectTitle={projectTitle}
              projectDomain={projectDomain}
              scopeForm={state.scopeForm}
              picocForm={state.picocForm}
              researchQuestions={state.editResearchQuestions}
              onEdit={state.handleEnterEditMode}
              isLeader={isLeader}
              hideEditButton={hideEditButton}
              hidePicoc={hidePicoc}
              hideResearchQuestions={hideResearchQuestions}
            />
          </div>
        )}

        {state.viewMode === "edit" && isLeader && (
          <div className="rounded-xl border border-border bg-surface-white p-6 shadow-none sm:p-8">
            <SetupEditForm
              picocForm={state.picocForm}
              editResearchQuestions={state.editResearchQuestions}
              editNewRQInput={state.editNewRQInput}
              isSavingSetup={state.isSavingSetup}
              onPicocChange={(field, value) =>
                state.setPicocForm((prev) => ({
                  ...prev,
                  [field]: value,
                }))
              }
              onEditRQTextChange={state.handleEditRQTextChange}
              onDeleteEditRQ={state.handleDeleteEditRQ}
              onEditNewRQInputChange={state.setEditNewRQInput}
              onAddEditRQ={state.handleAddEditRQ}
              onCancel={state.handleCancelEditMode}
              onSave={() =>
                void state.handleSaveSetup(state.editResearchQuestions)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
