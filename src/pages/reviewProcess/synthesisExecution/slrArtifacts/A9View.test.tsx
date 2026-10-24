import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { A9View } from "./A9View";

describe("A9 research agenda", () => {
  it("shows ranked questions, their gap source, and unrated feasibility", () => {
    render(<A9View data={{ items: [{ agenda_item_id: "a1", rank: 1, gap: { gap_type: "sparse_cell", description: "Evidence is sparse", source_refs: [{ artifact_type: "A8", ref_id: "cell-1" }] }, proposed_question: { text: "Which groups benefit?", origin: "template" }, rationale: "Only one study is available.", priority: "high", priority_rationale: "Sparse coverage", feasibility: { rating: null } }] }} />);
    expect(screen.getByText("Which groups benefit?")).toBeTruthy();
    expect(screen.getByText(/sparse cell/)).toBeTruthy();
    expect(screen.getByText(/Feasibility: not rated/)).toBeTruthy();
  });
});
