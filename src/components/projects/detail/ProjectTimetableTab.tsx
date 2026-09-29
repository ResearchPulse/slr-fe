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
    formStartDate.length > 0 &&
    formEndDate.length > 0 &&
    new Date(formStartDate).getTime() > new Date(formEndDate).getTime();

  const canSave = useMemo(
    () =>
      !isSaving &&
      !hasInvalidRange &&
      (formStartDate !== initialStartDate || formEndDate !== initialEndDate),
    [
      formStartDate,
      formEndDate,
      hasInvalidRange,
      isSaving,
      initialStartDate,
      initialEndDate,
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
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary mb-5">
        Project Date Window
      </p>

      <div className="border border-border bg-surface-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-text-secondary font-medium mb-2">
              Expected Start Date
            </label>
            <input
              type="date"
              value={formStartDate}
              onChange={(event) => setFormStartDate(event.target.value)}
              disabled={!isLeader || isSaving}
              className="w-full px-3 py-2 border border-border bg-surface-white text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent disabled:bg-bg-secondary disabled:text-text-muted outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-text-secondary font-medium mb-2">
              Expected End Date
            </label>
            <input
              type="date"
              value={formEndDate}
              onChange={(event) => setFormEndDate(event.target.value)}
              disabled={!isLeader || isSaving}
              className="w-full px-3 py-2 border border-border bg-surface-white text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent disabled:bg-bg-secondary disabled:text-text-muted outline-none transition-colors"
            />
          </div>
        </div>

        {hasInvalidRange && (
          <p className="text-sm text-accent mt-3">
            End Date must be the same as or after Start Date.
          </p>
        )}

        {!isLeader && (
          <p className="text-sm text-text-secondary mt-3">
            Only project leaders can update project dates.
          </p>
        )}

        <div className="flex justify-end mt-5 pt-4 border-t border-border">
          <Button
            onClick={() => void handleSave()}
            disabled={!isLeader || !canSave}
          >
            {isSaving ? "Saving..." : "Save Dates"}
          </Button>
        </div>
      </div>
    </div>
  );
}
