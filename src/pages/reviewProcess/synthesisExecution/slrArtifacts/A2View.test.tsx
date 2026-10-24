import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { A2View } from "./A2View";

describe("A2 research landscape taxonomy", () => {
  it("summarizes study distributions and taxonomy categories", () => {
    render(<A2View data={{ total_included_studies: 2, distributions: { by_year: [{ key: "2024", label: "2024", study_count: 2 }] }, dimensions: [{ dimension_id: "d1", name: "Method", categories: [{ category_id: "c1", label: "Survey", study_count: 2 }] }] }} />);
    expect(screen.getByText("Included studies")).toBeTruthy();
    expect(screen.getByText("2024")).toBeTruthy();
    expect(screen.getByText("Survey · 2")).toBeTruthy();
  });
});
