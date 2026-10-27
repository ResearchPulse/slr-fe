import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { A6View } from "./A6View";

describe("A6 mechanism moderator map", () => {
  it("shows co-reported mechanism pathways with study provenance counts", () => {
    render(<A6View data={{ graph: { nodes: [{ node_id: "n1", kind: "mechanism", label: "Feedback", study_ids: ["s1", "s2"] }], edges: [{ edge_id: "e1", source: "i1", target: "n1", relation: "acts_through", study_ids: ["s1"] }] }, mechanisms: [] }} />);
    // The label is drawn in the diagram and listed beside it.
    expect(screen.getAllByText("Feedback").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("acts_through")).toBeTruthy();
    expect(screen.getByText("Observed together in 1 studies")).toBeTruthy();
  });
});
