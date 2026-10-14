import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiArrowLeft } from "react-icons/fi";
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
import type {
  WizardSection,
  WizardStep,
} from "../../../../types/templateWizard";
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
        onSelect={(preset) => {
          setPresetSelection(preset
            ? {
                projectId,
                name: preset.name,
                description: preset.description,
                sections: preset.sections,
                fields: preset.fields,
              }
            : null);
        }}
        onSelectCurrent={() => setPresetSelection(existingTemplate)}
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
      onBackToPresetPicker={
        !isViewOnly ? () => setPresetSelection(undefined) : undefined
      }
    />
  );
}

interface TemplatePresetPickerProps {
  presets: ExtractionTemplatePresetDto[];
  isLoading: boolean;
  error: string | null;
  currentTemplate?: ExtractionTemplateDto | ExtractionTemplateResponseDto | null;
  onSelect: (preset: ExtractionTemplatePresetDto | null) => void;
  onSelectCurrent: () => void;
}

function TemplatePresetPicker({
  presets,
  isLoading,
  error,
  currentTemplate,
  onSelect,
  onSelectCurrent,
}: TemplatePresetPickerProps) {
  return (
    <div className="mx-auto max-w-5xl px-2 py-2">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
          Start from a template
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
          Choose an extraction form
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          Select a built-in form and customize it before publishing. Existing project templates are not changed.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-bg-secondary/50 px-5 py-8 text-center text-sm text-text-secondary">
          Loading available templates...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center text-sm text-red-700">
          Could not load the built-in templates: {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {currentTemplate ? (
            <button
              type="button"
              onClick={onSelectCurrent}
              className="group rounded-2xl border border-primary/40 bg-primary-light/20 p-5 text-left transition-colors hover:border-primary hover:bg-primary-light/35 focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              <h3 className="text-base font-semibold text-text-primary transition-colors group-hover:text-primary">
                Edit current template
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
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
              className="group rounded-2xl border border-border bg-surface-white p-5 text-left transition-colors hover:border-primary hover:bg-primary-light/20 focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-text-primary transition-colors group-hover:text-primary">
                    {preset.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {preset.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-medium text-primary">
                  {preset.sections?.length ?? 0} sections
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-text-secondary">
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
            className="group rounded-2xl border border-dashed border-border bg-bg-secondary/30 p-5 text-left transition-colors hover:border-primary hover:bg-primary-light/20 focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <h3 className="text-base font-semibold text-text-primary transition-colors group-hover:text-primary">
              Custom / blank template
            </h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Start with the project research questions and define every section and field yourself.
            </p>
            <p className="mt-4 text-xs font-medium text-primary">Start from blank →</p>
          </button>
        </div>
      )}
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
  const {
    state,
    goToStep,
    initializeSectionsForNewTemplate,
    startSectionSetup,
    updateSectionData,
    updateMatrixData,
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

  const handleCompleteFlatSetup = useCallback(
    (items: DataItemDefinitionExtended[]) => {
      if (state.sectionInProgress) {
        updateSectionData(state.sectionInProgress, items);
      }
      goToStep(1);
    },
    [state.sectionInProgress, updateSectionData, goToStep],
  );

  const handleCompleteMatrixSetup = useCallback(
    (rows: string[], columns: string[]) => {
      if (state.sectionInProgress) {
        updateMatrixData(state.sectionInProgress, { rows, columns });
      }
      goToStep(1);
    },
    [state.sectionInProgress, updateMatrixData, goToStep],
  );

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <Step1_Overview
            sections={state.sections}
            completedSections={Array.from(state.sectionData.keys()).concat(
              Array.from(state.matrixData.keys()),
            )}
            onSetupSection={startSectionSetup}
            isViewOnly={isViewOnly}
            researchQuestions={normalizedResearchQuestions}
            isGuidedGenerationLoading={isPlanningLoading}
            guidedGenerationError={planningError}
          />
        );

      case 2:
        return (
          <Step2_FlatSetup
            section={currentSection}
            initialItems={currentSectionItems}
            onComplete={handleCompleteFlatSetup}
            onBack={() => goToStep(1)}
            researchQuestions={normalizedResearchQuestions}
          />
        );

      case 3:
        return (
          <Step3_MatrixSetup
            section={currentSection}
            initialRows={currentMatrixData?.rows}
            initialColumns={currentMatrixData?.columns}
            onComplete={handleCompleteMatrixSetup}
            onBack={() => goToStep(1)}
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
            onBack={() => goToStep(1)}
            isViewOnly={isViewOnly}
            researchQuestions={normalizedResearchQuestions}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Progress Indicator */}
      <div className="sticky top-0 bg-surface-white border-b border-border shadow-none z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {onBackToPresetPicker ? (
                <button
                  type="button"
                  onClick={onBackToPresetPicker}
                  className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary"
                >
                  <FiArrowLeft className="h-4 w-4" />
                  Back to templates
                </button>
              ) : null}

              {[1, 4].map((step) => (
                <button
                  key={step}
                  onClick={() => goToStep(step as WizardStep)}
                  disabled={step > 1 && state.sections.length === 0}
                  className={`
                    px-4 py-2 rounded-xl font-medium text-sm transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      state.currentStep === step
                        ? "bg-primary text-white shadow-none"
                        : "bg-bg-secondary text-text-primary hover:bg-bg-secondary"
                    }
                  `}
                >
                  {/* Step {step} */}
                  {step === 1 ? "Overview" : "Preview & Publish"}
                </button>
              ))}
            </div>

            <div className="text-sm text-text-secondary">
              {state.sectionInProgress && (
                <span>
                  Working on:{" "}
                  <strong>{currentSection?.name || "Loading..."}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStep()}
      </div>
    </div>
  );
}
