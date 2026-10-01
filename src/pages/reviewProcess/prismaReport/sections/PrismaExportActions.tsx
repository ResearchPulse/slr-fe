// PRISMA Export Actions — Export PNG, PDF, and copy data buttons (stubbed logic)

import toast from "react-hot-toast";
import {
  FiImage,
  FiFileText,
  FiCopy,
  FiRefreshCw,
  FiClock,
} from "react-icons/fi";
import type { PrismaNodeResponse } from "../../../../types/prismaReport";
import { PRISMA_STAGE_LABELS } from "../../../../types/prismaReport";

interface PrismaExportActionsProps {
  /** Whether a report exists to export */
  hasReport: boolean;
  /** Whether report generation is in progress */
  isGenerating: boolean;
  /** Whether report download is in progress */
  isDownloading?: boolean;
  /** Trigger report generation */
  onGenerate: () => void;
  /** Trigger PRISMA diagram download (.docx) */
  onDownloadDiagram?: () => void;
  /** Version label of the latest report */
  version?: string;
  /** Timestamp of last generation */
  generatedAt?: string | null;
  /** Callback to export the diagram as PNG */
  onExportPNG?: () => void;
  /** Remaining cooldown seconds before user can regenerate again */
  cooldown?: number;
  /** Nodes for text copy */
  nodes?: PrismaNodeResponse[];
  /** Included node for text copy */
  includedNode?: PrismaNodeResponse | null;
}

export default function PrismaExportActions({
  hasReport,
  isGenerating,
  isDownloading,
  cooldown = 0,
  onGenerate,
  onDownloadDiagram,
  onExportPNG,
  nodes,
  includedNode,
  version,
  generatedAt,
}: PrismaExportActionsProps) {
  const handleExportPNG = () => {
    if (onExportPNG) {
      onExportPNG();
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleCopyNumbers = () => {
    if (!nodes && !includedNode) return;

    let text = "PRISMA 2020 Flow Diagram Data\n";
    text += "=============================\n\n";

    const formatNode = (node: PrismaNodeResponse, indent = "") => {
      let line = `${indent}- ${PRISMA_STAGE_LABELS[node.stage] || node.stage}: n=${node.total.toLocaleString()}\n`;
      if (node.breakdown && node.breakdown.length > 0) {
        node.breakdown.forEach((b) => {
          line += `${indent}    * ${b.label}: n=${b.count.toLocaleString()}\n`;
        });
      }
      if (node.reasons && node.reasons.length > 0) {
        line += `${indent}    [Reasons for exclusion]\n`;
        node.reasons.forEach((r) => {
          line += `${indent}    * ${r.label}: n=${r.count.toLocaleString()}\n`;
        });
      }
      if (node.sideBox) {
        line += `${indent}    > Side Box: ${PRISMA_STAGE_LABELS[node.sideBox.stage] || node.sideBox.stage}: n=${node.sideBox.total.toLocaleString()}\n`;
        if (node.sideBox.breakdown && node.sideBox.breakdown.length > 0) {
          node.sideBox.breakdown.forEach((b) => {
            line += `${indent}        * ${b.label}: n=${b.count.toLocaleString()}\n`;
          });
        }
      }
      return line;
    };

    text += "Identification\n";
    nodes
      ?.filter((n) =>
        ["RecordsIdentified", "DuplicateRecordsRemoved"].includes(n.stage),
      )
      .forEach((n) => (text += formatNode(n, "  ")));

    text += "\nScreening & Eligibility\n";
    nodes
      ?.filter(
        (n) =>
          !["RecordsIdentified", "DuplicateRecordsRemoved"].includes(n.stage),
      )
      .forEach((n) => (text += formatNode(n, "  ")));

    if (includedNode) {
      text += "\nStudies Included\n";
      text += formatNode(includedNode, "  ");
    }

    navigator.clipboard.writeText(text);
    toast.success("Numbers copied to clipboard");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Generate / Regenerate button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || cooldown > 0}
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-[4px] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FiRefreshCw
          className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`}
        />
        {isGenerating
          ? "Generating…"
          : cooldown > 0
            ? `Wait ${cooldown}s`
            : hasReport
              ? "Regenerate Diagram"
              : "Generate Diagram"}
      </button>

      {/* Export buttons — only enabled when a report exists */}
      <div className="flex items-center gap-2 border-l border-border pl-3">
        <button
          onClick={handleExportPNG}
          disabled={!hasReport}
          title="Export as PNG"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-text-primary bg-surface-white border border-border rounded-[4px] hover:bg-bg-primary focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FiImage className="w-4 h-4" />
          <span className="hidden sm:inline">PNG</span>
        </button>

        <button
          onClick={handleExportPDF}
          disabled={!hasReport}
          title="Export as PDF (print)"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-text-primary bg-surface-white border border-border rounded-[4px] hover:bg-bg-primary focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FiFileText className="w-4 h-4" />
          <span className="hidden sm:inline">PDF</span>
        </button>

        <button
          onClick={onDownloadDiagram}
          disabled={!hasReport || isDownloading}
          title="Download PRISMA Flow Diagram (.docx)"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-[4px] hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium shadow-none"
        >
          <FiFileText
            className={`w-4 h-4 ${isDownloading ? "animate-pulse" : ""}`}
          />
          <span className="hidden sm:inline">
            {isDownloading ? "Downloading…" : "Word"}
          </span>
        </button>

        <button
          onClick={handleCopyNumbers}
          disabled={!hasReport}
          title="Copy numbers to clipboard"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-text-primary bg-surface-white border border-border rounded-[4px] hover:bg-bg-primary focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FiCopy className="w-4 h-4" />
          <span className="hidden sm:inline">Copy</span>
        </button>
      </div>

      {/* Version / timestamp badge */}
      {hasReport && version && (
        <div className="flex items-center gap-1.5 text-xs text-text-secondary ml-auto">
          <FiClock className="w-3.5 h-3.5" />
          <span>v{version}</span>
          {generatedAt && (
            <>
              <span className="text-gray-300">·</span>
              <span>
                {new Date(generatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
