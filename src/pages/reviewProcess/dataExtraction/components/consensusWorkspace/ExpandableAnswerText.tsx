import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableAnswerTextProps {
  text: string;
  className?: string;
}

export default function ExpandableAnswerText({
  text,
  className = "",
}: ExpandableAnswerTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Consider text "long" if length > 120 chars or multiple lines
  const isLong = text.length > 120 || text.includes("\n");

  if (!isLong) {
    return (
      <div
        className={`min-w-0 flex-1 break-words whitespace-pre-wrap leading-relaxed ${
          text === "Not provided" ? "text-text-muted" : "text-text-primary"
        } ${className}`}
      >
        {text}
      </div>
    );
  }

  return (
    <div className={`min-w-0 flex-1 ${className}`}>
      <div
        className={`break-words whitespace-pre-wrap leading-relaxed text-text-primary ${
          isExpanded ? "" : "line-clamp-3"
        }`}
      >
        {text}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
        className="mt-1.5 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary-light/50 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
        aria-expanded={isExpanded}
      >
        <span>{isExpanded ? "Show less" : "Show more"}</span>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
