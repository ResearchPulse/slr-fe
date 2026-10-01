import { FiCheck, FiLock, FiClock } from "react-icons/fi";
import type { PhaseStatusType } from "./types";

interface PhaseStatusBadgeProps {
  status: PhaseStatusType;
}

const STATUS_CONFIG: Record<
  PhaseStatusType,
  { label: string; classes: string; icon: React.ReactNode }
> = {
  Completed: {
    label: "Completed",
    classes: "bg-success/10 text-success border-success/20",
    icon: <FiCheck className="w-3 h-3" />,
  },
  InProgress: {
    label: "In Progress",
    classes: "bg-primary-light text-primary border-primary/20",
    icon: <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />,
  },
  NotStarted: {
    label: "Not Started",
    classes: "bg-bg-secondary text-text-secondary border-border",
    icon: <FiClock className="w-3 h-3" />,
  },
  Locked: {
    label: "Locked",
    classes: "bg-bg-secondary text-text-secondary border-border",
    icon: <FiLock className="w-3 h-3" />,
  },
};

export default function PhaseStatusBadge({ status }: PhaseStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.classes}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
