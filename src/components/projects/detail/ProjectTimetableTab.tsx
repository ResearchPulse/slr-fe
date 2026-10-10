import { useMemo, useState } from "react";
import Button from "../../ui/Button";
import { toDateInputValue } from "../../../utils/dateUtils";

interface ProjectTimetableTabProps {
  projectId: string;
  startDate?: string | null;
  endDate?: string | null;
  isLeader?: boolean;
  isSaving?: boolean;
  onSave: (payload: {
    id: string;
    startDate: string | null;
    endDate: string | null;
  }) => Promise<unknown>;
}

const formatDate = (value: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ProjectTimetableTab({
  projectId,
  startDate,
  endDate,
  isLeader = false,
  isSaving = false,
  onSave,
}: ProjectTimetableTabProps) {
  const initialStartDate = toDateInputValue(startDate);
  const initialEndDate = toDateInputValue(endDate);
  const [formStartDate, setFormStartDate] = useState(initialStartDate);
  const [formEndDate, setFormEndDate] = useState(initialEndDate);
  const hasInvalidRange =
    Boolean(formStartDate && formEndDate) &&
    new Date(formStartDate).getTime() > new Date(formEndDate).getTime();
  const canSave = useMemo(
    () =>
      isLeader &&
      !isSaving &&
      !hasInvalidRange &&
      (formStartDate !== initialStartDate || formEndDate !== initialEndDate),
    [
      formStartDate,
      formEndDate,
      hasInvalidRange,
      initialStartDate,
      initialEndDate,
      isLeader,
      isSaving,
    ],
  );

  const handleSave = async () => {
    await onSave({
      id: projectId,
      startDate: formStartDate || null,
      endDate: formEndDate || null,
    });
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-text-primary">Review window</h3>
        <p className="text-sm text-text-secondary">
          {formatDate(formStartDate)} – {formatDate(formEndDate)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-text-secondary">
          Start date
          <input
            type="date"
            value={formStartDate}
            onChange={(event) => setFormStartDate(event.target.value)}
            disabled={!isLeader || isSaving}
            className="mt-2 w-full rounded-xl border border-border bg-surface-white px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-bg-primary disabled:text-text-muted"
          />
        </label>
        <label className="block text-sm text-text-secondary">
          End date
          <input
            type="date"
            value={formEndDate}
            onChange={(event) => setFormEndDate(event.target.value)}
            disabled={!isLeader || isSaving}
            className="mt-2 w-full rounded-xl border border-border bg-surface-white px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-bg-primary disabled:text-text-muted"
          />
        </label>
      </div>

      {hasInvalidRange && (
        <p className="mt-3 text-sm text-red-700">
          End date must be the same as or later than the start date.
        </p>
      )}
      {!isLeader && (
        <p className="mt-3 text-sm text-text-secondary">
          Only project leaders can update the review timeline.
        </p>
      )}

      {isLeader && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void handleSave()} disabled={!canSave} size="sm">
            {isSaving ? "Saving…" : "Save timeline"}
          </Button>
        </div>
      )}
    </section>
  );
}
