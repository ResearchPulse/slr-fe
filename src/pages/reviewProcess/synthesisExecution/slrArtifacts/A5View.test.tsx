import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { A5View } from "./A5View";

describe("A5 context conditions and outcomes", () => {
  it("shows the observed context boundaries for each group", () => {
    render(<A5View data={{ group_by: "population_context", groups: [{ group_id: "g1", label: "University", study_ids: ["s1", "s2"], rows: [{ study_id: "s1" }], boundary_conditions: { observed_populations: ["Undergraduates"], observed_contexts: ["Online"], observed_interventions: ["Tutoring"] } }], ungrouped_study_ids: ["s3"] }} />);
    expect(screen.getByText("University")).toBeTruthy();
    expect(screen.getByText("Undergraduates")).toBeTruthy();
    expect(screen.getByText("Grouped by population_context")).toBeTruthy();
  });
});
