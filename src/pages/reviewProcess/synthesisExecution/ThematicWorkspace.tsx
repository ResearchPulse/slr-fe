import { useEffect, useMemo, useState } from "react";
import { BookOpen, Grid3X3, LayoutGrid, NotebookPen, Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Button from "../../../components/ui/Button";
import type {
  AddEvidenceRequest,
  CreateThemeRequest,
  SourceDataGroupDto,
  SourceDataValueDto,
  SynthesisThemeDto,
  SynthesisWorkspaceDto,
  ThemeEvidenceDto,
  UpdateThemeRequest,
} from "../../../types/synthesisExecution";
import SourceDataAccordion from "./components/SourceDataAccordion";
import ConfirmationModal from "./components/ConfirmationModal";
import EvidenceMatrixView from "./EvidenceMatrixView";
import SynthesisThemeCard from "./components/SynthesisThemeCard";
import SynthesisThemeModal from "./components/SynthesisThemeModal";
import SubgroupAnalysisMatrix from "./SubgroupAnalysisMatrix";

type ThematicConfirmationAction =
  | {
      type: "delete-theme";
      themeId: string;
      themeName: string;
    }
  | {
      type: "unlink-evidence";
      evidenceId: string;
    };

interface ThematicWorkspaceProps {
  workspace: SynthesisWorkspaceDto;
  sourceDataGroups: SourceDataGroupDto[];
  filterHighQualityOnly?: boolean;
  viewMode: "cards" | "matrix" | "subgroup";
  onViewModeChange: (viewMode: "cards" | "matrix" | "subgroup") => void;
  isReadOnly?: boolean;
  isCreatingTheme?: boolean;
  isUpdatingTheme?: boolean;
  isDeletingTheme?: boolean;
  isLinkingEvidence?: boolean;
  isUnlinkingEvidence?: boolean;
  onCreateTheme: (request: CreateThemeRequest) => Promise<void>;
  onUpdateTheme: (
    themeId: string,
    request: UpdateThemeRequest,
  ) => Promise<void>;
  onDeleteTheme: (themeId: string) => Promise<void>;
  onLinkEvidence: (
    themeId: string,
    request: AddEvidenceRequest,
  ) => Promise<void>;
  onUnlinkEvidence: (evidenceId: string) => Promise<void>;
  onViewStrategyGuidelines: () => void;
}

export default function ThematicWorkspace({
  workspace,
  sourceDataGroups,
  filterHighQualityOnly = false,
  viewMode,
  onViewModeChange,
  isReadOnly = false,
  isCreatingTheme = false,
  isUpdatingTheme = false,
  isDeletingTheme = false,
  isLinkingEvidence = false,
  isUnlinkingEvidence = false,
  onCreateTheme,
  onUpdateTheme,
  onDeleteTheme,
  onLinkEvidence,
  onUnlinkEvidence,
  onViewStrategyGuidelines,
}: ThematicWorkspaceProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [themeBeingEdited, setThemeBeingEdited] =
    useState<SynthesisThemeDto | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [unlinkingEvidenceId, setUnlinkingEvidenceId] = useState<string | null>(
    null,
  );
  const [activeDragEvidence, setActiveDragEvidence] =
    useState<SourceDataValueDto | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<ThematicConfirmationAction | null>(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const isBusy =
    isCreatingTheme ||
    isUpdatingTheme ||
    isDeletingTheme ||
    isLinkingEvidence ||
    isUnlinkingEvidence ||
    isConfirmingAction;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const evidenceCount = useMemo(
    () =>
      workspace.themes.reduce(
        (total, theme) => total + theme.evidences.length,
        0,
      ),
    [workspace.themes],
  );

  const filteredSourceDataGroups = useMemo<SourceDataGroupDto[]>(() => {
    return sourceDataGroups
      .map((group) => ({
        ...group,
        values: group.values.filter((value) =>
          filterHighQualityOnly ? value.isHighQuality : true,
        ),
      }))
      .filter((group) => group.values.length > 0);
  }, [sourceDataGroups, filterHighQualityOnly]);

  const filteredThemes = useMemo<SynthesisThemeDto[]>(() => {
    return workspace.themes.map((theme) => ({
      ...theme,
      evidences: theme.evidences.filter((evidence) =>
        filterHighQualityOnly ? evidence.isHighQuality : true,
      ),
    }));
  }, [workspace.themes, filterHighQualityOnly]);

  const totalSourceValueCount = useMemo(() => {
    return sourceDataGroups.reduce(
      (total, group) => total + group.values.length,
      0,
    );
  }, [sourceDataGroups]);

  const visibleSourceValueCount = useMemo(() => {
    return filteredSourceDataGroups.reduce(
      (total, group) => total + group.values.length,
      0,
    );
  }, [filteredSourceDataGroups]);

  const hiddenSourceValueCount = Math.max(
    0,
    totalSourceValueCount - visibleSourceValueCount,
  );

  const hiddenEvidenceCount = useMemo(() => {
    const visibleEvidenceCount = filteredThemes.reduce(
      (total, theme) => total + theme.evidences.length,
      0,
    );
    return Math.max(0, evidenceCount - visibleEvidenceCount);
  }, [evidenceCount, filteredThemes]);

  const sourceDataValueLookup = useMemo(() => {
    const lookup = new Map<string, SourceDataValueDto>();

    for (const group of sourceDataGroups) {
      for (const value of group.values) {
        lookup.set(value.extractedDataValueId, value);
      }
    }

    return lookup;
  }, [sourceDataGroups]);

  useEffect(() => {
    if (filteredSourceDataGroups.length === 0) {
      if (expandedGroupId !== null) {
        setExpandedGroupId(null);
      }
      return;
    }

    const hasExpandedGroup = expandedGroupId
      ? filteredSourceDataGroups.some(
          (group) => group.fieldId === expandedGroupId,
        )
      : false;

    if (!hasExpandedGroup) {
      setExpandedGroupId(filteredSourceDataGroups[0].fieldId);
    }
  }, [expandedGroupId, filteredSourceDataGroups]);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedValue =
      (event.active.data.current?.value as SourceDataValueDto | undefined) ??
      sourceDataValueLookup.get(String(event.active.id)) ??
      null;
    setActiveDragEvidence(draggedValue);
  };

  const handleDragCancel = () => {
    setActiveDragEvidence(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragEvidence(null);

    if (!over) {
      return;
    }

    const themeId = String(over.id);
    const draggedValue =
      (active.data.current?.value as SourceDataValueDto | undefined) ??
      sourceDataValueLookup.get(String(active.id));

    if (!draggedValue) {
      return;
    }

    void handleLinkEvidence(themeId, draggedValue);
  };

  const handleCreateTheme = async (request: CreateThemeRequest) => {
    await onCreateTheme(request);
    setIsCreateModalOpen(false);
  };

  const handleOpenEditThemeModal = (theme: SynthesisThemeDto) => {
    setThemeBeingEdited(theme);
    setIsEditModalOpen(true);
  };

  const handleUpdateTheme = async (request: UpdateThemeRequest) => {
    if (!themeBeingEdited) {
      return;
    }

    await onUpdateTheme(themeBeingEdited.id, request);
    setIsEditModalOpen(false);
    setThemeBeingEdited(null);
  };

  const handleLinkEvidence = async (
    themeId: string,
    value: SourceDataValueDto,
  ) => {
    await onLinkEvidence(themeId, {
      extractedDataValueId: value.extractedDataValueId,
    });
  };

  const handleDeleteTheme = (theme: SynthesisThemeDto) => {
    setPendingConfirmation({
      type: "delete-theme",
      themeId: theme.id,
      themeName: theme.name,
    });
  };

  const handleUnlinkEvidence = (evidence: ThemeEvidenceDto) => {
    setPendingConfirmation({
      type: "unlink-evidence",
      evidenceId: evidence.id,
    });
  };

  const handleCloseConfirmation = () => {
    if (isConfirmingAction) {
      return;
    }

    setPendingConfirmation(null);
  };

  const handleConfirmAction = async () => {
    if (!pendingConfirmation) {
      return;
    }

    setIsConfirmingAction(true);

    try {
      if (pendingConfirmation.type === "delete-theme") {
        await onDeleteTheme(pendingConfirmation.themeId);
      } else {
        setUnlinkingEvidenceId(pendingConfirmation.evidenceId);
        try {
          await onUnlinkEvidence(pendingConfirmation.evidenceId);
        } finally {
          setUnlinkingEvidenceId(null);
        }
      }

      setPendingConfirmation(null);
    } finally {
      setIsConfirmingAction(false);
    }
  };

  const confirmationTitle =
    pendingConfirmation?.type === "delete-theme"
      ? `Delete theme "${pendingConfirmation.themeName}"?`
      : "Unlink evidence from theme?";
  const confirmationDescription =
    pendingConfirmation?.type === "delete-theme"
      ? "This will permanently remove the selected theme and its linked evidence connections from the synthesis workspace."
      : "This evidence will be detached from the current theme and can be linked again later.";
  const confirmationLabel =
    pendingConfirmation?.type === "delete-theme"
      ? "Delete Theme"
      : "Unlink Evidence";

  return (
    <div className="space-y-6">
      <div className="rounded-[4px] border border-border bg-surface-white p-6 shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary">
              Thematic Analysis Workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">
              Link raw evidence to conceptual themes
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
              Review extracted study data on the left, create themes on the
              right, and attach evidence to the best-fitting concept as you code
              the synthesis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-[4px] bg-bg-primary p-1 shadow-none ring-1 ring-gray-200">
              <button
                type="button"
                onClick={() => onViewModeChange("cards")}
                className={`inline-flex items-center gap-2 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors ${
                  viewMode === "cards"
                    ? "bg-blue-600 text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("matrix")}
                className={`inline-flex items-center gap-2 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors ${
                  viewMode === "matrix"
                    ? "bg-blue-600 text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Matrix
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("subgroup")}
                className={`inline-flex items-center gap-2 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors ${
                  viewMode === "subgroup"
                    ? "bg-blue-600 text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Sub-group
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewStrategyGuidelines}
              className="text-text-secondary hover:text-text-primary"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              View Strategy Guidelines
            </Button>
            <span className="rounded-full border border-border bg-bg-primary px-4 py-2 text-sm font-semibold text-text-primary">
              {workspace.themes.length} themes
            </span>
            <span className="rounded-full border border-border bg-bg-primary px-4 py-2 text-sm font-semibold text-text-primary">
              {evidenceCount} evidences
            </span>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={isReadOnly}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Theme
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "matrix" ? (
        <section className="rounded-[4px] border border-border bg-surface-white p-6 shadow-none">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Themes Matrix
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                A full-width evidence matrix for scanning themes across papers.
              </p>
              {hiddenEvidenceCount > 0 ? (
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  {hiddenEvidenceCount} evidences hidden by QA filter
                </p>
              ) : null}
            </div>
            {isReadOnly ? (
              <span className="rounded-full border border-border bg-bg-primary px-3 py-1 text-xs font-semibold text-text-secondary">
                Read only
              </span>
            ) : null}
          </div>

          {workspace.themes.length === 0 ? (
            <div className="rounded-[4px] border border-dashed border-border bg-bg-primary px-6 py-10 text-center">
              <NotebookPen className="mx-auto h-8 w-8 text-text-secondary" />
              <p className="text-sm font-medium text-text-secondary">
                No themes created yet.
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Create the first theme to begin qualitative coding.
              </p>
            </div>
          ) : filteredThemes.every((theme) => theme.evidences.length === 0) ? (
            <div className="rounded-[4px] border border-dashed border-border bg-bg-primary px-6 py-10 text-center">
              <NotebookPen className="mx-auto h-8 w-8 text-text-secondary" />
              <p className="text-sm font-medium text-text-secondary">
                No evidence meets the current QA threshold.
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Lower the sensitivity filter to reveal hidden evidence.
              </p>
            </div>
          ) : (
            <EvidenceMatrixView themes={filteredThemes} />
          )}
        </section>
      ) : viewMode === "subgroup" ? (
        <section className="rounded-[4px] border border-border bg-surface-white p-6 shadow-none">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Sub-group Analysis & Heterogeneity
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Cross-tabulate themes against categorical study characteristics.
              </p>
            </div>
            {isReadOnly ? (
              <span className="rounded-full border border-border bg-bg-primary px-3 py-1 text-xs font-semibold text-text-secondary">
                Read only
              </span>
            ) : null}
          </div>

          {workspace.themes.length === 0 ? (
            <div className="rounded-[4px] border border-dashed border-border bg-bg-primary px-6 py-10 text-center">
              <NotebookPen className="mx-auto h-8 w-8 text-text-secondary" />
              <p className="text-sm font-medium text-text-secondary">
                No themes created yet.
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Create the first theme to begin qualitative coding.
              </p>
            </div>
          ) : (
            <SubgroupAnalysisMatrix
              themes={workspace.themes}
              sourceDataGroups={sourceDataGroups}
            />
          )}
        </section>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[4px] border border-border bg-surface-white p-6 shadow-none">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Raw Extracted Data
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Drag evidence from the left and drop it on a theme card.
                  </p>
                  {hiddenSourceValueCount > 0 ? (
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      {hiddenSourceValueCount} extracted items hidden by QA
                      filter
                    </p>
                  ) : null}
                </div>
              </div>

              <SourceDataAccordion
                groups={filteredSourceDataGroups}
                themes={workspace.themes}
                expandedGroupId={expandedGroupId}
                disabled={isReadOnly || isBusy}
                onToggleGroup={setExpandedGroupId}
              />
            </section>

            <section className="rounded-[4px] border border-border bg-surface-white p-6 shadow-none">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Themes
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Drop evidence directly onto a theme card to link it.
                  </p>
                  {hiddenEvidenceCount > 0 ? (
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      {hiddenEvidenceCount} evidences hidden by QA filter
                    </p>
                  ) : null}
                </div>
                {isReadOnly ? (
                  <span className="rounded-full border border-border bg-bg-primary px-3 py-1 text-xs font-semibold text-text-secondary">
                    Read only
                  </span>
                ) : null}
              </div>

              {workspace.themes.length === 0 ? (
                <div className="rounded-[4px] border border-dashed border-border bg-bg-primary px-6 py-10 text-center">
                  <NotebookPen className="mx-auto h-8 w-8 text-text-secondary" />
                  <p className="text-sm font-medium text-text-secondary">
                    No themes created yet.
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Create the first theme to begin qualitative coding.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredThemes.map((theme: SynthesisThemeDto) => (
                    <SynthesisThemeCard
                      key={theme.id}
                      theme={theme}
                      disabled={isReadOnly || isBusy}
                      onEditTheme={
                        isReadOnly ? undefined : handleOpenEditThemeModal
                      }
                      onDeleteTheme={isReadOnly ? undefined : handleDeleteTheme}
                      onUnlinkEvidence={
                        isReadOnly ? undefined : handleUnlinkEvidence
                      }
                      unlinkingEvidenceId={unlinkingEvidenceId}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <DragOverlay>
            {activeDragEvidence ? (
              <div className="pointer-events-none w-[340px] overflow-hidden rounded-[4px] border border-blue-200 bg-surface-white shadow-[0_18px_50px_rgba(37,99,235,0.18)]">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                      Evidence
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                      Drop onto a theme
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-text-primary">
                    {activeDragEvidence.paperTitle}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-text-secondary">
                    {activeDragEvidence.displayValue}
                  </p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <SynthesisThemeModal
        isOpen={isCreateModalOpen}
        isSubmitting={isCreatingTheme}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTheme}
      />

      <SynthesisThemeModal
        key={themeBeingEdited?.id ?? "edit-theme"}
        isOpen={isEditModalOpen}
        mode="edit"
        initialValues={themeBeingEdited}
        isSubmitting={isUpdatingTheme}
        onClose={() => {
          setIsEditModalOpen(false);
          setThemeBeingEdited(null);
        }}
        onSubmit={handleUpdateTheme}
      />

      <ConfirmationModal
        isOpen={Boolean(pendingConfirmation)}
        title={confirmationTitle}
        description={confirmationDescription}
        confirmLabel={confirmationLabel}
        isConfirming={isConfirmingAction}
        variant="danger"
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
