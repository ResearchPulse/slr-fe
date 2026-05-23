import type { EditableResearchQuestion, PicoCForm, ScopeForm } from "../types";

interface SetupSummaryViewProps {
  topic: string;
  scopeForm: ScopeForm;
  picocForm: PicoCForm;
  researchQuestions: EditableResearchQuestion[];
  onEdit: () => void;
  isLeader?: boolean;
  hideEditButton?: boolean;
  hidePicoc?: boolean;
  hideResearchQuestions?: boolean;
}

export default function SetupSummaryView({
  topic,
  scopeForm,
  picocForm,
  researchQuestions,
  onEdit,
  isLeader = false,
  hideEditButton = false,
  hidePicoc = false,
  hideResearchQuestions = false,
}: SetupSummaryViewProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Setup Summary</h2>
          <p className="text-sm text-text-secondary">
            Project setup already exists. You can review or edit it.
          </p>
        </div>
        {isLeader && !hideEditButton && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-[4px] bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Edit Setup
          </button>
        )}
      </div>

      <div className="rounded-[4px] border border-border bg-surface-white p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Research Topic
        </p>
        <p className="text-sm text-slate-800">{topic || "-"}</p>
      </div>

      <div className="rounded-[4px] border border-border bg-surface-white p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Scope
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-text-secondary">
              Objective
            </p>
            <p className="text-sm text-slate-800">
              {scopeForm.objectives || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary">Domain</p>
            <p className="text-sm text-slate-800">{scopeForm.domain || "-"}</p>
          </div>
        </div>
      </div>

      {!hidePicoc && (
        <div className="rounded-[4px] border border-border bg-surface-white p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            PICO-C
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-text-secondary">
                Population (P)
              </p>
              <p className="text-sm text-slate-800">
                {picocForm.population || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary">
                Intervention (I)
              </p>
              <p className="text-sm text-slate-800">
                {picocForm.intervention || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary">
                Comparator (C)
              </p>
              <p className="text-sm text-slate-800">
                {picocForm.comparator || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary">
                Outcome (O)
              </p>
              <p className="text-sm text-slate-800">
                {picocForm.outcome || "-"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-text-secondary">
                Context (C)
              </p>
              <p className="text-sm text-slate-800">
                {picocForm.context || "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {!hideResearchQuestions && (
        <div className="rounded-[4px] border border-indigo-100 bg-bg-secondary/70 p-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-100/70 px-3 py-1 text-xs font-semibold text-indigo-700">
            Research Questions
          </div>

          <div className="space-y-2">
            {researchQuestions.length === 0 && (
              <p className="text-sm text-text-secondary">
                No research questions added yet.
              </p>
            )}

            {researchQuestions.map((rq, index) => (
              <div
                key={`${rq.id ?? "new"}-${index}`}
                className="rounded-[4px] border border-indigo-100 bg-surface-white/80 p-3"
              >
                <p className="text-xs font-semibold text-indigo-700">
                  RQ {index + 1}
                </p>
                <p className="text-sm text-slate-800">{rq.questionText}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
