import { useDroppable } from "@dnd-kit/core";
import { Layers3, Pencil, Tags, Trash2 } from "lucide-react";
import type {
  SynthesisThemeDto,
  ThemeEvidenceDto,
} from "../../../../types/synthesisExecution";

interface SynthesisThemeCardProps {
  theme: SynthesisThemeDto;
  disabled?: boolean;
  onEditTheme?: (theme: SynthesisThemeDto) => void;
  onDeleteTheme?: (theme: SynthesisThemeDto) => void;
  onUnlinkEvidence?: (evidence: ThemeEvidenceDto) => void;
  unlinkingEvidenceId?: string | null;
}

export default function SynthesisThemeCard({
  theme,
  disabled = false,
  onEditTheme,
  onDeleteTheme,
  onUnlinkEvidence,
  unlinkingEvidenceId = null,
}: SynthesisThemeCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: theme.id,
    disabled,
  });
  const canManageTheme = Boolean(onEditTheme || onDeleteTheme);

  return (
    <article
      ref={setNodeRef}
      className={`relative overflow-hidden rounded-[4px] border border-border bg-surface-white p-5 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-none ${
        isOver
          ? "scale-[1.01] ring-2 ring-blue-500 bg-blue-50/30 shadow-none shadow-blue-100"
          : ""
      } ${disabled ? "opacity-80" : ""}`}
    >
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: theme.colorCode ?? "#2563eb" }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-text-primary">
              {theme.name}
            </h4>
          </div>
          {theme.description ? (
            <p className="text-sm leading-6 text-text-secondary">
              {theme.description}
            </p>
          ) : (
            <p className="text-sm italic text-text-secondary">
              No description provided.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 text-right">
          {isOver ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
              Drop to link
            </span>
          ) : null}
          <span className="rounded-full border border-border bg-bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
            Theme card
          </span>
          {canManageTheme ? (
            <div className="flex items-center gap-2">
              {onEditTheme ? (
                <button
                  type="button"
                  onClick={() => onEditTheme(theme)}
                  disabled={disabled}
                  className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 p-1.5 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Edit theme"
                  title="Edit theme"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : null}
              {onDeleteTheme ? (
                <button
                  type="button"
                  onClick={() => onDeleteTheme(theme)}
                  disabled={disabled}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-surface-white p-1.5 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Delete theme"
                  title="Delete theme"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}
          <span className="rounded-full bg-bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
            {theme.colorCode ?? "No color"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
            <Tags className="h-3.5 w-3.5" />
            {theme.evidences.length} evidences
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {theme.evidences.length === 0 ? (
          <p className="rounded-[4px] border border-dashed border-border bg-bg-primary px-4 py-3 text-sm text-text-secondary">
            No linked evidence yet.
          </p>
        ) : (
          theme.evidences.map((evidence) => (
            <div
              key={evidence.id}
              className="rounded-[4px] border border-border bg-bg-primary px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                    {evidence.paperTitle}
                  </p>
                  {evidence.fieldName ? (
                    <p className="mt-1 text-xs font-medium text-text-secondary">
                      Field: {evidence.fieldName}
                    </p>
                  ) : null}
                </div>
                {onUnlinkEvidence ? (
                  <button
                    type="button"
                    onClick={() => onUnlinkEvidence(evidence)}
                    disabled={disabled || unlinkingEvidenceId === evidence.id}
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {unlinkingEvidenceId === evidence.id
                      ? "Unlinking..."
                      : "Unlink"}
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-text-primary">
                {evidence.displayValue}
              </p>
              {evidence.notes ? (
                <p className="mt-2 text-xs text-text-secondary">
                  {evidence.notes}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </article>
  );
}
