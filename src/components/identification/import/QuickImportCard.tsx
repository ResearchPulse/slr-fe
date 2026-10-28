// Quick Import Card - SECONDARY ENTRY PATH
import { useState } from "react";
import { FiAlertCircle, FiUpload, FiX } from "react-icons/fi";
import Button from "../../ui/Button";
import type { SearchExecution } from "../../../types/identification";

interface QuickImportCardProps {
  identificationProcessId: string;
  availableStrategies: SearchExecution[];
  onImport: (file: File, source: string, strategyId?: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress?: number; // 0-100
}

const DATABASE_SOURCES = [
  "PubMed",
  "IEEE Xplore",
  "ACM Digital Library",
  "Scopus",
  "Web of Science",
  "Cochrane Library",
  "Google Scholar",
  "Other",
];

export default function QuickImportCard({
  availableStrategies,
  onImport,
  isUploading,
  uploadProgress = 0,
}: QuickImportCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedSource) return;
    await onImport(
      selectedFile,
      selectedSource,
      selectedStrategyId || undefined,
    );
    // Reset form
    setSelectedFile(null);
    setSelectedSource("");
    setSelectedStrategyId("");
  };

  const canImport = selectedFile && selectedSource && !isUploading;
  const willAutoCreateStrategy = !selectedStrategyId;

  return (
    <div
      id="quick-import"
      className="bg-bg-primary border-2 border-dashed border-border rounded-xl p-6 mt-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiAlertCircle className="mt-0.5 h-5 w-5 text-warning" />
          <div>
            <h3 className="font-semibold text-text-primary">Quick Import</h3>
            <p className="text-sm text-text-secondary mt-0.5">
              Import RIS files without a predefined strategy
            </p>
          </div>
        </div>
        <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning ring-1 ring-inset ring-warning/20">
          Fallback Option
        </span>
      </div>

      {/* Warning Banner */}
      <div className="mb-4 rounded-xl border border-warning/20 bg-warning/10 p-3">
        <div className="flex gap-2 text-sm text-text-primary">
          <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              Not recommended for systematic reviews
            </p>
            <p className="mt-1 text-xs leading-5 text-text-secondary">
              For better organization and audit trails, create a search strategy
              first, then import your RIS files.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* File Upload Zone */}
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
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-text-secondary hover:text-text-secondary rounded transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
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
                      accept=".ris,.bib,.csv,.xml"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-xs text-text-secondary">
                  Supported: .ris, .bib, .csv, .xml
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Source Selector */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Database Source <span className="text-error">*</span>
          </label>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
          >
            <option value="">Select a database source...</option>
            {DATABASE_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Strategy Selector */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Link to Existing Strategy{" "}
            <span className="text-xs text-text-secondary font-normal">
              (optional)
            </span>
          </label>
          <select
            value={selectedStrategyId}
            onChange={(e) => setSelectedStrategyId(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
            disabled={availableStrategies.length === 0}
          >
            <option value="">Don't link to a strategy</option>
            {availableStrategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.searchSource} -{" "}
                {new Date(strategy.executedAt).toLocaleDateString()}
              </option>
            ))}
          </select>
          {availableStrategies.length === 0 && (
            <p className="text-xs text-text-secondary mt-1">
              No strategies available. Create one first for better organization.
            </p>
          )}
        </div>

        {/* Auto-Create Warning */}
        {willAutoCreateStrategy && selectedFile && (
          <div className="bg-surface-white border border-border rounded-xl p-3">
            <div className="flex gap-2 text-sm">
              <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="text-text-primary">
                <p className="font-medium">Auto-strategy will be created</p>
                <p className="mt-1 text-xs text-text-secondary">
                  A search strategy will be automatically created as: "
                  {selectedSource} Import - {new Date().toLocaleDateString()}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-text-primary">
                Uploading...
              </span>
              <span className="text-sm font-medium text-text-primary">
                {uploadProgress}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-secondary" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
              <div
                className="h-full rounded-full bg-success transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Import Button */}
        <Button
          onClick={handleImport}
          disabled={!canImport}
          className="w-full"
          variant="secondary"
        >
          <FiUpload className="w-4 h-4 mr-2" />
          {isUploading ? "Importing..." : "Import RIS File"}
        </Button>
      </div>
    </div>
  );
}
