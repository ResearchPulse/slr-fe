import React from "react";
import {
  FiDatabase,
  FiGlobe,
  FiMonitor,
  FiUser,
} from "react-icons/fi";
import Modal from "../../../../components/ui/Modal";
import { cn } from "../../../../utils/cn";
import type { AuditLogEntry } from "../../../../types/auditLog";
import { formatAuditDateTime, stringifyMetadata } from "../utils";

interface AuditLogDetailModalProps {
  entry: AuditLogEntry | null;
  onClose: () => void;
}

const InfoRow: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="min-w-0 rounded-lg border border-border bg-bg-primary/60 p-4">
    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-text-secondary">
      {icon}
      {label}
    </div>
    <div className="break-words text-sm text-text-primary">
      {value}
    </div>
  </div>
);

const DiffBlock: React.FC<{ title: string; value: string }> = ({
  title,
  value,
}) => (
  <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-white">
    <div className="border-b border-border px-4 py-3">
      <h4 className="text-sm font-semibold text-text-primary">
        {title}
      </h4>
    </div>
    <pre className="max-h-[280px] overflow-auto whitespace-pre-wrap break-words bg-bg-primary p-4 font-mono text-xs leading-5 text-text-primary">
      {value}
    </pre>
  </div>
);

const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  entry,
  onClose,
}) => {
  if (!entry) return null;

  const statusClasses =
    entry.status === "Success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-rose-50 text-rose-700 border-rose-100";

  return (
    <Modal
      isOpen={Boolean(entry)}
      onClose={onClose}
      title="Audit Log Details"
      description="Inspect the full event payload and related metadata."
      size="xl"
      className="max-w-[1200px] rounded-xl"
      bodyClassName="p-4 sm:p-5 lg:p-6"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium",
                  statusClasses,
                )}
              >
                {entry.status}
              </span>
              <span className="rounded-md border border-border bg-bg-primary px-2.5 py-1 text-xs font-medium text-text-secondary">
                {entry.resourceType}
              </span>
              {entry.importance === "high" && (
                <span className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                  Important
                </span>
              )}
            </div>
            <div>
              <h4 className="break-words text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
                {entry.action}
              </h4>
              <p className="mt-1 text-sm text-text-secondary">
                Resource ID: {entry.resourceId}
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-lg border border-border bg-white px-4 py-3 sm:min-w-52">
            <div className="text-xs font-medium text-text-secondary">
              Recorded at
            </div>
            <div className="mt-1.5 text-sm font-medium text-text-primary">
              {formatAuditDateTime(entry.timestamp)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoRow
            label="Actor"
            value={entry.user}
            icon={<FiUser className="w-3.5 h-3.5" />}
          />
          <InfoRow
            label="Resource"
            value={`${entry.resourceType} • ${entry.resourceId}`}
            icon={<FiDatabase className="w-3.5 h-3.5" />}
          />
          <InfoRow
            label="IP Address"
            value={entry.ipAddress}
            icon={<FiGlobe className="w-3.5 h-3.5" />}
          />
          <InfoRow
            label="User Agent"
            value={entry.userAgent}
            icon={<FiMonitor className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DiffBlock
            title="Old Value"
            value={stringifyMetadata(entry.oldValue)}
          />
          <DiffBlock
            title="New Value"
            value={stringifyMetadata(entry.newValue)}
          />
        </div>

        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-text-secondary">Action type</div>
            <div className="mt-1 text-sm font-medium capitalize text-text-primary">{entry.actionType}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary">Importance</div>
            <div className="mt-1 text-sm font-medium capitalize text-text-primary">{entry.importance}</div>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-text-secondary">Event ID</div>
            <div className="mt-1 break-all font-mono text-xs text-text-primary">{entry.id}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AuditLogDetailModal;
