import { useEffect, useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiCheck,
  FiColumns,
  FiLock,
} from "react-icons/fi";
import { SectionTypeEnum } from "../../../../../types/dataExtraction";
import type { ResearchQuestion } from "../../../../../types/coreAndGovernance";
import type { WizardSection } from "../../../../../types/templateWizard";
import { toastWarning } from "../../../../../utils/toast";
import Input from "../../../../ui/Input";
import Label from "../../../../ui/Label";
import TemplateSectionNavigator from "./TemplateSectionNavigator";

interface Step3_MatrixSetupProps {
  section: WizardSection | undefined;
  sections: WizardSection[];
  sectionFieldCounts: Record<string, number>;
  initialRows?: string[];
  initialColumns?: string[];
  onComplete: (rows: string[], columns: string[], nextSectionId?: string) => void;
  researchQuestions?: ResearchQuestion[];
}

export default function Step3_MatrixSetup({
  section,
  sections,
  sectionFieldCounts,
  initialRows,
  initialColumns,
  onComplete,
  researchQuestions = [],
}: Step3_MatrixSetupProps) {
  const [rows, setRows] = useState<string[]>(initialRows ?? []);
  const [columns, setColumns] = useState<string[]>(initialColumns ?? []);
  const [newRow, setNewRow] = useState("");
  const [newCol, setNewCol] = useState("");
  const [selectedRQ, setSelectedRQ] = useState<string | null>(null);

  useEffect(() => {
    if (!section || section.sectionType !== SectionTypeEnum.MatrixGrid) {
      return;
    }

    setRows(initialRows ?? []);
    setColumns(initialColumns ?? []);
    setNewRow("");
    setNewCol("");
  }, [section, initialRows, initialColumns]);

  if (!section || section.sectionType !== SectionTypeEnum.MatrixGrid) {
    return <div role="alert" className="rounded-xl border border-error/20 bg-error/5 p-4 text-error">Invalid section</div>;
  }

  const displayName = section.name;
  const isInterventions = section.isPicoc;
  const colLabel = isInterventions
    ? "Proposed Approaches/Groups"
    : "Evaluation Timepoints";
  const rowLabel = isInterventions ? "Details to Extract" : "Outcome Measures";

  const handleAddRow = () => {
    if (newRow.trim()) {
      setRows([...rows, newRow.trim()]);
      setNewRow("");
    }
  };

  const handleAddColumn = () => {
    if (newCol.trim()) {
      setColumns([...columns, newCol.trim()]);
      setNewCol("");
    }
  };

  const handleRemoveRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleRemoveColumn = (idx: number) => {
    setColumns(columns.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (rows.length === 0) {
      toastWarning(
        "Validation",
        `Please add at least one ${rowLabel.toLowerCase()}`,
      );
      return;
    }

    if (columns.length === 0) {
      toastWarning(
        "Validation",
        `Please add at least one ${colLabel.toLowerCase()}`,
      );
      return;
    }

    onComplete(rows, columns);
  };
  const getDraftRows = () => newRow.trim() ? [...rows, newRow.trim()] : rows;
  const getDraftColumns = () => newCol.trim() ? [...columns, newCol.trim()] : columns;
  const handleBackToSections = () => onComplete(getDraftRows(), getDraftColumns());
  const handleSelectSection = (sectionId: string) => {
    if (sectionId !== section.id) onComplete(getDraftRows(), getDraftColumns(), sectionId);
  };

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
      <TemplateSectionNavigator
        sections={sections}
        activeSectionId={section.id}
        sectionFieldCounts={sectionFieldCounts}
        onSelect={handleSelectSection}
      />
      <div className="min-w-0 space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBackToSections}
          className="p-2 hover:bg-bg-secondary rounded-xl transition"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-text-primary sm:text-xl">
              {displayName.replace(/^(RQ\d+\s*:\s*)+/i, "$1")}
            </h2>
            {section.isLockedName && (
              <FiLock className="w-4 h-4 text-text-secondary" />
            )}
            {section.linkedResearchQuestionId && (
              <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
                RQ Linked
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-white px-3 py-2.5 text-sm text-text-secondary">
        <strong className="text-text-primary">Matrix setup:</strong> Define the rows (metrics/details to
        extract) and columns (approaches/timepoints) for your evaluation matrix.
      </div>

      {/* Map to Research Question (Optional) */}
      {researchQuestions.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-white p-4">
          <Label htmlFor="matrix_rq">Target Research Question (Optional)</Label>
          <select
            id="matrix_rq"
            value={selectedRQ || ""}
            onChange={(e) => setSelectedRQ(e.target.value || null)}
            className="min-h-10 w-full rounded-lg border border-border bg-surface-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="">--- Not mapped to any RQ ---</option>
            {researchQuestions.map((rq) => (
              <option key={rq.researchQuestionId} value={rq.researchQuestionId}>
                {rq.questionText.length > 50
                  ? `${rq.questionText.substring(0, 47)}...`
                  : rq.questionText}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary mt-2">
            Link this matrix to a Research Question to track which extraction
            data addresses each RQ.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Rows Section */}
        <div className="rounded-xl border border-border bg-surface-white p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <FiColumns className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">
              {rowLabel}
            </h3>
          </div>

          <div className="space-y-3 mb-4">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className="flex min-h-12 items-center gap-2 border-b border-border py-2.5 last:border-b-0"
              >
                <span className="text-sm font-medium text-text-secondary w-6">
                  {idx + 1}.
                </span>
                <span className="flex-1 text-text-primary">{row}</span>
                <button
                  type="button"
                  aria-label={`Remove ${rowLabel.toLowerCase()} ${idx + 1}`}
                  onClick={() => handleRemoveRow(idx)}
                  className="rounded-lg p-2 text-text-muted transition-colors hover:bg-error/5 hover:text-error"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_row">Add {rowLabel}</Label>
            <div className="flex gap-2">
              <Input
                id="new_row"
                value={newRow}
                onChange={(e) => setNewRow(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddRow();
                }}
                placeholder={`e.g., ${rowLabel === "Details to Extract" ? "Tool Support" : "Defect Density"}`}
              />
              <button
                type="button"
                aria-label={`Add ${rowLabel.toLowerCase()}`}
                onClick={handleAddRow}
                className="rounded-xl bg-primary px-3 py-2 text-white transition-colors hover:bg-primary-hover"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Columns Section */}
        <div className="rounded-xl border border-border bg-surface-white p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <FiColumns className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">
              {colLabel}
            </h3>
          </div>

          <div className="space-y-3 mb-4">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className="flex min-h-12 items-center gap-2 border-b border-border py-2.5 last:border-b-0"
              >
                <span className="text-sm font-medium text-text-secondary w-6">
                  {idx + 1}.
                </span>
                <span className="flex-1 text-text-primary">{col}</span>
                <button
                  type="button"
                  aria-label={`Remove ${colLabel.toLowerCase()} ${idx + 1}`}
                  onClick={() => handleRemoveColumn(idx)}
                  className="rounded-lg p-2 text-text-muted transition-colors hover:bg-error/5 hover:text-error"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_col">Add {colLabel}</Label>
            <div className="flex gap-2">
              <Input
                id="new_col"
                value={newCol}
                onChange={(e) => setNewCol(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddColumn();
                }}
                placeholder={`e.g., ${colLabel === "Proposed Approaches/Groups" ? "Approach A" : "Baseline"}`}
              />
              <button
                type="button"
                aria-label={`Add ${colLabel.toLowerCase()}`}
                onClick={handleAddColumn}
                className="rounded-xl bg-primary px-3 py-2 text-white transition-colors hover:bg-primary-hover"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {rows.length > 0 && columns.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-white p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Preview
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-bg-primary">
                  <th className="border border-border px-4 py-2 text-left font-semibold text-text-primary">
                    {rowLabel}
                  </th>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="border border-border px-4 py-2 text-left font-semibold text-text-primary"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-bg-primary">
                    <td className="border border-border px-4 py-2 font-medium text-text-primary">
                      {row}
                    </td>
                    {columns.map((_, colIdx) => (
                      <td
                        key={colIdx}
                        className="border border-border px-4 py-3 bg-bg-primary"
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="sticky bottom-0 flex gap-3 justify-between border-t border-border bg-surface-white/95 px-3 py-3 backdrop-blur-sm sm:px-4">
        <button
          onClick={handleBackToSections}
          className="min-h-10 rounded-xl border border-border bg-surface-white px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-secondary"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          className="flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <FiCheck className="w-4 h-4" />
          Save section
        </button>
      </div>
      </div>
    </div>
  );
}
