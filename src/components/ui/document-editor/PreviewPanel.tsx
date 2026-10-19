import React, { useState } from "react";
import { PreviewDocument } from "./PreviewDocument";
import { Eye, Download, Upload } from "lucide-react";
import Button from "../Button";
import { ExportDialog } from "./ExportDialog";
import { ImportDialog } from "./ImportDialog";
import type { DocumentDraft } from "../../../types/documentEditor";

interface PreviewPanelProps {
  localDraft: DocumentDraft;
  onImport?: (data: any) => void;
  screeningProcessId?: string;
  allowImportCriterias?: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  localDraft,
  onImport,
  screeningProcessId,
  allowImportCriterias,
}) => {
  const draft = localDraft;
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-bg-secondary/30">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-white/90 p-3 backdrop-blur-sm sm:p-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Eye aria-hidden="true" className="w-4 h-4 text-text-secondary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Live Preview
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="text-xs font-semibold uppercase tracking-wider"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload aria-hidden="true" className="w-3.5 h-3.5" /> Import
          </Button>
          <Button
            variant="primary"
            className="text-xs font-semibold uppercase tracking-wider"
            onClick={() => setIsExportOpen(true)}
          >
            <Download aria-hidden="true" className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-bg-secondary/50 p-3 scrollbar-hide sm:p-6 lg:p-8">
        <PreviewDocument draft={draft} />
      </div>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
      <ImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={onImport}
        screeningProcessId={screeningProcessId}
        allowImportCriterias={allowImportCriterias}
      />
    </div>
  );
};
