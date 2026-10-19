import React, { useState } from "react";
import { EditorPanel } from "./EditorPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ExportDialog } from "./ExportDialog";
import { FileDown, Settings2, Trash2, LayoutDashboard } from "lucide-react";
import Button from "../Button";
import ConfirmModal from "../ConfirmModal";
import type { DocumentDraft } from "../../../types/documentEditor";

const emptyDraft: DocumentDraft = { title: "", paragraphs: [], sections: [] };

export const DocumentAuthoringEditor: React.FC = () => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [localDraft, setLocalDraft] = useState<DocumentDraft>(emptyDraft);

  const handleReset = () => {
    setLocalDraft(emptyDraft);
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Top Navigation / Header */}
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface-white/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-primary p-2">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-text-primary">
              Document Authoring
            </h1>
            <p className="text-xs font-medium text-text-secondary">
              Design your document structure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-text-secondary hover:bg-bg-secondary hover:text-error"
            onClick={() => setIsResetConfirmOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Clear Editor
          </Button>
          <div className="mx-1 h-6 w-px bg-border"></div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-border"
            onClick={() => setIsExportOpen(true)}
          >
            <Settings2 className="w-4 h-4" /> Export Options
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary shadow-sm hover:bg-primary-hover"
            onClick={() => setIsExportOpen(true)}
          >
            <FileDown className="w-4 h-4" /> Export JSON
          </Button>
        </div>
      </header>

      {/* Split Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Editor */}
        <div className="flex h-full w-full flex-col border-r border-border bg-bg-secondary/30 md:w-[45%] lg:w-[40%]">
          <div className="sticky top-0 z-10 border-b border-border bg-surface-white/50 p-4 backdrop-blur-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">
              Editor Workspace
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 transition-colors [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-text-secondary md:p-8 xl:p-10 motion-reduce:transition-none">
            <div className="max-w-2xl mx-auto">
              <EditorPanel
                localDraft={localDraft}
                setLocalDraft={setLocalDraft}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className="hidden h-full flex-1 bg-bg-secondary/50 md:block">
          <PreviewPanel localDraft={localDraft} />
        </div>
      </main>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Reset Confirmation */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="Clear Document Editor"
        message="Are you sure you want to clear your current work? This action cannot be undone."
      />
    </div>
  );
};
