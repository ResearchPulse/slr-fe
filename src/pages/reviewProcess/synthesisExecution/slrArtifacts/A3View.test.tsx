import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { A3View } from "./A3View";

describe("A3 scientific argument graph", () => {
  it("renders nodes, edge roles, and validation status", () => {
    render(<A3View data={{ metadata: { validation: { status: "valid", layer_a: { issues: [] }, layer_b: { issues: [] } } }, nodes: [{ node_id: "I1", type: "I", content_kind: "finding", content: "Outcome improved.", provenance: [] }, { node_id: "S1", type: "S", scheme_type: "RA", label: "Induction" }], edges: [{ edge_id: "e1", source: "I1", target: "S1", role: "premise" }] }} />);
    expect(screen.getByText("Graph validation")).toBeTruthy();
    expect(screen.getAllByText("premise").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Outcome improved.").length).toBeGreaterThanOrEqual(1);
  });
});
