import type { ReactNode } from "react";
import { Crosshair, Sparkles } from "lucide-react";
import {
  SectionTypeEnum,
  type ExtractionFieldDto,
  type ExtractionSectionDto,
} from "../../../../../types/dataExtraction";
import {
  getMatrixFieldKey,
  MATRIX_COLUMN_ID_KEY,
  MATRIX_ITEM_NAME_KEY,
  renderInputControl,
  toDomId,
} from "./reviewerFormUtils";
import type {
  FlattenedTemplateField,
  FormFieldState,
  FormFieldValue,
} from "./types";

interface ReviewerFormPaneProps {
  activeSection: ExtractionSectionDto | null;
  activeSectionId: string;
  activeSectionDescription: string;
  activeEvidenceTargetLabel: string | null;
  matrixFields: ExtractionFieldDto[];
  fieldStates: Record<string, FormFieldState>;
  currentRows: Record<string, FormFieldState>[];
  flattenedFields: FlattenedTemplateField[];
  renderFieldControl: (
    item: FlattenedTemplateField,
    disabled?: boolean,
  ) => ReactNode;
  isFieldNotReported: (fieldKey: string) => boolean;
  isMatrixFieldNotReported: (
    sectionId: string,
    rowIndex: number,
    fieldKey: string,
  ) => boolean;
  isReadOnly?: boolean;
  isAskingAi: boolean;
  isEvidenceTargetActive: (
    fieldKey: string,
    sectionId: string | null,
    rowIndex: number | null,
  ) => boolean;
  onAskAiField: (
    field: ExtractionFieldDto,
    matrixColumnId: string | null,
    matrixRowIndex: number | null,
  ) => void;
  onSelectEvidenceTarget: (
    fieldKey: string,
    sectionId: string | null,
    rowIndex: number | null,
  ) => void;
  onSetMatrixFieldValue: (
    sectionId: string,
    rowIndex: number,
    fieldKey: string,
    value: FormFieldValue,
  ) => void;
  onToggleFieldNotReported: (fieldKey: string, isNotReported: boolean) => void;
  onToggleMatrixFieldNotReported: (
    sectionId: string,
    rowIndex: number,
    fieldKey: string,
    isNotReported: boolean,
  ) => void;
  onRemoveMatrixRow: (sectionId: string, rowIndex: number) => void;
  onAddMatrixRow: (sectionId: string) => void;
  renderCommentButton?: (params: {
    field: ExtractionFieldDto;
    sectionId: string;
    matrixColumnId: string | null;
    matrixRowIndex: number | null;
  }) => ReactNode;
}

export default function ReviewerFormPane({
  activeSection,
  activeSectionId,
  activeSectionDescription,
  activeEvidenceTargetLabel,
  matrixFields,
  fieldStates,
  currentRows,
  flattenedFields,
  renderFieldControl,
  isFieldNotReported,
  isMatrixFieldNotReported,
  isReadOnly = false,
  isAskingAi,
  isEvidenceTargetActive,
  onAskAiField,
  onSelectEvidenceTarget,
  onSetMatrixFieldValue,
  onToggleFieldNotReported,
  onToggleMatrixFieldNotReported,
  onRemoveMatrixRow,
  onAddMatrixRow,
  renderCommentButton,
}: ReviewerFormPaneProps) {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface-white shadow-sm">
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-border bg-surface-white px-4 py-3 sm:px-5">
          <h2 className="line-clamp-2 text-lg font-semibold text-text-primary">
            {activeSection?.name ?? "Section"}
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            {activeSectionDescription}
          </p>
          {activeEvidenceTargetLabel ? (
            <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-accent/30 bg-primary-light px-2.5 py-1 text-xs font-semibold text-accent">
              <span className="shrink-0">Target selected:</span>
              <span className="truncate" title={activeEvidenceTargetLabel}>
                {activeEvidenceTargetLabel}
              </span>
            </div>
          ) : null}
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {!activeSection ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-bg-secondary p-4 text-sm text-text-secondary">
              No section selected.
            </p>
          ) : activeSection.sectionType === SectionTypeEnum.MatrixGrid ? (
            <div className="space-y-4">
              {matrixFields.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-bg-secondary p-4 text-sm text-text-secondary">
                  No matrix fields in this section yet.
                </p>
              ) : null}

              {currentRows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-bg-secondary p-4 text-sm text-text-secondary">
                  No items added yet. Add your first item below.
                </p>
              ) : null}

              {currentRows.map((row, rowIndex) => {
                const isPredefinedRow = Object.prototype.hasOwnProperty.call(
                  row,
                  MATRIX_COLUMN_ID_KEY,
                );
                const itemNameValue = row[MATRIX_ITEM_NAME_KEY]?.value;
                const itemName =
                  typeof itemNameValue === "string" ? itemNameValue : "";

                return (
                  <div
                    key={`${activeSectionId}-row-${rowIndex}`}
                    className="rounded-xl border border-border bg-bg-secondary p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {isPredefinedRow
                          ? `Predefined Item #${rowIndex + 1}`
                          : `Item #${rowIndex + 1}`}
                      </h3>
                      {!isPredefinedRow && (
                        <button
                          type="button"
                          onClick={() =>
                            onRemoveMatrixRow(activeSectionId, rowIndex)
                          }
                          disabled={isReadOnly}
                          className="rounded-xl px-2 py-1 text-xs font-semibold text-red-600 hover:bg-surface-white hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor={`matrix-item-name-${toDomId(activeSectionId)}-${rowIndex}`}
                          className="mb-1 block text-sm font-semibold text-slate-800"
                        >
                          Item/Group Name
                        </label>

                        {isPredefinedRow ? (
                          <>
                            <div className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-base font-semibold text-text-primary">
                              {itemName || "Predefined column"}
                            </div>
                            <p className="mt-1 text-xs text-text-secondary">
                              This row is predefined by the template and cannot
                              be renamed.
                            </p>
                          </>
                        ) : (
                          <input
                            id={`matrix-item-name-${toDomId(activeSectionId)}-${rowIndex}`}
                            type="text"
                            disabled={isReadOnly}
                            value={itemName}
                            onChange={(event) =>
                              onSetMatrixFieldValue(
                                activeSectionId,
                                rowIndex,
                                MATRIX_ITEM_NAME_KEY,
                                event.target.value,
                              )
                            }
                            placeholder="e.g. Group A, Baseline Tool"
                            className="w-full rounded-xl border border-slate-300 bg-surface-white px-3 py-2 text-base text-text-primary outline-none placeholder:text-text-secondary focus:border-accent"
                          />
                        )}
                      </div>

                      {matrixFields.map((field, fieldIndex) => {
                        const matrixFieldKey = getMatrixFieldKey(
                          field,
                          fieldIndex,
                        );
                        const controlId = `matrix-${toDomId(activeSectionId)}-${rowIndex}-${toDomId(matrixFieldKey)}`;
                        const fieldState = row[matrixFieldKey] ?? null;
                        const currentValue = fieldState?.value ?? null;
                        const isNotReported = isMatrixFieldNotReported(
                          activeSectionId,
                          rowIndex,
                          matrixFieldKey,
                        );
                        const hasLinkedEvidence = Boolean(
                          fieldState?.evidenceCoordinates?.trim(),
                        );
                        const isTargetActive = isEvidenceTargetActive(
                          matrixFieldKey,
                          activeSectionId,
                          rowIndex,
                        );

                        return (
                          <div key={matrixFieldKey}>
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <label
                                    htmlFor={controlId}
                                    className="block text-sm font-semibold text-slate-800"
                                  >
                                    {field.name}
                                    {field.isRequired ? (
                                      <span className="ml-1 text-red-500">
                                        *
                                      </span>
                                    ) : null}
                                  </label>
                                  {renderCommentButton
                                    ? renderCommentButton({
                                        field,
                                        sectionId: activeSectionId,
                                        matrixColumnId:
                                          typeof row[MATRIX_COLUMN_ID_KEY]
                                            ?.value === "string"
                                            ? row[MATRIX_COLUMN_ID_KEY].value
                                            : null,
                                        matrixRowIndex: rowIndex,
                                      })
                                    : null}
                                </div>
                                <label className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-text-secondary">
                                  <input
                                    type="checkbox"
                                    checked={isNotReported}
                                    disabled={isReadOnly}
                                    onChange={(event) =>
                                      onToggleMatrixFieldNotReported(
                                        activeSectionId,
                                        rowIndex,
                                        matrixFieldKey,
                                        event.target.checked,
                                      )
                                    }
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-text-primary focus:ring-slate-400"
                                  />
                                  Not Reported
                                </label>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  onAskAiField(
                                    field,
                                    typeof row[MATRIX_COLUMN_ID_KEY]?.value ===
                                      "string"
                                      ? row[MATRIX_COLUMN_ID_KEY].value
                                      : null,
                                    rowIndex,
                                  )
                                }
                                disabled={isReadOnly || isAskingAi}
                                className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-white px-2 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                Ask AI
                              </button>
                            </div>

                            {field.instruction ? (
                              <p className="mb-2 text-xs text-text-secondary">
                                {field.instruction}
                              </p>
                            ) : null}

                            {isNotReported ? (
                              <p className="mb-2 inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-primary">
                                NR
                              </p>
                            ) : null}

                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                {renderInputControl(
                                  field,
                                  currentValue,
                                  (value) =>
                                    onSetMatrixFieldValue(
                                      activeSectionId,
                                      rowIndex,
                                      matrixFieldKey,
                                      value,
                                    ),
                                  controlId,
                                  isReadOnly || isNotReported,
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  onSelectEvidenceTarget(
                                    matrixFieldKey,
                                    activeSectionId,
                                    rowIndex,
                                  )
                                }
                                disabled={isReadOnly}
                                title={
                                  isTargetActive
                                    ? "Exit evidence mode for this field"
                                    : "Select this field for evidence mode"
                                }
                                aria-label={
                                  isTargetActive
                                    ? "Exit evidence mode"
                                    : "Select field for evidence mode"
                                }
                                className={
                                  isTargetActive
                                    ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-primary-light text-accent transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
                                    : hasLinkedEvidence
                                      ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                      : "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-white text-text-secondary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                                }
                              >
                                <Crosshair className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => onAddMatrixRow(activeSectionId)}
                disabled={isReadOnly}
                className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-surface-white px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
              >
                + Add New {activeSection.name} Item
              </button>
            </div>
          ) : flattenedFields.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-bg-secondary p-4 text-sm text-text-secondary">
              No fields in this section yet.
            </p>
          ) : (
            <div className="space-y-4">
              {flattenedFields.map((item) => {
                const { field, fieldKey, depth } = item;
                const isNotReported = isFieldNotReported(fieldKey);
                const fieldState = fieldStates[fieldKey] ?? null;
                const hasLinkedEvidence = Boolean(
                  fieldState?.evidenceCoordinates?.trim(),
                );
                const isTargetActive = isEvidenceTargetActive(
                  fieldKey,
                  null,
                  null,
                );

                return (
                  <div key={fieldKey} style={{ marginLeft: depth * 14 }}>
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`field-${toDomId(fieldKey)}`}
                            className="block text-sm font-semibold text-slate-800"
                          >
                            {field.name}
                            {field.isRequired ? (
                              <span className="ml-1 text-red-500">*</span>
                            ) : null}
                          </label>
                          {renderCommentButton && field.fieldId
                            ? renderCommentButton({
                                field,
                                sectionId: activeSectionId,
                                matrixColumnId: null,
                                matrixRowIndex: null,
                              })
                            : null}
                        </div>
                        <label className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-text-secondary">
                          <input
                            type="checkbox"
                            checked={isNotReported}
                            disabled={isReadOnly}
                            onChange={(event) =>
                              onToggleFieldNotReported(
                                fieldKey,
                                event.target.checked,
                              )
                            }
                            className="h-3.5 w-3.5 rounded border-slate-300 text-text-primary focus:ring-slate-400"
                          />
                          Not Reported
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAskAiField(field, null, null)}
                        disabled={isReadOnly || isAskingAi}
                        className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-white px-2 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Ask AI
                      </button>
                    </div>

                    {field.instruction ? (
                      <p className="mb-2 text-xs text-text-secondary">
                        {field.instruction}
                      </p>
                    ) : null}

                    {isNotReported ? (
                      <p className="mb-2 inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-primary">
                        NR
                      </p>
                    ) : null}

                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        {renderFieldControl(item, isReadOnly || isNotReported)}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onSelectEvidenceTarget(fieldKey, null, null)
                        }
                        disabled={isReadOnly}
                        title={
                          isTargetActive
                            ? "Exit evidence mode for this field"
                            : "Select this field for evidence mode"
                        }
                        aria-label={
                          isTargetActive
                            ? "Exit evidence mode"
                            : "Select field for evidence mode"
                        }
                        className={
                          isTargetActive
                            ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-primary-light text-accent transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
                            : hasLinkedEvidence
                              ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                              : "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-white text-text-secondary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        }
                      >
                        <Crosshair className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
