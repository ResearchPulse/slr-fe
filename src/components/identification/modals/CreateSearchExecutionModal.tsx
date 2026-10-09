// Create Search Execution Modal
import { useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import type { CreateSearchExecutionRequest } from "../../../types/identification";
import FormField from "../../ui/FormField";

interface CreateSearchExecutionModalProps {
  identificationProcessId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSearchExecutionRequest) => Promise<void>;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  initialValues?: { searchSource: string; searchQuery: string; notes?: string | null };
}

export default function CreateSearchExecutionModal({
  identificationProcessId,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  mode = "create",
  initialValues,
}: CreateSearchExecutionModalProps) {
  const [formData, setFormData] = useState({
    searchSource: "",
    searchQuery: "",
    executedAt: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      searchSource: initialValues?.searchSource || "",
      searchQuery: initialValues?.searchQuery || "",
      executedAt: new Date().toISOString().split("T")[0],
      notes: initialValues?.notes || "",
    });
    setErrors({});
  }, [
    isOpen,
    mode,
    initialValues?.searchSource,
    initialValues?.searchQuery,
    initialValues?.notes,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.searchSource) {
      newErrors.searchSource = "Search source is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        identificationProcessId,
        searchSourceId: formData.searchSource, // For now, passing name as ID since protocols are removed
        searchQuery: formData.searchQuery.trim(),
        type: 0, // DatabaseSearch
        notes: formData.notes.trim(),
      });

      // Reset form
      setFormData({
        searchSource: "",
        searchQuery: "",
        executedAt: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Failed to create search strategy:", error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        searchSource: "",
        searchQuery: "",
        executedAt: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "edit" ? "Edit Search Strategy" : "Create Search Strategy"}
      size="xl"
    >
      {/* Info Banner */}
      {mode === "create" && <div className="bg-primary-light border border-accent/30 rounded-xl p-4 mb-6">
        <div className="flex gap-2 text-sm text-blue-800">
          <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Best Practice</p>
            <p className="text-xs text-accent mt-1">
              Create your search strategy first, then import RIS files. This
              maintains a clear audit trail and helps organize your systematic
              review.
            </p>
          </div>
        </div>
      </div>}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Search Source */}
        <FormField
          id="searchSource"
          label="Search Source"
          placeholder="e.g., IEEE Xplore, PubMed, etc."
          value={formData.searchSource}
          onChange={(e) => {
            setFormData({ ...formData, searchSource: e.target.value });
            setErrors({ ...errors, searchSource: "" });
          }}
          errorMessage={errors.searchSource}
          required
          disabled={isSubmitting}
        />

        {/* Search Query */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Search Query{" "}
            <span className="text-xs text-text-secondary font-normal">
              (optional)
            </span>
          </label>
          <textarea
            value={formData.searchQuery}
            onChange={(e) =>
              setFormData({ ...formData, searchQuery: e.target.value })
            }
            placeholder='e.g., ("machine learning" OR "deep learning") AND "healthcare"'
            rows={4}
            className="rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full font-mono"
            disabled={isSubmitting}
          />
          <p className="text-xs text-text-secondary mt-1">
            Enter the exact query used in the database. This field is optional
            but recommended for documentation.
          </p>
        </div>

        {/* Executed Date */}
        {mode === "create" && <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Executed Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.executedAt}
              onChange={(e) =>
                setFormData({ ...formData, executedAt: e.target.value })
              }
              className="rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full"
              disabled={isSubmitting}
            />
          </div>
        </div>}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Notes{" "}
            <span className="text-xs text-text-secondary font-normal">
              (optional)
            </span>
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Any additional information about this search strategy..."
            rows={3}
            className="rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-full"
            disabled={isSubmitting}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === "edit" ? "Saving..." : "Creating..."
              : mode === "edit" ? "Save Changes" : "Create Strategy"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
