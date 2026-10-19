import React from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  Tag,
} from "lucide-react";
import { clsx } from "clsx";
import Button from "../../ui/Button";
import LoadingSpinner from "../../ui/LoadingSpinner";
import type {
  CriteriaGroup,
  CriterionItem,
  CriterionSource,
} from "../../../types/selectionCriteria";

interface ManageStuSeCriteriaProps {
  criteriaGroups: CriteriaGroup[];
  isGenerating: boolean;
  onAiSuggest: () => void;
  onAddCustomGroup: () => void;
  onDeleteGroup: (localId: string) => void;
  onUpdateGroupDescription: (localId: string, description: string) => void;
  onAddCriterion: (
    groupLocalId: string,
    type: "inclusion" | "exclusion",
  ) => void;
  onDeleteCriterion: (
    groupLocalId: string,
    criterionLocalId: string,
    type: "inclusion" | "exclusion",
  ) => void;
  onUpdateCriterion: (
    groupLocalId: string,
    criterionLocalId: string,
    type: "inclusion" | "exclusion",
    text: string,
  ) => void;
}

const ManageStuSeCriteria: React.FC<ManageStuSeCriteriaProps> = ({
  criteriaGroups,
  isGenerating,
  onAiSuggest,
  onAddCustomGroup,
  onDeleteGroup,
  onUpdateGroupDescription,
  onAddCriterion,
  onDeleteCriterion,
  onUpdateCriterion,
}) => {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-text-primary font-bold text-xs uppercase tracking-widest">
          <FileText className="w-4 h-4 text-accent" />
          Selection Criteria Groups
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={onAiSuggest}
            disabled={isGenerating}
            className="min-h-11 w-full justify-center sm:w-auto"
          >
            {isGenerating ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? "Generating..." : "AI Suggest Criteria"}
          </Button>
          <Button variant="secondary" size="sm" onClick={onAddCustomGroup} className="min-h-11 w-full justify-center sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Group
          </Button>
        </div>
      </div>

      {criteriaGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border rounded-xl bg-bg-secondary/50">
          <div className="w-16 h-16 bg-surface-white rounded-xl shadow-none border border-border flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-text-secondary/50" />
          </div>
          <h4 className="text-text-primary font-bold">
            No criteria groups yet
          </h4>
          <p className="text-text-secondary text-sm mt-1 max-w-sm">
            Click the buttons above to let AI suggest criteria based on your
            project goals or start manually by adding a custom group.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {criteriaGroups.map((group, index) => (
            <CriteriaGroupCard
              key={group.localId}
              group={group}
              index={index}
              onDelete={() => onDeleteGroup(group.localId!)}
              onUpdateDescription={(desc) =>
                onUpdateGroupDescription(group.localId!, desc)
              }
              onAddCriterion={(type) => onAddCriterion(group.localId!, type)}
              onDeleteCriterion={(cid, type) =>
                onDeleteCriterion(group.localId!, cid, type)
              }
              onUpdateCriterion={(cid, type, text) =>
                onUpdateCriterion(group.localId!, cid, type, text)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
};

// --- Internal Sub-components ---

interface CriteriaGroupCardProps {
  group: CriteriaGroup;
  index: number;
  onDelete: () => void;
  onUpdateDescription: (description: string) => void;
  onAddCriterion: (type: "inclusion" | "exclusion") => void;
  onDeleteCriterion: (
    criterionId: string,
    type: "inclusion" | "exclusion",
  ) => void;
  onUpdateCriterion: (
    criterionId: string,
    type: "inclusion" | "exclusion",
    text: string,
  ) => void;
}

const CriteriaGroupCard: React.FC<CriteriaGroupCardProps> = ({
  group,
  index,
  onDelete,
  onUpdateDescription,
  onAddCriterion,
  onDeleteCriterion,
  onUpdateCriterion,
}) => {
  return (
    <div
      className={clsx(
        "group overflow-hidden rounded-xl border bg-surface-white transition-colors duration-200 motion-reduce:transition-none hover:border-primary/30",
        group.isAiGenerated ? "border-primary/20" : "border-border",
      )}
    >
      {/* Group Header */}
      <div
        className={clsx(
          "px-6 py-4 flex items-center justify-between border-b",
          group.isAiGenerated
            ? "bg-bg-secondary/50 border-primary/20"
            : "bg-bg-secondary/50 border-border",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-none",
              group.isAiGenerated
                ? "bg-accent text-white"
                : "bg-surface-white text-text-secondary border border-border",
            )}
          >
            {index + 1}
          </div>
          <div>
            <h4 className="text-text-primary font-bold flex items-center gap-2">
              Criteria Group {index + 1}
              {group.isAiGenerated && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-light text-accent text-[10px] font-bold rounded-full uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  AI Suggested
                </span>
              )}
            </h4>
          </div>
        </div>
        <button
          type="button"
          aria-label="Delete criteria group"
          onClick={onDelete}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
          title="Delete Group"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Group Content */}
      <div className="p-6 space-y-6">
        {/* Description Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
            Group Theme / Description
          </label>
          <textarea
            value={group.description}
            onChange={(e) => onUpdateDescription(e.target.value)}
            placeholder="Describe the theme or focus of this criteria group..."
            className="min-h-[80px] w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary outline-none transition-[border-color,box-shadow,background-color] focus:border-primary focus:bg-surface-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
          />
        </div>

        {/* Inclusion & Exclusion Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inclusion Criteria */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-success uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                Inclusion Criteria
              </h5>
              <button
                type="button"
                onClick={() => onAddCriterion("inclusion")}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-xs font-bold text-success transition-colors hover:bg-success/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
              >
                <Plus className="w-3 h-3" />
                Add Criterion
              </button>
            </div>
            <div className="space-y-3">
              {group.inclusionCriteria.length === 0 ? (
                <p className="text-xs text-text-secondary italic py-2">
                  No inclusion criteria added.
                </p>
              ) : (
                group.inclusionCriteria.map((c) => (
                  <CriterionItemRow
                    key={c.localId}
                    criterion={c}
                    type="inclusion"
                    onDelete={() => onDeleteCriterion(c.localId!, "inclusion")}
                    onUpdate={(text) =>
                      onUpdateCriterion(c.localId!, "inclusion", text)
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Exclusion Criteria */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-error">
                <div className="h-2 w-2 rounded-full bg-error" />
                Exclusion Criteria
              </h5>
              <button
                type="button"
                onClick={() => onAddCriterion("exclusion")}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-xs font-bold text-error transition-colors hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
              >
                <Plus className="w-3 h-3" />
                Add Criterion
              </button>
            </div>
            <div className="space-y-3">
              {group.exclusionCriteria.length === 0 ? (
                <p className="text-xs text-text-secondary italic py-2">
                  No exclusion criteria added.
                </p>
              ) : (
                group.exclusionCriteria.map((c) => (
                  <CriterionItemRow
                    key={c.localId}
                    criterion={c}
                    type="exclusion"
                    onDelete={() => onDeleteCriterion(c.localId!, "exclusion")}
                    onUpdate={(text) =>
                      onUpdateCriterion(c.localId!, "exclusion", text)
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CriterionItemRow = ({
  criterion,
  type,
  onDelete,
  onUpdate,
}: {
  criterion: CriterionItem;
  type: "inclusion" | "exclusion";
  onDelete: () => void;
  onUpdate: (text: string) => void;
}) => {
  return (
    <div className="group/item relative rounded-xl border border-transparent bg-bg-secondary p-3 transition-colors duration-150 hover:border-border hover:bg-surface-white motion-reduce:transition-none">
      <div className="flex gap-3">
        <textarea
          value={criterion.text}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder={`Enter ${type} criterion...`}
          className="flex-1 bg-transparent border-none text-text-primary text-sm resize-none outline-none focus:ring-0 p-0 leading-relaxed min-h-[40px]"
        />
        <button
          type="button"
          aria-label={`Delete ${type} criterion`}
          onClick={onDelete}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-within/item:opacity-100 hover:bg-error/10 hover:text-error focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Traceability Sources */}
      {criterion.sources && criterion.sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {criterion.sources.map((source, idx) => (
            <SourceBadge key={idx} source={source} />
          ))}
        </div>
      )}
    </div>
  );
};

const SourceBadge = ({ source }: { source: CriterionSource }) => {
  const isPicoc = source.sourceType === "PICOC";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border shadow-none",
        isPicoc
          ? "bg-primary-light text-accent border-primary/20"
          : "border-border bg-bg-secondary text-text-secondary",
      )}
    >
      <Tag className="w-2.5 h-2.5 opacity-60" />
      <span className="opacity-60">{source.sourceType}:</span>
      {source.sourceId}
    </span>
  );
};

export default ManageStuSeCriteria;
