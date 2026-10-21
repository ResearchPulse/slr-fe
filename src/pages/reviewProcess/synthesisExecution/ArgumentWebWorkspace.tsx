import { useEffect, useMemo, useState } from "react";
import { Check, GitBranch, Network, Plus, Save, Send, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import QueryErrorState from "../../../components/ui/QueryErrorState";
import synthesisArgumentService from "../../../services/synthesisArgumentService";
import type {
  ArgumentEdge,
  ArgumentGraphStatus,
  ArgumentLinkType,
  ArgumentNode,
  ArgumentNodeType,
  ArgumentWeb,
  ArgumentGraphSummary,
  UpsertArgumentGraphRequest,
} from "../../../types/synthesisArgument";

interface Props {
  processId: string;
  isLeader: boolean;
  isReadOnly: boolean;
}

const nodeTypes: ArgumentNodeType[] = ["I", "RA", "CA", "PA", "MA"];
const linkTypes: ArgumentLinkType[] = ["RA", "CA", "PA", "MA"];
const emptyWeb: ArgumentWeb = { totalGraphs: 0, approvedGraphs: 0, totalNodes: 0, totalEdges: 0, totalLinks: 0, nodes: [], graphEdges: [], links: [] };

const statusClass: Record<ArgumentGraphStatus | "NOT_STARTED", string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  SUBMITTED: "bg-blue-50 text-blue-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  NOT_STARTED: "bg-bg-secondary text-text-secondary",
};

const toNumberOrNull = (value: string): number | null => {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export default function ArgumentWebWorkspace({ processId, isLeader, isReadOnly }: Props) {
  const [summaries, setSummaries] = useState<ArgumentGraphSummary[]>([]);
  const [web, setWeb] = useState<ArgumentWeb>(emptyWeb);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [nodes, setNodes] = useState<ArgumentNode[]>([]);
  const [edges, setEdges] = useState<ArgumentEdge[]>([]);
  const [version, setVersion] = useState(0);
  const [graphStatus, setGraphStatus] = useState<ArgumentGraphStatus | "NOT_STARTED">("NOT_STARTED");
  const [isLoading, setIsLoading] = useState(true);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodeType, setNodeType] = useState<ArgumentNodeType>("I");
  const [nodeText, setNodeText] = useState("");
  const [exactQuote, setExactQuote] = useState("");
  const [sourceAssetId, setSourceAssetId] = useState("");
  const [sourceRevision, setSourceRevision] = useState("");
  const [sourceHash, setSourceHash] = useState("");
  const [pdfPage, setPdfPage] = useState("");
  const [section, setSection] = useState("");
  const [paragraph, setParagraph] = useState("");
  const [pdfHighlightCoordinates, setPdfHighlightCoordinates] = useState("");
  const [fromNodeId, setFromNodeId] = useState("");
  const [toNodeId, setToNodeId] = useState("");
  const [fromWebNodeId, setFromWebNodeId] = useState("");
  const [toWebNodeId, setToWebNodeId] = useState("");
  const [linkRelation, setLinkRelation] = useState<ArgumentLinkType>("RA");
  const [linkNote, setLinkNote] = useState("");

  const selectedSummary = summaries.find((summary) => summary.paperId === selectedPaperId);
  const graphReadOnly = isReadOnly || !isLeader || graphStatus === "APPROVED";
  const webNodes = useMemo(() => web.nodes, [web.nodes]);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextSummaries, nextWeb] = await Promise.all([
        synthesisArgumentService.listGraphs(processId),
        synthesisArgumentService.getWeb(processId),
      ]);
      setSummaries(nextSummaries);
      setWeb(nextWeb);
      setSelectedPaperId((current) => current || nextSummaries[0]?.paperId || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Argument Web.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, [processId]);

  useEffect(() => {
    if (!selectedPaperId) return;
    let active = true;
    setIsGraphLoading(true);
    void synthesisArgumentService.getGraph(processId, selectedPaperId)
      .then((graph) => {
        if (!active) return;
        setNodes(graph?.nodes ?? []);
        setEdges(graph?.edges ?? []);
        setVersion(graph?.version ?? 0);
        setGraphStatus(graph?.status ?? "NOT_STARTED");
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load the graph."); })
      .finally(() => { if (active) setIsGraphLoading(false); });
    return () => { active = false; };
  }, [processId, selectedPaperId]);

  const refresh = async () => {
    const [nextSummaries, nextWeb] = await Promise.all([
      synthesisArgumentService.listGraphs(processId),
      synthesisArgumentService.getWeb(processId),
    ]);
    setSummaries(nextSummaries);
    setWeb(nextWeb);
  };

  const run = async (action: () => Promise<void>) => {
    setIsBusy(true);
    setError(null);
    try { await action(); await refresh(); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Argument Web action failed."); }
    finally { setIsBusy(false); }
  };

  const addNode = () => {
    if (!nodeText.trim()) return setError("Node text is required.");
    if (nodeType === "I" && !exactQuote.trim()) return setError("Information nodes require an exact source quote.");
    const hasSource = Boolean(exactQuote.trim() || sourceAssetId.trim() || sourceRevision.trim() || sourceHash.trim() || pdfPage.trim() || section.trim() || paragraph.trim() || pdfHighlightCoordinates.trim());
    const source: ArgumentNode["source"] = hasSource ? {
      exactQuote: exactQuote.trim(), sourceAssetId: sourceAssetId.trim() || null, sourceRevision: sourceRevision.trim() || null,
      sourceHash: sourceHash.trim() || null, startOffset: null, endOffset: null, pdfPage: toNumberOrNull(pdfPage),
      section: section.trim() || null, paragraph: paragraph.trim() || null, pdfHighlightCoordinates: pdfHighlightCoordinates.trim() || null, quoteHash: "",
    } : null;
    setNodes((current) => [...current, { id: `${nodeType.toLowerCase()}-${current.length + 1}`, type: nodeType, text: nodeText.trim(), normalizedClaimId: null, source }]);
    setNodeText(""); setExactQuote(""); setSourceAssetId(""); setSourceRevision(""); setSourceHash(""); setPdfPage(""); setSection(""); setParagraph(""); setPdfHighlightCoordinates(""); setError(null);
  };

  const addEdge = () => {
    if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) return setError("Choose two different nodes for the relation.");
    if (edges.some((edge) => edge.fromNodeId === fromNodeId && edge.toNodeId === toNodeId)) return setError("This relation already exists.");
    setEdges((current) => [...current, { id: `edge-${current.length + 1}`, fromNodeId, toNodeId }]);
    setFromNodeId(""); setToNodeId(""); setError(null);
  };

  const save = () => {
    if (!selectedPaperId) return;
    const request: UpsertArgumentGraphRequest = { expectedVersion: version, nodes: nodes.map(({ id, type, text, normalizedClaimId, source }) => ({ id, type, text, normalizedClaimId, source: source ? { ...source, quoteHash: undefined } : null })), edges };
    void run(async () => { const graph = await synthesisArgumentService.upsertGraph(processId, selectedPaperId, request); setVersion(graph.version); setGraphStatus(graph.status); });
  };

  const submit = () => { if (!selectedPaperId) return; void run(async () => { const graph = await synthesisArgumentService.submitGraph(processId, selectedPaperId); setGraphStatus(graph.status); }); };
  const approve = () => { if (!selectedPaperId) return; void run(async () => { const graph = await synthesisArgumentService.approveGraph(processId, selectedPaperId); setGraphStatus(graph.status); }); };

  const createLink = () => {
    const from = webNodes.find((node) => node.webNodeId === fromWebNodeId);
    const to = webNodes.find((node) => node.webNodeId === toWebNodeId);
    if (!from || !to) return setError("Choose a source and target node from approved graphs.");
    void run(async () => {
      await synthesisArgumentService.createLink(processId, { fromPaperId: from.paperId, fromNodeId: from.id, toPaperId: to.paperId, toNodeId: to.id, relation: linkRelation, note: linkNote.trim() || null });
      setLinkNote("");
    });
  };

  if (isLoading) return <div className="flex min-h-[30vh] items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error && summaries.length === 0) return <QueryErrorState title="Argument Web unavailable" message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex items-center gap-2 text-primary"><Network className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.2em]">AIF · Phase 4 Synthesis</span></div><h2 className="mt-2 text-xl font-semibold text-text-primary">Argument Web</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary">Create one evidence-bound graph per included paper, then connect approved claims across papers.</p></div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">{[["Graphs", web.totalGraphs], ["Approved", web.approvedGraphs], ["Nodes", web.totalNodes], ["Links", web.totalLinks]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-bg-primary px-3 py-2"><div className="font-semibold text-text-primary">{value}</div><div className="mt-0.5 text-text-muted">{label}</div></div>)}</div>
        </div>
        {error ? <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">{error}</p> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border bg-surface-white p-4"><h3 className="text-sm font-semibold text-text-primary">Included papers</h3><div className="mt-3 space-y-2">{summaries.map((summary) => <button key={summary.paperId} type="button" onClick={() => setSelectedPaperId(summary.paperId)} className={`w-full rounded-xl border p-3 text-left ${selectedPaperId === summary.paperId ? "border-primary bg-primary-light" : "border-border hover:bg-bg-primary"}`}><div className="line-clamp-2 text-sm font-medium text-text-primary">{summary.paperTitle}</div><div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className={`rounded-full px-2 py-0.5 font-medium ${statusClass[summary.status]}`}>{summary.status}</span><span className="text-text-muted">{summary.nodeCount} nodes</span></div></button>)}</div></div>

        <div className="rounded-2xl border border-border bg-surface-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-primary"><GitBranch className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Paper graph</span></div><h3 className="mt-1 text-lg font-semibold text-text-primary">{selectedSummary?.paperTitle || "Select a paper"}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[graphStatus]}`}>{graphStatus}</span></div>
          {isGraphLoading ? <div className="flex min-h-32 items-center justify-center"><LoadingSpinner /></div> : <>
            <div className="mt-5 overflow-x-auto rounded-xl border border-border"><table className="min-w-full text-left text-sm"><thead className="bg-bg-primary text-xs uppercase tracking-wide text-text-secondary"><tr><th className="px-3 py-2">Type</th><th className="px-3 py-2">Node</th><th className="px-3 py-2">Evidence quote</th><th className="px-3 py-2">Action</th></tr></thead><tbody className="divide-y divide-border">{nodes.map((node) => <tr key={node.id}><td className="px-3 py-2 font-semibold text-primary">{node.type}</td><td className="px-3 py-2"><div className="font-medium text-text-primary">{node.text}</div><div className="text-xs text-text-muted">{node.id}</div></td><td className="max-w-sm px-3 py-2 text-xs text-text-secondary">{node.source?.exactQuote || "—"}{node.source?.pdfPage ? ` · p.${node.source.pdfPage}` : ""}</td><td className="px-3 py-2">{graphReadOnly ? "—" : <button type="button" onClick={() => { setNodes((current) => current.filter((item) => item.id !== node.id)); setEdges((current) => current.filter((edge) => edge.fromNodeId !== node.id && edge.toNodeId !== node.id)); }} className="rounded-lg p-2 text-error hover:bg-error/10" aria-label={`Remove ${node.id}`}><Trash2 className="h-4 w-4" /></button>}</td></tr>)}{nodes.length === 0 ? <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-text-secondary">No nodes yet. Add an I-node with an exact quote to begin.</td></tr> : null}</tbody></table></div>

            {!graphReadOnly ? <div className="mt-5 rounded-xl border border-dashed border-border p-4"><h4 className="text-sm font-semibold text-text-primary">Add AIF node</h4><div className="mt-3 grid gap-3 md:grid-cols-3"><select value={nodeType} onChange={(event) => setNodeType(event.target.value as ArgumentNodeType)} className="rounded-lg border border-border bg-surface-white px-3 py-2 text-sm"><option value="I">I · information/evidence</option>{nodeTypes.slice(1).map((type) => <option key={type} value={type}>{type} · relation/claim</option>)}</select><input value={nodeText} onChange={(event) => setNodeText(event.target.value)} placeholder="Claim or argument text" className="rounded-lg border border-border px-3 py-2 text-sm md:col-span-2" /></div><div className="mt-3 grid gap-3 md:grid-cols-2"><textarea value={exactQuote} onChange={(event) => setExactQuote(event.target.value)} placeholder="Exact quote (required for I)" className="min-h-20 rounded-lg border border-border px-3 py-2 text-sm" /><div className="grid gap-3 sm:grid-cols-2"><input value={sourceAssetId} onChange={(event) => setSourceAssetId(event.target.value)} placeholder="Source asset ID" className="rounded-lg border border-border px-3 py-2 text-sm" /><input value={sourceRevision} onChange={(event) => setSourceRevision(event.target.value)} placeholder="Source revision" className="rounded-lg border border-border px-3 py-2 text-sm" /><input value={sourceHash} onChange={(event) => setSourceHash(event.target.value)} placeholder="Source hash" className="rounded-lg border border-border px-3 py-2 text-sm" /><input value={pdfPage} onChange={(event) => setPdfPage(event.target.value)} placeholder="PDF page" className="rounded-lg border border-border px-3 py-2 text-sm" /><input value={section} onChange={(event) => setSection(event.target.value)} placeholder="Section" className="rounded-lg border border-border px-3 py-2 text-sm" /><input value={paragraph} onChange={(event) => setParagraph(event.target.value)} placeholder="Paragraph" className="rounded-lg border border-border px-3 py-2 text-sm" /></div></div><input value={pdfHighlightCoordinates} onChange={(event) => setPdfHighlightCoordinates(event.target.value)} placeholder="pdfHighlightCoordinates (PDF UI compatibility)" className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm" /><Button className="mt-3" size="sm" onClick={addNode}><Plus className="h-4 w-4" />Add node</Button></div> : null}
            {!graphReadOnly && nodes.length > 1 ? <div className="mt-4 rounded-xl border border-dashed border-border p-4"><h4 className="text-sm font-semibold text-text-primary">Add relation</h4><div className="mt-3 flex flex-wrap items-center gap-3"><select value={fromNodeId} onChange={(event) => setFromNodeId(event.target.value)} className="min-w-40 rounded-lg border border-border bg-surface-white px-3 py-2 text-sm"><option value="">From node</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.id}</option>)}</select><span className="text-text-muted">→</span><select value={toNodeId} onChange={(event) => setToNodeId(event.target.value)} className="min-w-40 rounded-lg border border-border bg-surface-white px-3 py-2 text-sm"><option value="">To node</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.id}</option>)}</select><Button size="sm" variant="outline" onClick={addEdge}><Plus className="h-4 w-4" />Add relation</Button></div><div className="mt-3 text-xs text-text-secondary">{edges.length} in-paper relation(s): {edges.map((edge) => `${edge.fromNodeId} → ${edge.toNodeId}`).join(", ") || "none"}</div></div> : null}
            {isLeader && !isReadOnly ? <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" onClick={save} isLoading={isBusy}><Save className="h-4 w-4" />Save draft</Button><Button variant="secondary" onClick={submit} disabled={graphStatus !== "DRAFT" || nodes.length === 0} isLoading={isBusy}><Send className="h-4 w-4" />Submit graph</Button><Button variant="success" onClick={approve} disabled={graphStatus !== "SUBMITTED"} isLoading={isBusy}><Check className="h-4 w-4" />Approve graph</Button></div> : null}
          </>}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-primary"><Network className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Cross-paper synthesis</span></div><h3 className="mt-1 text-lg font-semibold text-text-primary">Approved Argument Web</h3></div><span className="text-xs text-text-secondary">{web.totalNodes} nodes · {web.totalLinks} links</span></div><div className="mt-4 overflow-x-auto rounded-xl border border-border"><table className="min-w-full text-left text-sm"><thead className="bg-bg-primary text-xs uppercase tracking-wide text-text-secondary"><tr><th className="px-3 py-2">Paper</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Claim / evidence</th><th className="px-3 py-2">Evidence</th></tr></thead><tbody className="divide-y divide-border">{web.nodes.map((node) => <tr key={node.webNodeId}><td className="max-w-xs px-3 py-2 text-xs text-text-secondary">{node.paperTitle}</td><td className="px-3 py-2 font-semibold text-primary">{node.type}</td><td className="px-3 py-2 text-text-primary">{node.text}</td><td className="max-w-sm px-3 py-2 text-xs text-text-secondary">{node.source?.exactQuote || "—"}</td></tr>)}{web.nodes.length === 0 ? <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-text-secondary">Approved graphs will appear here.</td></tr> : null}</tbody></table></div>{isLeader && !isReadOnly && webNodes.length > 1 ? <div className="mt-5 rounded-xl border border-dashed border-border p-4"><h4 className="text-sm font-semibold text-text-primary">Link two approved papers</h4><div className="mt-3 grid gap-3 md:grid-cols-2"><select value={fromWebNodeId} onChange={(event) => setFromWebNodeId(event.target.value)} className="rounded-lg border border-border bg-surface-white px-3 py-2 text-sm"><option value="">Source node</option>{webNodes.map((node) => <option key={node.webNodeId} value={node.webNodeId}>{node.paperTitle} · {node.id}</option>)}</select><select value={toWebNodeId} onChange={(event) => setToWebNodeId(event.target.value)} className="rounded-lg border border-border bg-surface-white px-3 py-2 text-sm"><option value="">Target node</option>{webNodes.map((node) => <option key={node.webNodeId} value={node.webNodeId}>{node.paperTitle} · {node.id}</option>)}</select><select value={linkRelation} onChange={(event) => setLinkRelation(event.target.value as ArgumentLinkType)} className="rounded-lg border border-border bg-surface-white px-3 py-2 text-sm">{linkTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><input value={linkNote} onChange={(event) => setLinkNote(event.target.value)} placeholder="Reason / note (optional)" className="rounded-lg border border-border px-3 py-2 text-sm" /></div><Button className="mt-3" size="sm" onClick={createLink} isLoading={isBusy}><Plus className="h-4 w-4" />Create web link</Button></div> : null}<div className="mt-4 space-y-2">{web.links.map((link) => <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bg-primary px-3 py-2 text-sm"><span><strong className="text-primary">{link.relation}</strong> <span className="text-text-secondary">{link.fromPaperId}/{link.fromNodeId} → {link.toPaperId}/{link.toNodeId}</span>{link.note ? <span className="ml-2 text-xs text-text-muted">{link.note}</span> : null}</span>{isLeader && !isReadOnly ? <button type="button" onClick={() => void run(() => synthesisArgumentService.deleteLink(processId, link.id))} className="rounded-lg p-2 text-error hover:bg-error/10" aria-label="Delete Argument Web link"><Trash2 className="h-4 w-4" /></button> : null}</div>)}</div></section>
    </div>
  );
}
