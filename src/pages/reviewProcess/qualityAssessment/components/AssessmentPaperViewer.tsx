import { useState } from "react";
import QAPaperDetails from "./QAPaperDetails";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import type { WorkspaceQAPaper } from "../QualityAssessmentWorkspace";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { PDF_WORKER_URL } from "../../../../config/pdfWorker";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { highlightPlugin, Trigger } from "@react-pdf-viewer/highlight";
import type {
  HighlightArea,
  RenderHighlightTargetProps,
  RenderHighlightsProps,
} from "@react-pdf-viewer/highlight";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import type { HighlightData } from "../sections/QAPapersTabContent";

interface AssessmentPaperViewerProps {
  paper?: WorkspaceQAPaper;
  highlights?: any[];
  onAddHighlight?: (highlight: HighlightArea[]) => void;
  onRemoveHighlight?: (index: number) => void;
  isLeader?: boolean;
}

export default function AssessmentPaperViewer({
  paper,
  highlights = [],
  onAddHighlight,
  onRemoveHighlight,
  isLeader,
}: AssessmentPaperViewerProps) {
  const [highlightToRemove, setHighlightToRemove] = useState<number | null>(
    null,
  );
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const renderHighlights = (props: RenderHighlightsProps) => (
    <div>
      {highlights.map((highlightGroup: HighlightData, groupIndex: number) => {
        const areas = highlightGroup.areas || highlightGroup;
        const bgColor = highlightGroup.bgColor || "rgba(245, 158, 11, 0.4)";
        const reviewerInitials = highlightGroup.reviewerInitials || null;

        return areas
          .filter((area: HighlightArea) => area.pageIndex === props.pageIndex)
          .map((area: HighlightArea, areaIndex: number) => (
            <div
              key={`${groupIndex}-${areaIndex}`}
              className="group"
              style={{
                ...props.getCssProperties(area, props.rotation),
                background: bgColor,
                position: "absolute",
                cursor: isLeader ? "default" : "pointer",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => {
                if (!isLeader) {
                  setHighlightToRemove(groupIndex);
                }
              }}
              title={
                reviewerInitials === "YOU"
                  ? "Click to remove highlight"
                  : `Highlighted by ${reviewerInitials}`
              }
            >
              {reviewerInitials && (
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
                  style={{
                    position: "absolute",
                    right: "-10px",
                    top: "-10px",
                    background: bgColor.replace("0.4", "1"),
                    color: "white",
                    fontSize: "9px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    fontWeight: "bold",
                    zIndex: 2,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {reviewerInitials.substring(0, 3)}
                </div>
              )}
            </div>
          ));
      })}
    </div>
  );

  const renderHighlightTarget = (props: RenderHighlightTargetProps) => {
    if (isLeader) return <></>;
    return (
      <div
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "4px",
          color: "#fff",
          cursor: "pointer",
          padding: "4px 8px",
          position: "absolute",
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          transform: "translate(0, 8px)",
          zIndex: 10,
        }}
        onClick={() => {
          onAddHighlight?.(props.highlightAreas);
          props.cancel();
        }}
      >
        <span className="text-xs font-semibold">
          Highlight for selected criterion
        </span>
      </div>
    );
  };

  const highlightPluginInstance = highlightPlugin({
    renderHighlights,
    renderHighlightTarget,
    trigger: isLeader ? Trigger.None : Trigger.TextSelection,
  });

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-bg-primary/50">
      <ConfirmModal
        isOpen={highlightToRemove !== null}
        onClose={() => setHighlightToRemove(null)}
        onConfirm={() => {
          if (highlightToRemove !== null) {
            onRemoveHighlight?.(highlightToRemove);
          }
          setHighlightToRemove(null);
        }}
        title="Remove Highlight"
        message="Are you sure you want to remove this highlight?"
      />
      {paper ? (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 sm:p-6 xl:p-8">
          <div className="rounded-2xl border border-border bg-surface-white p-5 shadow-[0_1px_3px_rgba(18,35,49,0.04)] sm:p-7">
            <QAPaperDetails paper={paper} />
          </div>

          {paper.pdfUrl && (
            <div className="mt-1 flex h-[min(72vh,800px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-border bg-surface-white shadow-sm">
              <div className="flex-none border-b border-border bg-surface-white px-5 py-4 sm:px-6">
                <h3 className="text-sm font-semibold text-text-primary">
                  Full Text PDF
                </h3>
                {!isLeader && (
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    Select text to add highlight to the selected criterion.
                    Click a highlight to remove it.
                  </p>
                )}
              </div>
              <div className="relative w-full flex-1 overflow-hidden bg-bg-secondary">
                <Worker
                  workerUrl={PDF_WORKER_URL}
                >
                  <div className="absolute inset-0 font-sans">
                    <Viewer
                      fileUrl={paper.pdfUrl}
                      plugins={[
                        defaultLayoutPluginInstance,
                        highlightPluginInstance,
                      ]}
                    />
                  </div>
                </Worker>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full flex-1 items-center justify-center p-6 text-center text-text-secondary">
          <div className="max-w-sm rounded-2xl border border-border bg-surface-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-text-primary">Study details</p>
            <p className="mt-1 text-sm leading-6">Choose a study from the queue to inspect its abstract, metadata, and full text.</p>
          </div>
        </div>
      )}
    </div>
  );
}
