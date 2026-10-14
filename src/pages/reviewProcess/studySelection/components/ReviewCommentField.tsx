import { FiMessageSquare } from "react-icons/fi";

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
    <div className="flex min-w-[150px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface-white px-2.5 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10">
      <FiMessageSquare aria-hidden="true" className="h-4 w-4 shrink-0 text-text-secondary" />
      <label className="sr-only" htmlFor="review-note">Add review note (optional)</label>
      <textarea
        id="review-note"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        maxLength={16000}
        rows={1}
        placeholder="Add review note…"
        onInput={(event) => {
          const input = event.currentTarget;
          input.style.height = "auto";
          input.style.height = `${Math.min(input.scrollHeight, 88)}px`;
        }}
        className="max-h-[88px] min-h-[36px] w-full resize-none border-0 bg-transparent py-2 text-xs leading-5 text-text-primary outline-none placeholder:text-text-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
