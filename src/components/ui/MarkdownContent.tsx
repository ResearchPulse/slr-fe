import ReactMarkdown from "react-markdown";
import { cn } from "../../utils/cn";

interface MarkdownContentProps {
  content: string;
  className?: string;
  variant?: "blue" | "red" | "green" | "gray" | "amber" | "slate";
  inline?: boolean;
}

export function MarkdownContent({
  content,
  className,
  variant = "slate",
  inline = false,
}: MarkdownContentProps) {
  const styles = {
    blue: {
      text: "text-accent",
      strong: "text-text-primary bg-primary-light px-1 rounded-sm border border-primary/15",
      em: "text-accent italic underline decoration-primary/30 decoration-1 underline-offset-4",
      marker: "marker:text-accent",
      code: "text-accent bg-primary-light/60 border-primary/15",
    },
    red: {
      text: "text-error",
      strong: "text-error bg-error/5 px-1 rounded-sm border border-error/15",
      em: "text-error italic underline decoration-error/30 decoration-1",
      marker: "marker:text-error/70",
      code: "text-error bg-error/5 border-error/15",
    },
    green: {
      text: "text-success",
      strong: "text-success bg-success/5 px-1 rounded-sm border border-success/15",
      em: "text-success italic underline decoration-success/30 decoration-1",
      marker: "marker:text-success",
      code: "text-success bg-success/5 border-success/15",
    },
    amber: {
      text: "text-warning",
      strong: "text-warning bg-warning/10 px-1 rounded-sm border border-warning/20",
      em: "text-warning italic underline decoration-warning/30 decoration-1",
      marker: "marker:text-warning",
      code: "text-warning bg-warning/10 border-warning/20",
    },
    slate: {
      text: "text-text-secondary",
      strong: "text-text-primary bg-bg-secondary px-1 rounded-sm border border-border/60",
      em: "text-text-primary italic underline decoration-border decoration-1 underline-offset-4",
      marker: "marker:text-text-secondary",
      code: "text-text-secondary bg-bg-primary border-border",
    },
    gray: {
      text: "text-text-secondary",
      strong: "text-text-primary bg-bg-secondary px-1 rounded-sm border border-border/60",
      em: "text-text-primary italic underline decoration-border decoration-1",
      marker: "marker:text-text-secondary",
      code: "text-text-secondary bg-bg-primary border-border",
    },
  };

  const current = styles[variant];

  const commonTextClasses = cn(
    "font-medium tracking-tight antialiased",
    current.text,
  );

  return (
    <div className={cn("max-w-none font-outfit", className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) =>
            inline ? (
              <span
                className={cn(
                  "inline leading-relaxed text-[10.5px]",
                  commonTextClasses,
                )}
              >
                {children}
              </span>
            ) : (
              <p
                className={cn(
                  "mb-2 last:mb-0 leading-[1.6] text-[10.5px]",
                  commonTextClasses,
                )}
              >
                {children}
              </p>
            ),
          strong: ({ children }) => (
            <strong className={cn("font-bold", current.strong)}>
              {children}
            </strong>
          ),
          em: ({ children }) => <em className={cn(current.em)}>{children}</em>,
          ul: ({ children }) => (
            <ul
              className={cn(
                "list-disc pl-3.5 mb-2.5 space-y-1.5",
                current.marker,
              )}
            >
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li
              className={cn(
                "pl-1 text-[10.5px] leading-relaxed",
                commonTextClasses,
              )}
            >
              {children}
            </li>
          ),
          code: ({ children }) => (
            <code
              className={cn(
                "px-1 py-0.5 rounded-[3px] text-[9.5px] font-mono border-px",
                current.code,
              )}
            >
              {children}
            </code>
          ),
          h1: ({ children }) => (
            <h1 className="text-[11px] font-black uppercase tracking-widest mb-3 mt-4 first:mt-0 text-text-primary">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[10px] font-black uppercase tracking-wider mb-2 mt-3 first:mt-0 text-text-secondary">
              {children}
            </h2>
          ),
          blockquote: ({ children }) => (
            <blockquote className="pl-3 border-l-2 border-border italic text-text-secondary my-2 text-[10px]">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
