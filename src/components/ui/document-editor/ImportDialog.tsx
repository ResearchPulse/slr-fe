import React, { useState } from "react";
import {
  Upload,
  FileCode,
  AlertCircle,
  Info,
  Code2,
  Loader2,
} from "lucide-react";
import Modal from "../Modal";
import Button from "../Button";
import Textarea from "../Textarea";
import { validateChecklistDraftJson } from "../../../utils/documentEditorHelpers";
import { toast } from "react-hot-toast";
import { studySelectionService } from "../../../services/studySelectionService";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (data: unknown) => void;
  screeningProcessId?: string;
  allowImportCriterias?: boolean;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport,
  screeningProcessId,
  allowImportCriterias,
}) => {
  const [jsonInput, setJsonInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isImportingFromProtocol, setIsImportingFromProtocol] = useState(false);

  const handleImportFromProtocol = async () => {
    if (!screeningProcessId) {
      toast.error("Process ID is missing. Cannot import criteria.");
      return;
    }

    setIsImportingFromProtocol(true);
    try {
      const response =
        await studySelectionService.getLiveReviewImport(screeningProcessId);
      if (response.isSuccess && response.data) {
        onImport?.(response.data);
        onClose();
        toast.success("Criteria imported and appended successfully!");
      } else {
        toast.error(
          response.message || "Failed to import criteria from protocol",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while importing criteria",
      );
    } finally {
      setIsImportingFromProtocol(false);
    }
  };

  const handleImport = () => {
    try {
      if (!jsonInput.trim()) {
        setValidationError("Please provide JSON content to import.");
        return;
      }

      const parsed = JSON.parse(jsonInput);
      const validation = validateChecklistDraftJson(parsed);

      if (!validation.isValid) {
        setValidationError(validation.error || "Invalid JSON structure");
        return;
      }

      if (onImport) {
        onImport(parsed);
      }
      setValidationError(null);
      onClose();
      setJsonInput("");
    } catch {
      setValidationError("Invalid JSON format. Please check your syntax.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".json")) {
        toast.error("Please upload a .json file");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setJsonInput(content);
        setValidationError(null);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Checklist JSON"
      description="Populate your checklist from raw JSON data."
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            className="px-8 hover:bg-bg-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!jsonInput.trim()}
            className="px-12 gap-2"
          >
            <FileCode className="w-5 h-5" /> Import Now
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Tutorial Toggle */}
        <div className="space-y-3">
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-widest text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none group"
          >
            <Info
              size={14}
              className="group-hover:rotate-12 transition-transform"
            />
            {showTutorial
              ? "Hide Structure Guide"
              : "View JSON Structure Guide"}
          </button>

          {showTutorial && (
            <div className="rounded-xl border border-primary/15 bg-bg-secondary/50 p-5 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-text-primary">
                <Code2 className="text-primary" size={16} />
                Required Data Structure
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <p className="text-[11px] font-medium leading-relaxed text-text-secondary">
                    Importing will append new criteria to your current work.
                    Ensure the JSON follows the schema.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-[10px] font-bold text-text-secondary">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      New content will be appended to the end of the document
                    </li>
                    <li className="flex items-start gap-2 text-[10px] font-bold text-text-secondary">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      Client-side IDs are regenerated safely
                    </li>
                    <li className="flex items-start gap-2 text-[10px] font-bold text-text-secondary">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      Orders are normalized automatically
                    </li>
                  </ul>
                </div>
                <pre className="max-h-[140px] overflow-auto rounded-xl border border-border bg-surface-white/80 p-3 font-mono text-[9px] leading-normal text-text-primary CustomScrollbar shadow-inner">
                  {`{
  "title": "Checklist Title",
  "paragraphs": [
    { "text": "Basic info" }
  ],
  "sections": [
    {
      "title": "Section 1",
      "items": [
        { "text": "Criteria 1" }
      ]
    }
  ]
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Textarea Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
              JSON Content
            </label>
            <div className="flex items-center gap-4">
              {allowImportCriterias && screeningProcessId && (
                <button
                  type="button"
                  onClick={handleImportFromProtocol}
                  disabled={isImportingFromProtocol}
                  className="flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 motion-reduce:transition-none"
                >
                  {isImportingFromProtocol ? (
                    <Loader2 aria-hidden="true" className="w-3.5 h-3.5 motion-safe:animate-spin motion-reduce:animate-none" />
                  ) : (
                    <Code2 className="w-3.5 h-3.5" />
                  )}
                  Import criterias
                </button>
              )}

              <label className="flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none">
                <Upload className="w-3.5 h-3.5" />
                Upload .json
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <Textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setValidationError(null);
            }}
            placeholder='e.g. { "title": "Checklist Name", "sections": [...] }'
            className="h-[350px] bg-bg-secondary/50 font-mono text-[11px] leading-relaxed CustomScrollbar"
            error={!!validationError}
          />
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="flex items-start gap-3 p-4 bg-surface-white rounded-xl border border-error/20 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-reduce:animate-none">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-error tracking-tight">
                Validation Failed
              </p>
              <p className="text-xs font-medium text-error/80 leading-relaxed">
                {validationError}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportDialog;
