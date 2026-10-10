import { useMemo, useState } from "react";
import { X } from "lucide-react";
import Button from "../../../../components/ui/Button";
import type { CreateThemeRequest } from "../../../../types/synthesisExecution";

interface SynthesisThemeModalProps {
  isOpen: boolean;
  mode?: "create" | "edit";
  initialValues?: CreateThemeRequest | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (request: CreateThemeRequest) => Promise<void>;
}

const DEFAULT_COLOR = "#2563eb";

const THEME_COLOR_OPTIONS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export default function SynthesisThemeModal({
  isOpen,
  mode = "create",
  initialValues = null,
  isSubmitting = false,
  onClose,
  onSubmit,
}: SynthesisThemeModalProps) {
  const baseFormState = useMemo<CreateThemeRequest>(
    () => ({
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      colorCode: initialValues?.colorCode ?? DEFAULT_COLOR,
    }),
    [initialValues],
  );
  const [formState, setFormState] = useState<CreateThemeRequest>(baseFormState);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setFormState(baseFormState);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      name: formState.name.trim(),
      description: formState.description?.trim() || null,
      colorCode: formState.colorCode?.trim() || null,
    });

    setFormState(baseFormState);
  };

  const modalTitle = mode === "edit" ? "Edit Theme" : "Create New Theme";
  const modalDescription =
    mode === "edit"
      ? "Refine the name, description, or color to keep your coding model consistent."
      : "Capture a recurring pattern or concept from the extracted evidence.";
  const submitLabel = mode === "edit" ? "Save Changes" : "Create Theme";

  return (
    <div className="fixed inset-0 z-(--z-index-modal) flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {modalTitle}
            </h3>
            <p className="text-sm text-text-secondary">{modalDescription}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-text-primary"
              htmlFor="theme-name"
            >
              Name
            </label>
            <input
              id="theme-name"
              type="text"
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-border px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Collaboration barriers"
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-text-primary"
              htmlFor="theme-description"
            >
              Description
            </label>
            <textarea
              id="theme-description"
              value={formState.description ?? ""}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="min-h-28 w-full rounded-xl border border-border px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-primary/20"
              placeholder="Summarize the idea captured by this theme"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-text-primary"
              htmlFor="theme-color"
            >
              Color Code
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {THEME_COLOR_OPTIONS.map((color) => {
                const isSelected = (formState.colorCode ?? "") === color;

                return (
                  <button
                    key={color}
                    id={color === "#2563eb" ? "theme-color" : undefined}
                    type="button"
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        colorCode: color,
                      }))
                    }
                    className={`h-8 w-8 rounded-full ring-offset-2 transition focus:outline-none focus:ring-2 focus:ring-accent ${
                      isSelected
                        ? "ring-2 ring-gray-900"
                        : "ring-1 ring-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                    title={color}
                  />
                );
              })}
            </div>
            <p className="text-xs text-text-secondary">
              Selected: {formState.colorCode ?? "No color"}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
