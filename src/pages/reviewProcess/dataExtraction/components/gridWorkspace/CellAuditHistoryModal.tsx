import { Clock3, Loader2, UserCircle2 } from "lucide-react";
import Modal from "../../../../../components/ui/Modal";
import { getErrorMessage } from "../../../../../utils/errorUtils";
import { useCellAuditLogs } from "../../hooks/useCellAuditLogs";

interface CellAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  paperId: string | null;
  fieldId: string | null;
  fieldLabel: string;
}

function formatHistoryTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}


export default function CellAuditHistoryModal({
  isOpen,
  onClose,
  projectId,
  paperId,
  fieldId,
  fieldLabel,
}: CellAuditHistoryModalProps) {
  const auditLogsQuery = useCellAuditLogs({
    projectId,
    paperId,
    fieldId,
    isOpen,
  });

  const logs = auditLogsQuery.data ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cell History"
      description={`Audit trail for ${fieldLabel || "selected field"}`}
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-bg-primary px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
            Field
          </p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {fieldLabel || "Unknown"}
          </p>
        </div>

        {auditLogsQuery.isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-border bg-bg-secondary px-4 py-10">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span className="ml-2 text-sm text-text-secondary">
              Loading history...
            </span>
          </div>
        ) : null}

        {auditLogsQuery.error ? (
          <div className="rounded-xl border border-border bg-surface-white px-4 py-3 text-sm text-red-700">
            {getErrorMessage(
              auditLogsQuery.error,
              "Unable to load cell history.",
            )}
          </div>
        ) : null}

        {!auditLogsQuery.isLoading &&
        !auditLogsQuery.error &&
        logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-white px-4 py-8 text-center">
            <Clock3 className="mx-auto h-5 w-5 text-text-secondary" />
            <p className="mt-2 text-sm text-text-secondary">
              No manual edits have been made to this cell.
            </p>
          </div>
        ) : null}

        {!auditLogsQuery.isLoading &&
        !auditLogsQuery.error &&
        logs.length > 0 ? (
          <ol className="space-y-3">
            {logs.map((log, index) => {
              const isLatest = index === 0;

              return (
                <li
                  key={log.id}
                  className="relative rounded-xl border border-border bg-surface-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <UserCircle2 className="h-5 w-5 shrink-0 text-text-secondary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {log.actorId || "Unknown user"}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {formatHistoryTime(log.createdAt)}
                        </p>
                      </div>
                    </div>

                    {isLatest ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Latest
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm">
                    <p>
                      <span className="font-semibold">Action:</span>{" "}
                      {log.action || "Unknown action"}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">Version:</span>{" "}
                      {log.version}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </Modal>
  );
}
