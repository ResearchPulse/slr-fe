import CytoscapeComponent from "react-cytoscapejs";
import type { ElementDefinition, LayoutOptions, StylesheetJson } from "cytoscape";

type GraphData = {
  artifact_id?: string;
  nodes?: unknown[];
  edges?: unknown[];
};

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const text = (value: unknown) => typeof value === "string" ? value : "";

const stylesheet: StylesheetJson = [
  { selector: "node", style: { label: "data(label)", "font-size": 11, color: "#102338", "text-wrap": "wrap", "text-max-width": "170px", "text-valign": "center", "text-halign": "center", "background-color": "#dbeafe", "border-width": 1, "border-color": "#60a5fa", width: 180, height: 68, shape: "round-rectangle", padding: "8px" } },
  { selector: "node[type = 'S']", style: { "background-color": "#fef3c7", "border-color": "#f59e0b", shape: "diamond", width: 96, height: 76, "font-size": 10 } },
  { selector: "edge", style: { width: 2, "line-color": "#718096", "target-arrow-color": "#718096", "target-arrow-shape": "triangle", "curve-style": "bezier", label: "data(label)", "font-size": 9, color: "#4b5563", "text-background-color": "#ffffff", "text-background-opacity": 0.9, "text-background-padding": "2px" } },
];

const layout: LayoutOptions = { name: "breadthfirst", directed: true, padding: 24, spacingFactor: 1.25, direction: "rightward" };

export default function ArgumentGraph({ graph, title = "AIF Argument Graph" }: { graph: GraphData | null | undefined; title?: string }) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes.filter(isObject) : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges.filter(isObject) : [];
  if (!nodes.length) return <p className="rounded-lg border border-border bg-bg-secondary p-4 text-sm text-text-secondary">No AIF nodes were generated for this analysis.</p>;

  const elements: ElementDefinition[] = [
    ...nodes.map((node) => {
      const label = text(node.content) || text(node.label) || text(node.node_id);
      return { data: { id: text(node.node_id), label: label.length > 92 ? `${label.slice(0, 89)}…` : label, type: node.type === "S" ? "S" : "I" } };
    }),
    ...edges.map((edge) => ({ data: { id: text(edge.edge_id), source: text(edge.source), target: text(edge.target), label: text(edge.role).replaceAll("_", " ") } })),
  ];

  return <section className="overflow-hidden rounded-xl border border-border bg-surface-white" aria-label={title}>
    <div className="border-b border-border px-4 py-3"><h4 className="font-semibold text-text-primary">{title}</h4><p className="text-xs text-text-muted">{nodes.length} nodes · {edges.length} edges. Drag to explore; use the mouse wheel to zoom.</p></div>
    <CytoscapeComponent key={text(graph?.artifact_id) || `${nodes.length}-${edges.length}-${text(nodes[0]?.node_id)}`} elements={elements} stylesheet={stylesheet} layout={layout} style={{ width: "100%", height: Math.min(480, Math.max(280, nodes.length * 50)) }} minZoom={0.35} maxZoom={2.5} />
    <details className="border-t border-border p-4 text-sm">
      <summary className="cursor-pointer font-medium text-text-secondary">Accessible relationship list</summary>
      <ul className="mt-3 space-y-2">
        {edges.map((edge) => <li key={text(edge.edge_id)} className="rounded-lg bg-bg-secondary p-2 text-text-secondary"><code>{text(edge.source)}</code> → <span className="font-medium">{text(edge.role).replaceAll("_", " ")}</span> → <code>{text(edge.target)}</code></li>)}
      </ul>
    </details>
  </section>;
}
