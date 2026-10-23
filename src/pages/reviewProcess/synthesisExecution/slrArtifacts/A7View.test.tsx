import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { A7View } from "./A7View";

describe("A7 contradiction uncertainty register", () => {
  it("keeps candidate status, positions, and possible explanations visible", () => {
    render(<A7View data={{ summary: { contradictions: 1, uncertainties: 0 }, entries: [{ entry_id: "e1", register_type: "contradiction", category: "candidate_contradiction", status: "unverified", description: "Results diverge.", positions: [{ study_id: "s1", value: "Positive effect" }, { study_id: "s2", value: "No effect" }], possible_explanations: ["Different intervention dose."] }] }} />);
    expect(screen.getByText("unverified")).toBeTruthy();
    expect(screen.getByText("Positive effect")).toBeTruthy();
    expect(screen.getByText(/Different intervention dose/)).toBeTruthy();
  });
});
