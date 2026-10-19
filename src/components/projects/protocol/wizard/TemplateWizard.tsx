import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTemplateWizard } from "../../../../hooks/useTemplateWizard";
import { useProjectResearchQuestions } from "../../../../hooks/useProjects";
import { dataExtractionTemplateService } from "../../../../services/dataExtractionService";
import type {
  ExtractionTemplateDto,
  ExtractionTemplatePresetDto,
} from "../../../../types/dataExtraction";
import type { ExtractionTemplateResponseDto } from "../../../../types/dataExtraction";
import type { DataItemDefinitionExtended } from "../../../../types/dataExtraction";
import type { ResearchQuestion } from "../../../../types/coreAndGovernance";
import type { WizardSection } from "../../../../types/templateWizard";
import Step1_Overview from "./steps/Step1_Overview";
import Step2_FlatSetup from "./steps/Step2_FlatSetup";
import Step3_MatrixSetup from "./steps/Step3_MatrixSetup";
import Step4_Preview from "./steps/Step4_Preview";

interface TemplateWizardProps {
  projectId: string;
  onComplete: (template: ExtractionTemplateResponseDto) => void;
  isViewOnly?: boolean;
  existingTemplate?: ExtractionTemplateDto | ExtractionTemplateResponseDto | null;
}

export default function TemplateWizard({
  projectId,
  onComplete,
  isViewOnly = false,
  existingTemplate = null,
}: TemplateWizardProps) {
  const [presetSelection, setPresetSelection] = useState<ExtractionTemplateDto | null | undefined>(
    undefined,
  );
  const [pendingPresetSelection, setPendingPresetSelection] = useState<ExtractionTemplateDto | null | undefined>(undefined);
  const presetsQuery = useQuery<ExtractionTemplatePresetDto[]>({
    queryKey: ["data-extraction-template-presets", projectId],
    queryFn: () => dataExtractionTemplateService.listPresets(projectId),
    enabled: !(isViewOnly && !!existingTemplate),
    staleTime: 10 * 60 * 1000,
  });

  if (!(isViewOnly && existingTemplate) && presetSelection === undefined) {
    return (
      <TemplatePresetPicker
        presets={presetsQuery.data ?? []}
        isLoading={presetsQuery.isLoading}
        error={presetsQuery.error instanceof Error ? presetsQuery.error.message : null}
        currentTemplate={existingTemplate}
        selectedTemplate={pendingPresetSelection}
        onSelect={(preset) => {
          setPendingPresetSelection(preset
            ? {
                projectId,
                name: preset.name,
                description: preset.description,
                sections: preset.sections,
                fields: preset.fields,
              }
            : null);
        }}
        onSelectCurrent={() => setPendingPresetSelection(existingTemplate)}
        onContinue={() => {
          if (pendingPresetSelection !== undefined) {
            setPresetSelection(pendingPresetSelection);
          }
        }}
      />
    );
  }

  const selectedTemplate =
    presetSelection !== undefined ? presetSelection : existingTemplate;

  return (
    <TemplateWizardEditor
      projectId={projectId}
      onComplete={onComplete}
      isViewOnly={isViewOnly}
      existingTemplate={selectedTemplate}
      onBackToPresetPicker={!isViewOnly ? () => {
        setPendingPresetSelection(undefined);
        setPresetSelection(undefined);
      } : undefined}
    />
  );
}

interface TemplatePresetPickerProps {
  presets: ExtractionTemplatePresetDto[];
  isLoading: boolean;
  error: string | null;
  currentTemplate?: ExtractionTemplateDto | ExtractionTemplateResponseDto | null;
  selectedTemplate: ExtractionTemplateDto | null | undefined;
  onSelect: (preset: ExtractionTemplatePresetDto | null) => void;
  onSelectCurrent: () => void;
  onContinue: () => void;
}

function TemplatePresetPicker({
  presets,
  isLoading,
  error,
  currentTemplate,
  selectedTemplate,
  onSelect,
  onSelectCurrent,
  onContinue,
}: TemplatePresetPickerProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-bg-primary">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
          Start from a template
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">
          Choose an extraction form
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-text-secondary">
          Select a built-in form and customize it before publishing. Existing project templates are not changed.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-bg-secondary/50 px-5 py-8 text-center text-sm text-text-secondary">
          Loading available templates...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-error/25 bg-surface-white px-5 py-8 text-center text-sm text-error" role="alert">
          Could not load the built-in templates: {error}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {currentTemplate ? (
            <button
              type="button"
              onClick={onSelectCurrent}
              aria-pressed={selectedTemplate === currentTemplate}
              className={`group min-h-28 rounded-xl border p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${selectedTemplate === currentTemplate ? "border-primary bg-primary-light/60" : "border-border bg-surface-white hover:border-primary/50"}`}
            >
              <h3 className="text-base font-semibold text-text-primary transition-colors group-hover:text-primary">
                Edit current template
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-text-secondary">
                Continue editing “{currentTemplate.name || "Untitled template"}” without changing its existing fields.
              </p>
              <p className="mt-4 text-xs font-medium text-primary">Continue editing →</p>
            </button>
          ) : null}

          {presets.map((preset) => (
            <button
              key={preset.presetId}
              type="button"
              onClick={() => onSelect(preset)}
              aria-pressed={selectedTemplate?.name === preset.name}
              className={`group min-h-28 rounded-xl border p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${selectedTemplate?.name === preset.name ? "border-primary bg-primary-light/60" : "border-border bg-surface-white hover:border-primary/50"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-text-primary transition-colors group-hover:text-primary">
                    {preset.name}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-text-secondary">
                    <span className="line-clamp-2">{preset.description}</span>
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-medium text-primary">
                  {preset.sections?.length ?? 0} sections
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-text-secondary">
                {preset.sections?.reduce((count, section) => count + (section.fields?.length ?? 0), 0) ?? 0} fields
                <span className="ml-2 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Use this template →
                </span>
              </p>
            </button>
          ))}

          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-pressed={selectedTemplate === null}
            className={`group min-h-28 rounded-xl border border-dashed p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${selectedTemplate === null ? "border-primary bg-primary-light/60" : "border-border bg-surface-white hover:border-primary/50"}`}
          >
            <h3 className="text-base font-semibold text-text-primary transition-colors group-hover:text-primary">
              Custom / blank template
            </h3>
            <p className="mt-2 text-sm leading-5 text-text-secondary">
              Start with the project research questions and define every section and field yourself.
            </p>
            <p className="mt-4 text-xs font-medium text-primary">Start from blank →</p>
          </button>
        </div>
      )}
        </div>
      </div>
      <div className="z-10 shrink-0 border-t border-border bg-surface-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <span className="text-xs text-text-secondary">Choose a starting point to continue</span>
          <button
            type="button"
            onClick={onContinue}
            disabled={selectedTemplate === undefined || isLoading || Boolean(error)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

interface TemplateWizardEditorProps extends TemplateWizardProps {
  onBackToPresetPicker?: () => void;
}

function TemplateWizardEditor({
  projectId,
  onComplete,
  isViewOnly = false,
  existingTemplate = null,
  onBackToPresetPicker,
}: TemplateWizardEditorProps) {
  const [showTemplateChangeConfirm, setShowTemplateChangeConfirm] = useState(false);
  const {
    state,
    goToStep,
    initializeSectionsForNewTemplate,
    startSectionSetup,
    removeSection,
    updateSectionData,
    updateMatrixData,
    updateTemplateMeta,
    getCompletedTemplate,
    resetWizard,
  } = useTemplateWizard({
    projectId,
    existingTemplate,
  });

  const {
    researchQuestions,
    isLoading: isPlanningLoading,
    error: planningError,
  } = useProjectResearchQuestions(projectId);

  const normalizedResearchQuestions = useMemo<ResearchQuestion[]>(
    () =>
      researchQuestions.map((question) => ({
        researchQuestionId: question.id,
        projectId: question.projectId,
        questionText: question.questionText,
        createdAt: question.createdAt,
      })),
    [researchQuestions],
  );

  useEffect(() => {
    if (
      !existingTemplate &&
      !isPlanningLoading &&
      !planningError &&
      normalizedResearchQuestions.length > 0
    ) {
      initializeSectionsForNewTemplate(normalizedResearchQuestions);
    }
  }, [
    existingTemplate,
    initializeSectionsForNewTemplate,
    isPlanningLoading,
    planningError,
    normalizedResearchQuestions,
  ]);

  const currentSection = useMemo(
    () =>
      state.sections.find(
        (s: WizardSection) => s.id === state.sectionInProgress,
      ),
    [state.sectionInProgress, state.sections],
  );

  const currentSectionItems = useMemo(
    () =>
      state.sectionInProgress
        ? (state.sectionData.get(state.sectionInProgress) ?? [])
        : [],
    [state.sectionInProgress, state.sectionData],
  );

  const currentMatrixData = useMemo(
    () =>
      state.sectionInProgress
        ? state.matrixData.get(state.sectionInProgress)
        : undefined,
    [state.sectionInProgress, state.matrixData],
  );

  const sectionFieldCounts = useMemo(
    () => {
      const countFields = (items: DataItemDefinitionExtended[] = []): number =>
        items.reduce((count, item) => count + 1 + countFields(item.subItems ?? []), 0);
      return Object.fromEntries(state.sections.map((section) => [
        section.id,
        countFields(state.sectionData.get(section.id)) || state.matrixData.get(section.id)?.rows.length || 0,
      ]));
    },
    [state.matrixData, state.sectionData, state.sections],
  );
  const completedSections = useMemo(
    () => state.sections
      .filter((section) => (sectionFieldCounts[section.id] ?? 0) > 0)
      .map((section) => section.id),
    [sectionFieldCounts, state.sections],
  );

  const handleCompleteFlatSetup = useCallback(
    (items: DataItemDefinitionExtended[], nextSectionId?: string) => {
      if (state.sectionInProgress) {
        updateSectionData(state.sectionInProgress, items);
      }
      if (nextSectionId) startSectionSetup(nextSectionId);
      else goToStep(1);
    },
    [state.sectionInProgress, updateSectionData, startSectionSetup, goToStep],
  );

  const handleCompleteMatrixSetup = useCallback(
    (rows: string[], columns: string[], nextSectionId?: string) => {
      if (state.sectionInProgress) {
        updateMatrixData(state.sectionInProgress, { rows, columns });
      }
      if (nextSectionId) startSectionSetup(nextSectionId);
      else goToStep(1);
    },
    [state.sectionInProgress, updateMatrixData, startSectionSetup, goToStep],
  );

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <Step1_Overview
            sections={state.sections}
            completedSections={completedSections}
            sectionFieldCounts={sectionFieldCounts}
            onSetupSection={startSectionSetup}
            onDeleteSection={removeSection}
            isViewOnly={isViewOnly}
            researchQuestions={normalizedResearchQuestions}
            isGuidedGenerationLoading={isPlanningLoading}
            guidedGenerationError={planningError}
          />
        );

      case 2:
        return (
          <Step2_FlatSetup
            key={currentSection?.id ?? "flat-section"}
            section={currentSection}
            sections={state.sections}
            sectionFieldCounts={sectionFieldCounts}
            initialItems={currentSectionItems}
            onComplete={handleCompleteFlatSetup}
            researchQuestions={normalizedResearchQuestions}
          />
        );

      case 3:
        return (
          <Step3_MatrixSetup
            key={currentSection?.id ?? "matrix-section"}
            section={currentSection}
            sections={state.sections}
            sectionFieldCounts={sectionFieldCounts}
            initialRows={currentMatrixData?.rows}
            initialColumns={currentMatrixData?.columns}
            onComplete={handleCompleteMatrixSetup}
            researchQuestions={normalizedResearchQuestions}
          />
        );

      case 4:
        return (
          <Step4_Preview
            projectId={projectId}
            expectedVersion={
              existingTemplate &&
              "version" in existingTemplate &&
              typeof existingTemplate.version === "number"
                ? existingTemplate.version
                : undefined
            }
            existingTemplate={existingTemplate}
            state={state}
            getCompletedTemplate={getCompletedTemplate}
            onPublish={(savedTemplate: ExtractionTemplateResponseDto) => {
              onComplete(savedTemplate);
              resetWizard();
            }}
            onBack={(name, description) => {
              if (name !== undefined) updateTemplateMeta(name, description ?? "");
              goToStep(1);
            }}
            isViewOnly={isViewOnly}
            researchQuestions={normalizedResearchQuestions}
          />
        );

      default:
        return null;
    }
  };

  const activeEditorStage = state.currentStep === 4 ? 3 : 2;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-bg-primary">
      <div className="z-10 shrink-0 border-b border-border bg-surface-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <ol className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Template setup progress">
            {[
              { id: 1, label: "Choose template" },
              { id: 2, label: "Configure sections" },
              { id: 3, label: "Preview & publish" },
            ].map((step, index) => {
              const isActive = activeEditorStage === step.id;
              const isComplete = activeEditorStage > step.id;
              return (
                <li key={step.id} className="flex min-w-0 items-center gap-2 sm:gap-3">
                  {index > 0 && <span className="h-px w-3 bg-border sm:w-6" aria-hidden="true" />}
                  <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isActive ? "bg-primary text-white" : isComplete ? "bg-primary-light text-primary" : "bg-bg-secondary text-text-muted"}`} aria-current={isActive ? "step" : undefined}>
                    {isComplete ? "✓" : step.id}
                  </span>
                  <span className={`truncate text-xs font-medium sm:text-sm ${isActive ? "text-text-primary" : "text-text-secondary"}`}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
          {state.currentStep === 2 || state.currentStep === 3 ? (
            <span className="max-w-[40%] truncate text-xs text-text-secondary" title={currentSection?.name}>
              Editing: <span className="font-medium text-text-primary">{currentSection?.name.replace(/^(RQ\d+\s*:\s*)+/i, "$1")}</span>
            </span>
          ) : null}
          {onBackToPresetPicker && (
            <button
              type="button"
              onClick={() => setShowTemplateChangeConfirm(true)}
              className="min-h-11 shrink-0 rounded-xl border border-border bg-surface-white px-3 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Change template
            </button>
          )}
        </div>
      </div>

      {showTemplateChangeConfirm && (
        <div className="flex shrink-0 flex-col gap-3 border-b border-border bg-primary-light/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6" role="alertdialog" aria-labelledby="change-template-title" aria-describedby="change-template-description">
          <div className="min-w-0">
            <p id="change-template-title" className="text-sm font-semibold text-text-primary">Change starting template?</p>
            <p id="change-template-description" className="mt-0.5 text-xs text-text-secondary">Leaving this editor will discard its unsaved section and field changes.</p>
          </div>
          <div className="flex shrink-0 justify-end gap-2">
            <button type="button" onClick={() => setShowTemplateChangeConfirm(false)} className="min-h-11 rounded-xl border border-border bg-surface-white px-3 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              Keep editing
            </button>
            <button type="button" onClick={onBackToPresetPicker} className="min-h-11 rounded-xl bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              Choose another template
            </button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          {renderStep()}
        </div>
      </div>
      {state.currentStep === 1 && (
        <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
          <span className="text-xs text-text-secondary">
            {completedSections.length} of {state.sections.length} sections configured
          </span>
          <button
            type="button"
            onClick={() => goToStep(4)}
            disabled={state.sections.length === 0}
            className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Preview &amp; publish
          </button>
        </div>
      )}
    </div>
  );
}
