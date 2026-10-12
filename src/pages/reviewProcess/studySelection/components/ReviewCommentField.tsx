interface ReviewCommentFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ReviewCommentField({
  value,
  onChange,
  disabled = false,
}: ReviewCommentFieldProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary/50 px-3 py-2.5">
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        Review comment <span className="font-normal normal-case">(optional)</span>
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        maxLength={16000}
        rows={2}
        placeholder="Add a note about this decision..."
        className="w-full resize-none rounded-lg border border-border bg-surface-white px-3 py-2 text-xs text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
