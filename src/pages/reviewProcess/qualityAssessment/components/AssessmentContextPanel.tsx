interface AssessmentContextPanelProps {
  mode: "criteria" | "ai";
}

const DUMMY_CRITERIA = [
  "Is the research question clearly stated?",
  "Is the study design appropriate?",
  "Are the data collection methods valid?",
  "Are the findings clearly described?",
];

export default function AssessmentContextPanel({
  mode,
}: AssessmentContextPanelProps) {
  return (
    <div className="w-80 shrink-0 bg-surface-white border-l border-border flex flex-col">
      <div className="px-4 py-3 border-b border-border bg-bg-primary">
        <h2 className="text-sm font-semibold text-text-primary">
          {mode === "criteria" ? "Quality Checklist" : "AI Suggestions"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {mode === "criteria" ? (
          <div className="space-y-6">
            {DUMMY_CRITERIA.map((crit, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-sm font-medium text-text-primary">
                  {idx + 1}. {crit}
                </p>
                <div className="flex gap-2">
                  <button className="min-h-11 flex-1 rounded-xl border border-border py-1 text-xs font-medium transition-colors hover:border-success/30 hover:bg-success/10 hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none">
                    Yes
                  </button>
                  <button className="min-h-11 flex-1 rounded-xl border border-border py-1 text-xs font-medium transition-colors hover:border-error/30 hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none">
                    No
                  </button>
                  <button className="min-h-11 flex-1 rounded-xl border border-border py-1 text-xs font-medium transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none">
                    Partial
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-text-secondary">
            <p className="mb-4">
              AI evaluating paper against established criteria.
            </p>
            <div className="p-3 bg-primary-light text-accent rounded-xl">
              🤖 Suggestion: Based on section 3.2, the data collection methods
              seem well documented. (Confidence: 85%)
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-bg-primary space-y-2">
        <button className="min-h-11 w-full rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-none transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none">
          Complete Assessment
        </button>
      </div>
    </div>
  );
}
