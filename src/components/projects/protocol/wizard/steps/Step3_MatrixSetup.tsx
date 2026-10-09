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

interface Step3_MatrixSetupProps {
  section: WizardSection | undefined;
  initialRows?: string[];
  initialColumns?: string[];
  onComplete: (rows: string[], columns: string[]) => void;
  onBack: () => void;
  researchQuestions?: ResearchQuestion[];
}

export default function Step3_MatrixSetup({
  section,
  initialRows,
  initialColumns,
  onComplete,
  onBack,
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
    return <div className="p-4 text-red-600">Invalid section</div>;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-bg-secondary rounded-xl transition"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-text-primary">
              {displayName}
            </h2>
            {section.isLockedName && (
              <FiLock className="w-4 h-4 text-text-secondary" />
            )}
            {section.linkedResearchQuestionId && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium">
                RQ Linked
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-primary-light border border-accent/30 rounded-xl p-4 text-sm text-text-primary">
        <strong>Matrix Setup:</strong> Define the rows (metrics/details to
        extract) and columns (approaches/timepoints) for your evaluation matrix.
      </div>

      {/* Map to Research Question (Optional) */}
      {researchQuestions.length > 0 && (
        <div className="bg-surface-white rounded-xl border border-border p-4">
          <Label htmlFor="matrix_rq">Target Research Question (Optional)</Label>
          <select
            id="matrix_rq"
            value={selectedRQ || ""}
            onChange={(e) => setSelectedRQ(e.target.value || null)}
            className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-accent"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rows Section */}
        <div className="bg-surface-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiColumns className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-text-primary">
              {rowLabel}
            </h3>
          </div>

          <div className="space-y-3 mb-4">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-3 bg-bg-primary border border-border rounded-xl"
              >
                <span className="text-sm font-medium text-text-secondary w-6">
                  {idx + 1}.
                </span>
                <span className="flex-1 text-text-primary">{row}</span>
                <button
                  onClick={() => handleRemoveRow(idx)}
                  className="p-1.5 text-red-600 hover:bg-surface-white rounded transition"
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
                onClick={handleAddRow}
                className="px-4 py-2 bg-accent text-white rounded-xl hover:bg-indigo-700 transition font-medium"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Columns Section */}
        <div className="bg-surface-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiColumns className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-text-primary">
              {colLabel}
            </h3>
          </div>

          <div className="space-y-3 mb-4">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-3 bg-bg-primary border border-border rounded-xl"
              >
                <span className="text-sm font-medium text-text-secondary w-6">
                  {idx + 1}.
                </span>
                <span className="flex-1 text-text-primary">{col}</span>
                <button
                  onClick={() => handleRemoveColumn(idx)}
                  className="p-1.5 text-red-600 hover:bg-surface-white rounded transition"
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
                onClick={handleAddColumn}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {rows.length > 0 && columns.length > 0 && (
        <div className="bg-surface-white rounded-xl border border-border p-6">
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
      <div className="flex gap-3 justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-bg-secondary text-text-primary rounded-xl hover:bg-bg-secondary font-medium transition"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition"
        >
          <FiCheck className="w-4 h-4" />
          Save & Continue
        </button>
      </div>
    </div>
  );
}
