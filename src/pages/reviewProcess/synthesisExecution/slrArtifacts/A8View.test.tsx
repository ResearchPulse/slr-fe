import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { A8View } from "./A8View";

describe("A8 evidence gap map", () => {
  it("renders coverage cells with study IDs and quality counts", () => {
    render(<A8View data={{ rows: { dimension: { name: "Population" }, categories: [{ category_id: "p1", label: "Students" }] }, columns: { dimension: { name: "Outcome" }, categories: [{ category_id: "o1", label: "Completion" }] }, cells: [{ cell_id: "c1", row_category_id: "p1", column_category_id: "o1", study_count: 2, study_ids: ["s1", "s2"], status: "covered", quality: { high: 1, low: 1, unresolved_or_not_assessed: 0 } }], summary: { empty: 0, sparse: 0, covered: 1 }, sparse_threshold: 1 }} />);
    expect(screen.getByText("Students")).toBeTruthy();
    expect(screen.getByText("Completion")).toBeTruthy();
    expect(document.querySelector('td[title*="s1"]')?.getAttribute("title")).toContain("covered: 2 studies");
  });
});
