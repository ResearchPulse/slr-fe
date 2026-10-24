import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { A4View } from "./A4View";

describe("A4 evidence quality and confidence", () => {
  it("shows quality decisions while keeping certainty explicitly unassessed", () => {
    render(<A4View data={{ summary: { high: 1, low: 0, unresolved: 0, not_assessed: 1 }, study_assessments: [{ study_id: "s1", citation: { title: "Study One" }, final_decision: "INCLUDE", final_score: 4, max_score: 5 }], certainty: [{ target: { claim_id: "c1", title: "Completion" }, status: "not_assessed", evidence_profile: { supporting_study_ids: ["s1"], high_quality_study_ids: ["s1"], low_quality_study_ids: [] } }] }} />);
    expect(screen.getByText("Study quality assessments")).toBeTruthy();
    expect(screen.getByText("not_assessed")).toBeTruthy();
    expect(screen.getByText(/method and rating/)).toBeTruthy();
  });
});
