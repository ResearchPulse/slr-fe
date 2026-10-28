export interface GraphNode {
  id: string;
  label: string;
  /** Zero-based column; nodes of one column are stacked top to bottom in input order. */
  column: number;
  tone?: "primary" | "neutral" | "warning";
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 44;
const COLUMN_GAP = 120;
const ROW_GAP = 14;
const PADDING = 16;
const LABEL_MAX = 30;
/** Above this many edges the labels would overlap, so only the tooltips carry them. */
export const EDGE_LABEL_LIMIT = 10;

export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

export interface GraphLayout {
  width: number;
  height: number;
  nodes: PositionedNode[];
  /** Edges whose two ends both exist; the others are dropped rather than drawn to nowhere. */
  edges: Array<GraphEdge & { from: PositionedNode; to: PositionedNode }>;
}

/**
 * Keeps the middle column in input order and sorts the other columns by where their neighbours sit in it,
 * so that nodes feeding the same scheme end up next to each other and lines cross less.
 */
function orderNodes(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const columns = [...new Set(nodes.map((node) => node.column))].sort((a, b) => a - b);
  if (columns.length < 2) return nodes;
  const pivot = columns.includes(1) ? 1 : columns[0];
  const rowInPivot = new Map(nodes.filter((node) => node.column === pivot).map((node, row) => [node.id, row]));
  const neighbours = new Map<string, number[]>();
  for (const edge of edges) {
    const source = rowInPivot.get(edge.source);
    const target = rowInPivot.get(edge.target);
    if (target !== undefined) neighbours.set(edge.source, [...(neighbours.get(edge.source) ?? []), target]);
    if (source !== undefined) neighbours.set(edge.target, [...(neighbours.get(edge.target) ?? []), source]);
  }
  const barycentre = (node: GraphNode) => {
    const rows = neighbours.get(node.id);
    return rows?.length ? rows.reduce((sum, row) => sum + row, 0) / rows.length : Number.POSITIVE_INFINITY;
  };
  return columns.flatMap((column) => {
    const inColumn = nodes.filter((node) => node.column === column);
    // Array.prototype.sort is stable, so unconnected nodes keep their input order at the end.
    return column === pivot ? inColumn : [...inColumn].sort((a, b) => barycentre(a) - barycentre(b));
  });
}

export function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): GraphLayout {
  const rowOfColumn = new Map<number, number>();
  const positioned = orderNodes(nodes, edges).map((node) => {
    const row = rowOfColumn.get(node.column) ?? 0;
    rowOfColumn.set(node.column, row + 1);
    return {
      ...node,
      x: PADDING + node.column * (NODE_WIDTH + COLUMN_GAP),
      y: PADDING + row * (NODE_HEIGHT + ROW_GAP),
    };
  });
  const byId = new Map(positioned.map((node) => [node.id, node]));
  const linked = edges.flatMap((edge) => {
    const from = byId.get(edge.source);
    const to = byId.get(edge.target);
    return from && to ? [{ ...edge, from, to }] : [];
  });
  const columns = positioned.length ? Math.max(...positioned.map((node) => node.column)) + 1 : 1;
  const rows = Math.max(1, ...rowOfColumn.values());
  return {
    width: PADDING * 2 + columns * NODE_WIDTH + (columns - 1) * COLUMN_GAP,
    height: PADDING * 2 + rows * NODE_HEIGHT + (rows - 1) * ROW_GAP,
    nodes: positioned,
    edges: linked,
  };
}

const shorten = (text: string) => (text.length > LABEL_MAX ? `${text.slice(0, LABEL_MAX - 1)}…` : text);

/** An edge leaves the right side of its source. Forward edges end on the left of the target. */
export function edgePath(from: PositionedNode, to: PositionedNode): string {
  const sx = from.x + NODE_WIDTH;
  const sy = from.y + NODE_HEIGHT / 2;
  if (to.x > from.x) {
    const tx = to.x;
    const ty = to.y + NODE_HEIGHT / 2;
    const bend = Math.max(40, (tx - sx) / 2);
    return `M ${sx} ${sy} C ${sx + bend} ${sy}, ${tx - bend} ${ty}, ${tx} ${ty}`;
  }
  // Same column or backwards: loop out on the right and come back in on the right of the target.
  const tx = to.x + NODE_WIDTH;
  const ty = to.y + NODE_HEIGHT / 2;
  return `M ${sx} ${sy} C ${sx + 60} ${sy}, ${tx + 60} ${ty}, ${tx} ${ty}`;
}

const TONES: Record<NonNullable<GraphNode["tone"]>, string> = {
  primary: "fill-primary-light stroke-primary",
  neutral: "fill-bg-secondary stroke-border",
  warning: "fill-warning/10 stroke-warning",
};

interface ArtifactGraphProps {
  title: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** One line explaining how to read the columns, e.g. "Premises → scheme → conclusion". */
  legend?: string;
}

/** A dependency-free layered diagram. Full labels are in each node's tooltip and in the lists beside it. */
export default function ArtifactGraph({ title, nodes, edges, legend }: ArtifactGraphProps) {
  if (nodes.length === 0) return null;
  const layout = layoutGraph(nodes, edges);
  const showLabels = layout.edges.length <= EDGE_LABEL_LIMIT;
  return <figure className="rounded-xl border border-border bg-surface-white p-4">
    <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-text-primary">{title}</span><span className="text-xs text-text-muted">{layout.nodes.length} nodes · {layout.edges.length} relationships{showLabels ? "" : " · hover a line for its role"} · scroll to see all</span></figcaption>
    {legend && <p className="mb-2 text-xs text-text-secondary">{legend}</p>}
    <div className="max-h-[520px] overflow-auto rounded-lg bg-bg-primary">
      <svg role="img" aria-label={title} width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} className="block">
        <defs><marker id={`arrow-${title.replace(/\W+/g, "-")}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" className="fill-text-muted" /></marker></defs>
        {layout.edges.map((edge) => <g key={edge.id} data-testid="graph-edge"><title>{`${edge.label}: ${edge.from.label} → ${edge.to.label}`}</title><path d={edgePath(edge.from, edge.to)} fill="none" strokeWidth={1.5} className="stroke-text-muted" markerEnd={`url(#arrow-${title.replace(/\W+/g, "-")})`} />{showLabels && <text x={edge.from.x + NODE_WIDTH + 52} y={edge.from.y + NODE_HEIGHT / 2 - 5} textAnchor="middle" fontSize={10} className="fill-text-secondary">{edge.label}</text>}</g>)}
        {layout.nodes.map((node) => <g key={node.id} data-testid="graph-node"><title>{node.label}</title><rect x={node.x} y={node.y} width={NODE_WIDTH} height={NODE_HEIGHT} rx={8} className="fill-surface-white" /><rect x={node.x} y={node.y} width={NODE_WIDTH} height={NODE_HEIGHT} rx={8} strokeWidth={1.5} className={TONES[node.tone ?? "neutral"]} /><text x={node.x + 10} y={node.y + NODE_HEIGHT / 2 + 4} fontSize={12} className="fill-text-primary">{shorten(node.label)}</text></g>)}
      </svg>
    </div>
  </figure>;
}
