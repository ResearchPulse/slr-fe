import { useParams } from "react-router";
import { FiAlertCircle } from "react-icons/fi";
import type { AIProjectSetupWizardProps } from "./aiSetupWizard/types";
import { AISkeleton, SparkleIcon } from "./aiSetupWizard/components/Common";
import SetupEditForm from "./aiSetupWizard/components/SetupEditForm";
import SetupSummaryView from "./aiSetupWizard/components/SetupSummaryView";
import SetupWizardFlow from "./aiSetupWizard/components/SetupWizardFlow";
import { useAIProjectSetupState } from "./aiSetupWizard/hooks/useAIProjectSetupState";
import { useProjectMember } from "../../hooks/useProjectMember";

export default function AIProjectSetupWizard({
  embedded = false,
  projectId,
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
            : "min-h-screen bg-[radial-gradient(circle_at_top_right,_#e0e7ff_0%,_#f8fafc_45%,_#f1f5f9_100%)] px-4 py-8",
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
          : "min-h-screen bg-[radial-gradient(circle_at_top_right,_#e0e7ff_0%,_#f8fafc_45%,_#f1f5f9_100%)] px-4 py-8",
      ].join(" ")}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl border border-indigo-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center gap-3 text-indigo-700">
            <SparkleIcon className="h-6 w-6" />
            <p className="text-sm font-semibold uppercase tracking-wider">AI-Assisted Wizard</p>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Project Setup Wizard for PRISMA SLR
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
            Transform your raw research idea into structured PICO-C elements and finalized research
            questions with guided AI support.
          </p>
        </div>

        {state.viewMode === "wizard" && (
          isLeader ? (
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
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <FiAlertCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Setup Required</h2>
              <p className="mt-2 text-slate-600">
                This project has not been set up yet. Only the project leader can perform the
                initial AI-assisted setup.
              </p>
            </div>
          )
        )}

        {state.viewMode === "summary" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <SetupSummaryView
              topic={state.topic}
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <SetupEditForm
              topic={state.topic}
              scopeForm={state.scopeForm}
              picocForm={state.picocForm}
              editResearchQuestions={state.editResearchQuestions}
              editNewRQInput={state.editNewRQInput}
              isSavingSetup={state.isSavingSetup}
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
              onEditRQTextChange={state.handleEditRQTextChange}
              onDeleteEditRQ={state.handleDeleteEditRQ}
              onEditNewRQInputChange={state.setEditNewRQInput}
              onAddEditRQ={state.handleAddEditRQ}
              onCancel={state.handleCancelEditMode}
              onSave={() => void state.handleSaveSetup(state.editResearchQuestions)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
