import Select from "../../ui/Select";
// Import RIS Modal - Dual Mode (from-strategy OR quick-import)
import { useState } from "react";
import { FiX, FiUpload, FiLock, FiLoader } from "react-icons/fi";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import type { SearchExecution } from "../../../types/identification";

interface ImportRISModalProps {
  identificationProcessId: string;
  isOpen: boolean;
  mode: "from-strategy" | "quick-import";
  preselectedStrategyId?: string; // locked if mode = 'from-strategy'
  availableStrategies?: SearchExecution[]; // for quick-import mode
  onClose: () => void;
  onSubmit: (file: File, source?: string, strategyId?: string) => Promise<void>;
  isUploading?: boolean;
  uploadProgress?: number; // 0-100
  sourceOptions?: { label: string; value: string }[];
  sourceLabel?: string;
  sourcePlaceholder?: string;
  sourceRequiredInQuickImport?: boolean;
  showStrategySelectorInQuickImport?: boolean;
}

const DATABASE_SOURCES = [
  { label: "PubMed", value: "PubMed" },
  { label: "IEEE Xplore", value: "IEEE Xplore" },
  { label: "ACM Digital Library", value: "ACM Digital Library" },
  { label: "Scopus", value: "Scopus" },
  { label: "Web of Science", value: "Web of Science" },
  { label: "Cochrane Library", value: "Cochrane Library" },
  { label: "Google Scholar", value: "Google Scholar" },
  { label: "Other", value: "Other" },
];

export default function ImportRISModal({
  isOpen,
  mode,
  preselectedStrategyId,
  availableStrategies = [],
  onClose,
  onSubmit,
  isUploading = false,
  uploadProgress = 0,
  sourceOptions = DATABASE_SOURCES,
  sourceLabel = "Database Source",
  sourcePlaceholder = "Select a database source...",
  sourceRequiredInQuickImport = true,
  showStrategySelectorInQuickImport = true,
}: ImportRISModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(
    preselectedStrategyId || "",
  );
  const [isDragging, setIsDragging] = useState(false);

  const preselectedStrategy = availableStrategies.find(
    (s) => s.id === preselectedStrategyId,
  );
  const isProcessing = isUploading && uploadProgress >= 100;
  const isIndeterminate = uploadProgress === 0 || isProcessing;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    // Simulate parsing (in real app, parse RIS file)
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    // In quick-import mode, source is required
    if (
      mode === "quick-import" &&
      sourceRequiredInQuickImport &&
      !selectedSource
    )
      return;

    await onSubmit(
      selectedFile,
      selectedSource,
      (mode === "from-strategy" ? preselectedStrategyId : selectedStrategyId) || undefined,
    );

    // Reset form
    setSelectedFile(null);
    setSelectedSource("");
    setSelectedStrategyId(preselectedStrategyId || "");
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setSelectedSource("");
      setSelectedStrategyId(preselectedStrategyId || "");
      onClose();
    }
  };

  const canSubmit =
    selectedFile &&
    !isUploading &&
    (mode === "from-strategy" ||
      (mode === "quick-import" &&
        (!sourceRequiredInQuickImport || Boolean(selectedSource))));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        mode === "from-strategy"
          ? "Import RIS to Strategy"
          : "Quick Import RIS File"
      }
      size="lg"
    >
      {/* Mode-specific Info Banner */}
      {mode === "from-strategy" && preselectedStrategy && (
        <div className="bg-primary-light border border-accent/30 rounded-xl p-4 mb-6">
          <div className="flex gap-2 text-sm">
            <FiLock className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <div className="text-text-primary">
              <p className="font-medium">Importing to strategy:</p>
              <p className="text-xs text-accent mt-1">
                {preselectedStrategy.searchSource} -{" "}
                {new Date(preselectedStrategy.executedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            RIS File <span className="text-error">*</span>
          </label>
          <div
            className={`relative rounded-xl border-2 border-dashed p-6 transition-colors motion-reduce:transition-none ${
              isDragging
                ? "border-primary bg-primary-light"
                : "border-border bg-surface-white hover:border-primary/40"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiUpload className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                    disabled={isUploading}
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Parsed Record Count */}
                {/* {parsedRecordCount !== null && (
                  <div className="bg-surface-white border border-border rounded-xl p-3">
                    <div className="flex items-center gap-2 text-sm text-success">
                      <FiCheck className="w-4 h-4" />
                      <p className="font-medium">
                        {parsedRecordCount.toLocaleString()} records detected
                      </p>
                    </div>
                  </div>
                )} */}
              </div>
            ) : (
              <div className="text-center">
                <FiUpload className="w-10 h-10 text-text-secondary mx-auto mb-2" />
                <p className="text-sm text-text-primary mb-1">
                  Drag and drop your RIS file here, or{" "}
                  <label className="text-accent hover:text-primary-hover cursor-pointer underline">
                    browse
                    <input
                      type="file"
                      accept=".ris"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </p>
                <p className="text-xs text-text-secondary">Supported: .ris</p>
              </div>
            )}
          </div>
        </div>

        {/* Source Selector (Quick Import Mode Only) */}
        {mode === "quick-import" && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {sourceLabel}{" "}
              {sourceRequiredInQuickImport && (
                <span className="text-error">*</span>
              )}
            </label>
            <Select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
              disabled={isUploading}
            >
              <option value="">{sourcePlaceholder}</option>
              {sourceOptions.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Strategy Selector (Quick Import Mode Only) */}
        {mode === "quick-import" && showStrategySelectorInQuickImport && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Link to Existing Strategy{" "}
              <span className="text-xs text-text-secondary font-normal">
                (optional)
              </span>
            </label>
            <Select
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
              disabled={isUploading || availableStrategies.length === 0}
            >
              <option value="">Don't link to a strategy</option>
              {availableStrategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.searchSource} -{" "}
                  {new Date(strategy.executedAt).toLocaleDateString()}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Upload and server-processing progress */}
        {isUploading && (
          <div className="mt-4" role="status" aria-live="polite">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-text-primary">
                <FiLoader
                  aria-hidden="true"
                  className="h-4 w-4 text-primary motion-safe:animate-spin motion-reduce:animate-none"
                />
                {isProcessing
                  ? "Upload complete · importing RIS records..."
                  : uploadProgress > 0
                    ? "Uploading RIS file..."
                    : "Preparing upload..."}
              </span>
              {!isProcessing && uploadProgress > 0 && (
                <span className="tabular-nums text-text-secondary">
                  {uploadProgress}%
                </span>
              )}
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-bg-secondary"
              role="progressbar"
              aria-label="RIS import progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={isIndeterminate ? undefined : uploadProgress}
            >
              <div
                className={`relative h-full rounded-full bg-primary ${
                  isIndeterminate
                    ? "w-1/3 motion-safe:animate-ris-progress-indeterminate motion-reduce:animate-none"
                    : "transition-[width] duration-200"
                }`}
                style={isIndeterminate ? undefined : { width: `${uploadProgress}%` }}
              >
                {!isIndeterminate && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1/3 bg-white/20 motion-safe:animate-shimmer motion-reduce:hidden"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isUploading ? (
              <FiLoader className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none" />
            ) : (
              <FiUpload className="h-4 w-4" />
            )}
            {isUploading
              ? isProcessing ? "Processing..." : "Uploading..."
              : "Import RIS File"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
