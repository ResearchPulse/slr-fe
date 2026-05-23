import { ChevronDown, GripVertical, Tag } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type {
  SourceDataGroupDto,
  SourceDataValueDto,
  SynthesisThemeDto,
} from "../../../../types/synthesisExecution";

interface SourceDataAccordionProps {
  groups: SourceDataGroupDto[];
  themes: SynthesisThemeDto[];
  expandedGroupId: string | null;
  disabled?: boolean;
  onToggleGroup: (groupId: string) => void;
}

function DraggableEvidenceRow({
  value,
  themes,
  disabled = false,
}: {
  value: SourceDataValueDto;
  themes: SynthesisThemeDto[];
  disabled?: boolean;
}) {
  const hasThemes = themes.length > 0;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: value.extractedDataValueId,
      data: { value },
      disabled: disabled || !hasThemes,
    });

  const rowStyle = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={rowStyle}
      className={`group relative overflow-hidden rounded-[4px] border border-border bg-surface-white p-3 pl-4 shadow-none transition-all duration-200 ${
        isDragging
          ? "cursor-grabbing border-blue-300 bg-blue-50/60 shadow-none shadow-blue-100 scale-[1.01]"
          : "hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-none"
      } ${disabled ? "opacity-80" : "cursor-grab"}`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1.5 ${isDragging ? "bg-blue-500" : "bg-slate-200 group-hover:bg-blue-400"}`}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled || !hasThemes}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-border bg-bg-secondary text-text-secondary transition hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Drag evidence from ${value.paperTitle}`}
          title="Drag to a theme"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-blue-600" />
            <p className="text-xs font-semibold text-text-primary">
              {value.paperTitle}
            </p>
          </div>
          <p className="text-xs leading-5 text-text-secondary">
            {value.displayValue}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
            Drag this evidence onto a theme
          </p>
        </div>

        {hasThemes ? null : (
          <span className="shrink-0 rounded-full border border-border bg-bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
            No themes
          </span>
        )}
      </div>
    </div>
  );
}

export default function SourceDataAccordion({
  groups,
  themes,
  expandedGroupId,
  disabled = false,
  onToggleGroup,
}: SourceDataAccordionProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-[4px] border border-dashed border-border bg-bg-primary px-6 py-10 text-center">
        <p className="text-sm font-medium text-text-secondary">
          No raw extracted data was returned for this synthesis process.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = expandedGroupId === group.fieldId;

        return (
          <div
            key={group.fieldId}
            className="overflow-hidden rounded-[4px] border border-border bg-surface-white shadow-none"
          >
            <button
              type="button"
              onClick={() => onToggleGroup(group.fieldId)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-bg-primary"
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {group.fieldName}
                </p>
                <p className="text-xs text-text-secondary">
                  {group.values.length} extracted items
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-border bg-bg-primary/60 p-4">
                {group.values.map((value) => (
                  <DraggableEvidenceRow
                    key={value.extractedDataValueId}
                    value={value}
                    themes={themes}
                    disabled={disabled}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
