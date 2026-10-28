import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ArtifactGraph, { EDGE_LABEL_LIMIT, NODE_HEIGHT, NODE_WIDTH, edgePath, layoutGraph } from "./ArtifactGraph";
import { toA3Graph } from "./A3View";
import { toA6Graph } from "./A6View";

const nodes = [
  { id: "a", label: "Premise one", column: 0 },
  { id: "b", label: "Premise two", column: 0 },
  { id: "s", label: "RA · Induction", column: 1 },
  { id: "c", label: "Conclusion", column: 2 },
];

describe("layoutGraph", () => {
  it("stacks a column top to bottom and spaces columns left to right", () => {
    const layout = layoutGraph(nodes, []);
    const [a, b, s, c] = layout.nodes;
    expect(a.x).toBe(b.x);
    expect(b.y).toBeGreaterThan(a.y);
    expect(s.x).toBeGreaterThan(a.x + NODE_WIDTH);
    expect(c.x).toBeGreaterThan(s.x + NODE_WIDTH);
    expect(layout.width).toBeGreaterThan(c.x + NODE_WIDTH);
    expect(layout.height).toBeGreaterThanOrEqual(b.y + NODE_HEIGHT);
  });

  it("drops edges whose ends are missing and keeps the rest", () => {
    const layout = layoutGraph(nodes, [
      { id: "e1", source: "a", target: "s", label: "premise" },
      { id: "e2", source: "a", target: "ghost", label: "premise" },
    ]);
    expect(layout.edges.map((edge) => edge.id)).toEqual(["e1"]);
  });

  it("draws forward edges into the left of the target and loops same-column edges on the right", () => {
    const [a, b, s] = layoutGraph(nodes, []).nodes;
    expect(edgePath(a, s)).toContain(`${s.x} ${s.y + NODE_HEIGHT / 2}`);
    expect(edgePath(a, b)).toContain(`${b.x + NODE_WIDTH} ${b.y + NODE_HEIGHT / 2}`);
  });

  it("puts nodes that feed the same scheme next to each other", () => {
    const layout = layoutGraph(
      [
        { id: "p1", label: "P1", column: 0 },
        { id: "p2", label: "P2", column: 0 },
        { id: "p3", label: "P3", column: 0 },
        { id: "s1", label: "S1", column: 1 },
        { id: "s2", label: "S2", column: 1 },
      ],
      [
        { id: "e1", source: "p1", target: "s2", label: "premise" },
        { id: "e2", source: "p2", target: "s1", label: "premise" },
        { id: "e3", source: "p3", target: "s2", label: "premise" },
      ],
    );
    expect(layout.nodes.filter((node) => node.column === 0).map((node) => node.id)).toEqual(["p2", "p1", "p3"]);
  });

  it("handles an empty graph", () => {
    expect(layoutGraph([], []).nodes).toEqual([]);
  });
});

describe("ArtifactGraph", () => {
  it("renders one shape per node and edge, with the full label as a tooltip", () => {
    const long = "A very long conclusion that does not fit in a single node box";
    render(<ArtifactGraph title="Test graph" nodes={[...nodes.slice(0, 2), { id: "x", label: long, column: 1 }]} edges={[{ id: "e1", source: "a", target: "x", label: "premise" }]} />);
    expect(screen.getByRole("img", { name: "Test graph" })).toBeTruthy();
    expect(screen.getAllByTestId("graph-node")).toHaveLength(3);
    expect(screen.getAllByTestId("graph-edge")).toHaveLength(1);
    expect(screen.getByText(long)).toBeTruthy(); // the <title> tooltip carries the whole text
    expect(screen.queryByText(long.slice(0, 40))).toBeNull(); // the drawn label is shortened
  });

  it("prints edge labels only while the graph is sparse", () => {
    const many = Array.from({ length: EDGE_LABEL_LIMIT + 1 }, (_, index) => ({ id: `e${index}`, source: "a", target: "s", label: "premise" }));
    const small = render(<ArtifactGraph title="Sparse" nodes={nodes} edges={[{ id: "e1", source: "a", target: "s", label: "premise" }]} />);
    expect(small.container.querySelectorAll("text").length).toBe(nodes.length + 1);
    small.unmount();
    const dense = render(<ArtifactGraph title="Dense" nodes={nodes} edges={many} />);
    expect(dense.container.querySelectorAll("text").length).toBe(nodes.length);
    expect(screen.getByText(/hover a line/)).toBeTruthy();
  });

  it("renders nothing without nodes", () => {
    const { container } = render(<ArtifactGraph title="Empty" nodes={[]} edges={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("graph mappers", () => {
  it("places A3 premises left, schemes in the middle and conclusions right", () => {
    const graph = toA3Graph(
      [
        { node_id: "I1", type: "I", content: "Premise", content_kind: "premise" },
        { node_id: "S1", type: "S", scheme_type: "RA", label: "Induction" },
        { node_id: "I2", type: "I", content: "Claim", content_kind: "claim" },
        { node_id: "S2", type: "S", scheme_type: "CA", label: "Conflict" },
      ],
      [
        { edge_id: "e1", source: "I1", target: "S1", role: "premise" },
        { edge_id: "e2", source: "S1", target: "I2", role: "conclusion" },
      ],
    );
    const column = (id: string) => graph.nodes.find((node) => node.id === id)?.column;
    expect([column("I1"), column("S1"), column("I2"), column("S2")]).toEqual([0, 1, 2, 1]);
    expect(graph.nodes.find((node) => node.id === "S2")?.tone).toBe("warning");
    expect(graph.edges.map((edge) => edge.label)).toEqual(["premise", "conclusion"]);
  });

  it("orders A6 nodes by kind", () => {
    const graph = toA6Graph(
      [
        { node_id: "o", kind: "outcome", label: "Speed" },
        { node_id: "i", kind: "intervention", label: "Copilot" },
        { node_id: "m", kind: "mechanism", label: "Autocomplete" },
        { node_id: "d", kind: "moderator", label: "Experience" },
      ],
      [{ edge_id: "e", source: "i", target: "m", relation: "acts_through" }],
    );
    expect(graph.nodes.map((node) => node.column)).toEqual([3, 0, 1, 2]);
    expect(graph.edges[0].label).toBe("acts through");
  });
});
