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
      className={`relative overflow-hidden rounded-xl border border-border/80 bg-surface-white p-5 transition-[border-color,box-shadow,background-color,transform] duration-200 motion-reduce:transition-none hover:-translate-y-0.5 motion-reduce:hover:transform-none hover:shadow-md hover:shadow-slate-200/50 ${
        isOver
          ? "scale-[1.01] ring-2 ring-accent/70 bg-primary-light/30 shadow-md shadow-primary/10"
          : ""
      } ${disabled ? "opacity-80" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: theme.colorCode ?? "var(--color-primary)" }}
              aria-hidden="true"
            />
            <Layers3 className="h-4 w-4 text-accent" />
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
            <span className="rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary-light p-1.5 text-accent transition hover:bg-primary/10 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-error/20 bg-surface-white p-1.5 text-error transition-colors hover:bg-error/10 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            <Tags className="h-3.5 w-3.5" />
            {theme.evidences.length} evidences
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {theme.evidences.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-bg-primary/60 px-4 py-3 text-sm text-text-secondary">
            No linked evidence yet.
          </p>
        ) : (
          theme.evidences.map((evidence) => (
            <div
              key={evidence.id}
              className="rounded-xl border border-border/70 bg-bg-primary/70 px-4 py-3"
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
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-error transition-colors hover:bg-error/5 hover:text-error motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
