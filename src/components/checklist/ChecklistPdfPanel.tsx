import { useCallback, useEffect } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import {
  highlightPlugin,
  Trigger,
  type RenderHighlightsProps,
  type HighlightArea,
} from "@react-pdf-viewer/highlight";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import { FiX, FiFileText } from "react-icons/fi";
interface ChecklistPdfPanelProps {
  pdfUrl: string;
  activeCoordinate: HighlightArea | null;
  onClose: () => void;
}

/**
 * PDF viewer panel for the Checklist Editor.
 * Displays the source PDF and highlights the coordinate linked to the active checklist item.
 * Modeled after the data extraction ReviewerPdfPanel.
 */
export default function ChecklistPdfPanel({
  pdfUrl,
  activeCoordinate,
  onClose,
}: ChecklistPdfPanelProps) {
  const renderHighlights = useCallback(
    (renderProps: RenderHighlightsProps) => {
      const { pageIndex, getCssProperties, rotation } = renderProps;

      return (
        <div>
          {activeCoordinate && activeCoordinate.pageIndex === pageIndex && (
            <div
              className="pointer-events-none absolute bg-yellow-300/60 mix-blend-multiply"
              style={getCssProperties(activeCoordinate, rotation)}
            />
          )}
        </div>
      );
    },
    [activeCoordinate],
  );

  const highlightPluginInstance = highlightPlugin({
    trigger: Trigger.None,
    renderHighlights,
  });

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  // Jump to the page when coordinate changes
  useEffect(() => {
    if (activeCoordinate) {
      jumpToPage(activeCoordinate.pageIndex);
    }
  }, [activeCoordinate, jumpToPage]);

  return (
    <section className="flex h-full flex-col overflow-hidden border-l border-border bg-surface-white">
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-bg-secondary px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FiFileText className="w-4 h-4 text-accent shrink-0" />
          <p className="text-xs font-medium text-text-secondary truncate">
            Source PDF
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-[4px] text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
          title="Close PDF panel"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {activeCoordinate && (
        <div className="shrink-0 border-b border-indigo-100 bg-bg-secondary/80 px-4 py-1.5">
          <p className="text-xs text-indigo-700 font-medium">
            Page {activeCoordinate.pageIndex + 1}
          </p>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="h-full min-h-0 flex-1 overflow-hidden relative">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <Viewer
            fileUrl={pdfUrl}
            plugins={[highlightPluginInstance, pageNavigationPluginInstance]}
          />
        </Worker>
      </div>
    </section>
  );
}
