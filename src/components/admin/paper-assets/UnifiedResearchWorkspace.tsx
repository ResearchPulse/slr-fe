import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { FiBookOpen, FiChevronDown, FiGitBranch, FiMaximize2, FiMinimize2, FiX } from "react-icons/fi";

export type ResearchWorkspaceMode = "graph" | "pdf" | "split";

interface UnifiedResearchWorkspaceProps {
  mode: ResearchWorkspaceMode;
  onModeChange: (mode: ResearchWorkspaceMode) => void;
  paperTitle: string;
  argumentCount: number;
  analysisStatus?: string;
  sourceLabel?: string;
  hasPdf: boolean;
  toolbar?: ReactNode;
  graph: ReactNode;
  pdf?: ReactNode;
  inspector?: ReactNode;
  outline?: ReactNode;
  inspectorOpen: boolean;
  onInspectorOpenChange: (open: boolean) => void;
  outlineOpen: boolean;
  onOutlineOpenChange: (open: boolean) => void;
  splitRatio: number;
  onSplitRatioChange: (ratio: number) => void;
}

const MIN_SPLIT_RATIO = 45;
const MAX_SPLIT_RATIO = 80;
const MIN_INSPECTOR_WIDTH = 260;
const MAX_INSPECTOR_WIDTH = 460;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function useWideWorkspace() {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1180px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1180px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return wide;
}

export default function UnifiedResearchWorkspace({
  mode,
  onModeChange,
  paperTitle,
  argumentCount,
  analysisStatus,
  sourceLabel,
  hasPdf,
  toolbar,
  graph,
  pdf,
  inspector,
  outline,
  inspectorOpen,
  onInspectorOpenChange,
  outlineOpen,
  onOutlineOpenChange,
  splitRatio,
  onSplitRatioChange,
}: UnifiedResearchWorkspaceProps) {
  const wide = useWideWorkspace();
  const stageRef = useRef<HTMLDivElement>(null);
  const [inspectorWidth, setInspectorWidth] = useState(320);
  const [compactSplitPane, setCompactSplitPane] = useState<"pdf" | "graph">("pdf");
  const [dragging, setDragging] = useState<"split" | "inspector" | null>(null);
  const showGraph = mode === "graph" || mode === "split" && (wide || compactSplitPane === "graph");
  const showPdf = mode === "pdf" || mode === "split" && (wide || compactSplitPane === "pdf");
  const showGraphInspector = mode === "graph" && inspectorOpen && wide;
  const showOutline = mode === "pdf" && outlineOpen;
  const showSplitDivider = mode === "split" && wide;

  const updateSplitFromPointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds?.width) return;
    const percent = ((event.clientX - bounds.left) / bounds.width) * 100;
    onSplitRatioChange(clamp(percent, MIN_SPLIT_RATIO, MAX_SPLIT_RATIO));
  }, [onSplitRatioChange]);

  const startResize = (kind: "split" | "inspector") => (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(kind);
  };

  const resizeInspector = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const startX = Number(event.currentTarget.dataset.startX || event.clientX);
    const startWidth = Number(event.currentTarget.dataset.startWidth || inspectorWidth);
    setInspectorWidth(clamp(startWidth + startX - event.clientX, MIN_INSPECTOR_WIDTH, MAX_INSPECTOR_WIDTH));
  }, [inspectorWidth]);

  const handleSeparatorKeyDown = (event: KeyboardEvent<HTMLDivElement>, kind: "split" | "inspector") => {
    const step = event.shiftKey ? 10 : 4;
    if (kind === "split") {
      if (event.key === "ArrowLeft") onSplitRatioChange(clamp(splitRatio - step, MIN_SPLIT_RATIO, MAX_SPLIT_RATIO));
      else if (event.key === "ArrowRight") onSplitRatioChange(clamp(splitRatio + step, MIN_SPLIT_RATIO, MAX_SPLIT_RATIO));
      else if (event.key === "Home") onSplitRatioChange(MAX_SPLIT_RATIO);
      else if (event.key === "End") onSplitRatioChange(MIN_SPLIT_RATIO);
      else return;
    } else {
      if (event.key === "ArrowLeft") setInspectorWidth((width) => clamp(width + step, MIN_INSPECTOR_WIDTH, MAX_INSPECTOR_WIDTH));
      else if (event.key === "ArrowRight") setInspectorWidth((width) => clamp(width - step, MIN_INSPECTOR_WIDTH, MAX_INSPECTOR_WIDTH));
      else if (event.key === "Home") setInspectorWidth(MAX_INSPECTOR_WIDTH);
      else if (event.key === "End") setInspectorWidth(MIN_INSPECTOR_WIDTH);
      else return;
    }
    event.preventDefault();
  };

  const graphColumn = mode === "split" && wide ? "3" : "1";
  const pdfColumn = mode === "split" && wide ? "1" : "1";
  let columns = "minmax(0, 1fr)";
  if (mode === "graph" && showGraphInspector) columns = `minmax(0, 1fr) 7px ${inspectorWidth}px`;
  if (mode === "pdf" && showOutline && wide) columns = "minmax(0, 1fr) 300px";
  if (mode === "split" && wide) columns = `minmax(0, ${splitRatio}fr) 8px minmax(0, ${100 - splitRatio}fr)`;

  const hiddenPanelClass = "pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-150 motion-reduce:transition-none";
  const panelClass = "relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden bg-white opacity-100 transition-opacity duration-150 motion-reduce:transition-none";
  const statusClass = analysisStatus === "COMPLETED"
    ? "bg-success/10 text-success"
    : analysisStatus === "FAILED"
      ? "bg-error/10 text-error"
      : "bg-bg-secondary text-text-secondary";

  return <section className="research-workspace overflow-hidden rounded-xl border border-border bg-surface-white" aria-label="Unified research workspace">
    <header className="flex min-h-[62px] items-center justify-between gap-4 border-b border-border px-4 py-2.5 sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-sm font-semibold text-text-primary">Argument analysis</h2>
          <span className="text-[11px] text-text-muted">{argumentCount} {argumentCount === 1 ? "argument" : "arguments"}</span>
          {analysisStatus && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>{analysisStatus}</span>}
        </div>
        <p className="mt-0.5 truncate text-xs text-text-secondary" title={paperTitle}>{paperTitle}</p>
      </div>
      {sourceLabel && <span className="hidden shrink-0 text-[10px] uppercase tracking-wide text-text-muted sm:block">{sourceLabel}</span>}
    </header>

    <div className="flex min-h-[54px] flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-bg-secondary/70 p-1" role="tablist" aria-label="Research workspace modes">
        <ModeButton active={mode === "graph"} onClick={() => onModeChange("graph")} icon={<FiGitBranch />} label="Graph" />
        <ModeButton active={mode === "pdf"} onClick={() => { if (hasPdf) onModeChange("pdf"); }} icon={<FiBookOpen />} label="Read PDF" disabled={!hasPdf} />
        <ModeButton active={mode === "split"} onClick={() => { if (hasPdf) onModeChange("split"); }} icon={<FiMaximize2 />} label="Compare" disabled={!hasPdf} className={!wide ? "hidden" : ""} />
      </div>
      {mode === "split" && !wide && <div className="flex shrink-0 items-center gap-1 rounded-lg bg-bg-secondary/70 p-1" role="tablist" aria-label="Current view">
        <ModeButton active={compactSplitPane === "pdf"} onClick={() => setCompactSplitPane("pdf")} icon={<FiBookOpen />} label="PDF" />
        <ModeButton active={compactSplitPane === "graph"} onClick={() => setCompactSplitPane("graph")} icon={<FiGitBranch />} label="Graph" />
      </div>}
      <div className="research-workspace-toolbar-scroll flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1.5 overflow-x-auto">{toolbar}</div>
    </div>

    <div ref={stageRef} className="research-workspace-stage relative grid min-w-0 overflow-hidden bg-[#f8fafb]" style={{ height: "min(76vh, 900px)", minHeight: 500, gridTemplateColumns: columns }}>
      <div className={showPdf ? panelClass : hiddenPanelClass} style={showPdf ? { gridColumn: pdfColumn, gridRow: 1, minWidth: 0 } : undefined} aria-hidden={!showPdf} inert={!showPdf}>
        {showPdf && <>
          {mode === "pdf" && !wide && <div className="flex min-h-10 items-center justify-between border-b border-border bg-white px-3">
            <button type="button" onClick={() => onOutlineOpenChange(!outlineOpen)} className="inline-flex items-center gap-2 py-2 text-xs font-medium text-text-secondary hover:text-primary"><FiChevronDown className={`transition-transform ${outlineOpen ? "rotate-180" : ""}`} />{outlineOpen ? "Hide argument list" : "Argument list"}</button>
          </div>}
          <div className="min-h-0 flex-1">{pdf}</div>
          {showOutline && !wide && <div className="absolute inset-y-0 right-0 z-20 w-[min(88vw,340px)] border-l border-border bg-white shadow-xl">
            <div className="flex h-full min-h-0 flex-col"><div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3"><span className="text-xs font-semibold text-text-primary">Arguments</span><button type="button" aria-label="Close argument list" onClick={() => onOutlineOpenChange(false)} className="rounded p-1.5 text-text-secondary hover:bg-bg-secondary"><FiX /></button></div><div className="min-h-0 flex-1 overflow-y-auto">{outline}</div></div>
          </div>}
        </>}
      </div>

      <div className={showGraph ? panelClass : hiddenPanelClass} style={showGraph ? { gridColumn: graphColumn, gridRow: 1, minWidth: 0 } : undefined} aria-hidden={!showGraph} inert={!showGraph}>
        {showGraph && <>
          <div className="min-h-0 flex-1">{graph}</div>
          {mode === "split" && inspectorOpen && inspector && <aside className="absolute inset-y-0 right-0 z-20 w-[min(360px,92%)] overflow-y-auto border-l border-border bg-white shadow-xl" aria-label="Node details">
            <InspectorHeader onClose={() => onInspectorOpenChange(false)} />{inspector}
          </aside>}
        </>}
      </div>

      {showGraphInspector && <>
        <div role="separator" aria-orientation="vertical" aria-label="Resize node inspector" aria-valuemin={MIN_INSPECTOR_WIDTH} aria-valuemax={MAX_INSPECTOR_WIDTH} aria-valuenow={inspectorWidth} tabIndex={0} className="research-workspace-resize-handle z-10" data-start-x="" data-start-width="" onPointerDown={(event) => { event.currentTarget.dataset.startX = String(event.clientX); event.currentTarget.dataset.startWidth = String(inspectorWidth); startResize("inspector")(event); }} onPointerMove={(event) => { if (dragging === "inspector") resizeInspector(event); }} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)} onKeyDown={(event) => handleSeparatorKeyDown(event, "inspector")} />
        <aside className="min-h-0 overflow-y-auto border-l border-border bg-white" style={{ gridColumn: 3, gridRow: 1 }} aria-label="Node details"><InspectorHeader onClose={() => onInspectorOpenChange(false)} />{inspector}</aside>
      </>}

      {showOutline && wide && <aside className="min-h-0 overflow-hidden border-l border-border bg-white" style={{ gridColumn: 2, gridRow: 1 }} aria-label="Argument list">
        <div className="flex h-full min-h-0 flex-col"><div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3"><span className="text-xs font-semibold text-text-primary">Arguments</span><button type="button" aria-label="Hide argument list" onClick={() => onOutlineOpenChange(false)} className="rounded p-1.5 text-text-secondary hover:bg-bg-secondary"><FiMinimize2 /></button></div><div className="min-h-0 flex-1 overflow-y-auto">{outline}</div></div>
      </aside>}

      {showSplitDivider && <div role="separator" aria-orientation="vertical" aria-label="Resize PDF and graph panels" aria-valuemin={MIN_SPLIT_RATIO} aria-valuemax={MAX_SPLIT_RATIO} aria-valuenow={Math.round(splitRatio)} tabIndex={0} className="research-workspace-resize-handle z-10" style={{ gridColumn: 2, gridRow: 1 }} onPointerDown={startResize("split")} onPointerMove={(event) => { if (dragging === "split") updateSplitFromPointer(event); }} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)} onKeyDown={(event) => handleSeparatorKeyDown(event, "split")} />}

      {mode === "graph" && inspectorOpen && !wide && inspector && <aside className="absolute inset-y-0 right-0 z-20 w-[min(88vw,360px)] overflow-y-auto border-l border-border bg-white shadow-xl" aria-label="Node details"><InspectorHeader onClose={() => onInspectorOpenChange(false)} />{inspector}</aside>}
    </div>
  </section>;
}

function ModeButton({ active, onClick, icon, label, disabled = false, className = "" }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; disabled?: boolean; className?: string }) {
  return <button type="button" role="tab" aria-selected={active} disabled={disabled} onClick={onClick} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${active ? "bg-white text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"} disabled:pointer-events-none disabled:opacity-40 ${className}`}>
    {icon}<span>{label}</span>
  </button>;
}

function InspectorHeader({ onClose }: { onClose: () => void }) {
  return <div className="flex h-11 items-center justify-between border-b border-border px-3"><span className="text-xs font-semibold text-text-primary">Node details</span><button type="button" aria-label="Close node details" onClick={onClose} className="rounded p-1.5 text-text-secondary hover:bg-bg-secondary"><FiX /></button></div>;
}
