import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { A10View } from "./A10View";

describe("A10 traceability reproducibility package", () => {
  it("shows manifest validation and recorded decision provenance", () => {
    render(<A10View data={{ protocol: { research_questions: [{}], inclusion_criteria: [{}], exclusion_criteria: [] }, artifact_manifest: [{ artifact_type: "A1", validation_status: "valid", content_hash: "sha256:abc" }], decision_log: [{ kind: "quality_resolution", at: "2026-10-24", actor_id: "reviewer-1", ref: "study-1", detail: "Resolved quality review." }], hashes: { corpus: "sha256:corpus" } }} />);
    expect(screen.getByText("Protocol snapshot")).toBeTruthy();
    expect(screen.getByText("A1")).toBeTruthy();
    expect(screen.getByText("Resolved quality review.")).toBeTruthy();
  });
});
