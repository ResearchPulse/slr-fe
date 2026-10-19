import { useEffect, useMemo, useState } from "react";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Modal from "../../../../components/ui/Modal";
import Textarea from "../../../../components/ui/Textarea";
import type { CreateThemeRequest } from "../../../../types/synthesisExecution";

interface SynthesisThemeModalProps {
  isOpen: boolean;
  mode?: "create" | "edit";
  initialValues?: CreateThemeRequest | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (request: CreateThemeRequest) => Promise<void>;
}

const DEFAULT_COLOR = "#0071BC";

const THEME_COLOR_OPTIONS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  DEFAULT_COLOR,
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

  useEffect(() => {
    if (isOpen) setFormState(baseFormState);
  }, [baseFormState, isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      description={modalDescription}
      size="sm"
      className="max-w-lg"
      bodyClassName="space-y-4 px-5 py-5 sm:p-6"
      closeOnOutsideClick={!isSubmitting}
      closeOnEsc={!isSubmitting}
      footer={
        <>
          <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="synthesis-theme-form" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
        <form id="synthesis-theme-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-text-primary"
              htmlFor="theme-name"
            >
              Name
            </label>
            <Input
              id="theme-name"
              type="text"
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="py-3"
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
            <Textarea
              id="theme-description"
              value={formState.description ?? ""}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="min-h-28 py-3"
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
                    id={color === DEFAULT_COLOR ? "theme-color" : undefined}
                    type="button"
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        colorCode: color,
                      }))
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
                    aria-label={`Select color ${color}`}
                    aria-pressed={isSelected}
                    title={color}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-8 w-8 rounded-full ring-offset-2 ${
                        isSelected
                          ? "ring-2 ring-text-primary"
                          : "ring-1 ring-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-secondary">
              Selected: {formState.colorCode ?? "No color"}
            </p>
          </div>

        </form>
    </Modal>
  );
}
