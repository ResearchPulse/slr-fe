import React from "react";
import { Users, Zap, Activity, Target, Microscope } from "lucide-react";
import { clsx } from "clsx";

interface Picoc {
  id: string;
  population: string;
  intervention: string;
  comparator: string;
  outcome: string;
  context: string;
}

interface ProjectPICOCElementProps {
  picocs: Picoc[] | undefined;
  isCompact?: boolean;
}

interface OutcomeGroup {
  label: string;
  values: string[];
}

const parseOutcomeGroups = (value: string): OutcomeGroup[] | null => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "(") depth += 1;
    if (value[index] === ")") depth = Math.max(0, depth - 1);
    if (value[index] === ";" && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));

  const groups = parts
    .map((part) => {
      const match = part
        .trim()
        .match(/^([^()]+?)\s*\(([\s\S]*)\)\s*[,.;]*$/);
      if (!match) return null;

      return {
        label: match[1].trim().replace(/[:,;]+$/, ""),
        values: match[2]
          .split(";")
          .map((item) => item.trim().replace(/^[,;\s]+|[,;\s]+$/g, ""))
          .filter(Boolean),
      };
    })
    .filter((group): group is OutcomeGroup => group !== null);

  return groups.length > 1 ? groups : null;
};

const ProjectPICOCElement: React.FC<ProjectPICOCElementProps> = ({
  picocs,
  isCompact,
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-text-primary font-bold text-xs uppercase tracking-widest">
        <Target className="w-4 h-4 text-rose-500" />
        Project PICOC Framework
      </div>
      <div
        className={clsx(
          "grid gap-3",
          isCompact
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
        )}
      >
        {picocs && picocs.length > 0 ? (
          picocs.map((p) => (
            <React.Fragment key={p.id}>
              <PicocElementCard
                label="Population"
                value={p.population}
                icon={<Users className="w-4 h-4" />}
                color="blue"
                isCompact={isCompact}
              />
              <PicocElementCard
                label="Intervention"
                value={p.intervention}
                icon={<Zap className="w-4 h-4" />}
                color="amber"
                isCompact={isCompact}
              />
              <PicocElementCard
                label="Comparator"
                value={p.comparator}
                icon={<Activity className="w-4 h-4" />}
                color="emerald"
                isCompact={isCompact}
              />
              <PicocElementCard
                label="Outcome"
                value={p.outcome}
                icon={<Target className="w-4 h-4" />}
                color="rose"
                isCompact={isCompact}
              />
              <PicocElementCard
                label="Context"
                value={p.context}
                icon={<Microscope className="w-4 h-4" />}
                color="indigo"
                isCompact={isCompact}
              />
            </React.Fragment>
          ))
        ) : (
          <div className="col-span-full py-6 text-center bg-bg-secondary rounded-xl border border-dashed border-border text-text-secondary text-sm italic">
            No PICOC elements defined.
          </div>
        )}
      </div>
    </section>
  );
};

// Helper component for PICOC elements
const PicocElementCard = ({
  label,
  value,
  icon,
  color,
  isCompact,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  isCompact?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const colorMap: Record<string, string> = {
    blue: "bg-primary-light text-accent border-primary/20",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-bg-secondary text-text-primary border-border",
    indigo: "bg-bg-secondary text-indigo-700 border-indigo-100",
  };

  const text = value || `No ${label.toLowerCase()}`;
  const isLongText = text.length > (isCompact ? 100 : 60);
  const outcomeGroups =
    isCompact && label === "Outcome" ? parseOutcomeGroups(text) : null;
  const visibleOutcomeGroups = isExpanded
    ? outcomeGroups
    : outcomeGroups?.slice(0, 3);

  return (
    <div
      className={clsx(
        "h-fit rounded-xl border p-3 transition-colors duration-150 hover:border-primary/30 motion-reduce:transition-none",
        colorMap[color],
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 opacity-80">
          <div className="p-1 bg-surface-white/50 rounded-md">
            {React.isValidElement(icon) &&
              React.cloneElement(
                icon as React.ReactElement<{ className?: string }>,
                { className: "w-3 h-3" },
              )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {label}
          </span>
        </div>
        {isLongText && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-medium text-accent transition-colors hover:bg-surface-white/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
          >
            {isExpanded ? "Show less" : "Show all"}
          </button>
        )}
      </div>
      {visibleOutcomeGroups ? (
        <div className="mt-1 divide-y divide-border/70">
          {visibleOutcomeGroups.map((group) => (
            <div key={group.label} className="py-1.5 first:pt-0 last:pb-0">
              <p className="break-words text-[10px] font-semibold capitalize leading-4 text-text-secondary">
                {group.label}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {group.values.map((item, index) => (
                  <span
                    key={`${group.label}-${index}`}
                    className="max-w-full break-words rounded bg-surface-white/80 px-1.5 py-0.5 text-[10px] leading-4 text-text-primary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p
          className={clsx(
            "break-words text-[11px] font-medium leading-relaxed",
            !isExpanded && (isCompact ? "line-clamp-4" : "line-clamp-2"),
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default ProjectPICOCElement;
