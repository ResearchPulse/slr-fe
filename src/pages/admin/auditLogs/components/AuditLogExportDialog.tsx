import React, { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiDownload,
} from "react-icons/fi";
import Modal from "../../../../components/ui/Modal";
import { cn } from "../../../../utils/cn";
import type { AuditLogExportFormat } from "../../../../types/auditLog";
import { EXPORT_FORMAT_OPTIONS } from "../constants";
import { formatRangeLabel } from "../utils";
import { DatePickerField } from "./AuditLogFilters";

interface ExportRequest {
  format: AuditLogExportFormat;
  startDate: string;
  endDate: string;
}

interface AuditLogExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStartDate: string;
  defaultEndDate: string;
  onExport: (request: ExportRequest) => Promise<void> | void;
}

const AuditLogExportDialog: React.FC<AuditLogExportDialogProps> = ({
  isOpen,
  onClose,
  defaultStartDate,
  defaultEndDate,
  onExport,
}) => {
  const [format, setFormat] = useState<AuditLogExportFormat>("csv");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setFormat("csv");
      setStartDate(defaultStartDate);
      setEndDate(defaultEndDate);
      setIsExporting(false);
      setProgress(0);
      setErrorMessage(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [defaultEndDate, defaultStartDate, isOpen]);

  useEffect(() => {
    if (!isExporting) return undefined;

    const steps = [10, 24, 39, 58, 73, 88, 100];
    let currentStep = 0;
    const timer = window.setInterval(() => {
      setProgress(steps[currentStep]);
      currentStep += 1;

      if (currentStep >= steps.length) {
        window.clearInterval(timer);

        try {
          Promise.resolve(onExport({ format, startDate, endDate }))
            .then(() => {
              setIsExporting(false);
              setProgress(100);
              onClose();
            })
            .catch((error: unknown) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "Export failed. Please try again.";
              setErrorMessage(message);
              setIsExporting(false);
              setProgress(0);
            });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Export failed. Please try again.";
          setErrorMessage(message);
          setIsExporting(false);
          setProgress(0);
        }
      }
    }, 220);

    return () => window.clearInterval(timer);
  }, [endDate, format, isExporting, onClose, onExport, startDate]);

  const hasInvalidRange = useMemo(() => {
    if (!startDate || !endDate) return true;
    return new Date(startDate).getTime() > new Date(endDate).getTime();
  }, [endDate, startDate]);

  const handleStartExport = () => {
    if (!startDate || !endDate) {
      setErrorMessage("Select both a start and end date before exporting.");
      return;
    }

    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      setErrorMessage("The start date must be earlier than the end date.");
      return;
    }

    setErrorMessage(null);
    setIsExporting(true);
    setProgress(1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Audit Logs"
      description="Generate a client-side export from the currently selected date range."
      size="lg"
      className="max-w-[820px] rounded-xl"
      bodyClassName="p-4 sm:p-6"
    >
      <div className="space-y-5">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">File format</h3>
          <div className="grid gap-2 sm:grid-cols-3">
          {EXPORT_FORMAT_OPTIONS.map((option) => {
            const isSelected = format === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                aria-pressed={isSelected}
                className={cn(
                  "flex min-h-[92px] items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                  isSelected
                    ? "border-accent bg-bg-secondary"
                    : "border-border bg-white hover:bg-bg-primary",
                )}
              >
                <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-accent"
                        : "border-text-muted",
                    )}
                  >
                    {isSelected && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text-primary">{option.label}</span>
                  <span className="mt-1 block text-xs leading-4 text-text-secondary">{option.description}</span>
                </span>
              </button>
            );
          })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-primary">Date range</h3>
            <span className="text-xs text-text-secondary">{formatRangeLabel(startDate, endDate)}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePickerField label="Start date" value={startDate} onChange={setStartDate} />
            <DatePickerField label="End date" value={endDate} onChange={setEndDate} />
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            The file is generated in your browser and downloaded to your device.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <FiAlertTriangle className="w-4 h-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        {isExporting && (
          <div className="space-y-3 rounded-lg border border-border bg-bg-primary p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Generating export
                </p>
                <p className="text-xs text-text-secondary">
                  Preparing the {format.toUpperCase()} file for download.
                </p>
              </div>
              <div className="text-sm font-semibold text-accent">{progress}%</div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="h-10 rounded-xl border border-border bg-white px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg-primary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartExport}
            disabled={isExporting || hasInvalidRange}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
              isExporting || hasInvalidRange
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-accent text-white hover:bg-primary-hover",
            )}
          >
            <FiDownload className="w-4 h-4" />
            {isExporting ? "Exporting..." : `Export ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AuditLogExportDialog;
