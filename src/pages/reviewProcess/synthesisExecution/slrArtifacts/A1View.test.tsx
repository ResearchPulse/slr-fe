import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { A1View } from "./A1View";

describe("A1 knowledge synthesis matrix", () => {
  it("shows the researcher theme and the exact linked source quote", () => {
    render(<A1View data={{ rows: [{ row_id: "A1:1", synthesis_group: { title: "Completion outcomes" }, synthesized_finding: { text: "Completion improved." }, citations: [], supporting_findings: [{ item_id: "e1", cited_finding: { study_id: "s1", finding_id: "f1", field_name: "Outcome", text: "Completion improved", evidence_ids: ["q1"] } }], not_reported_items: [], unresolved_items: [] }] }} corpus={{ evidence: [{ evidence_id: "q1", document_id: "d1", source_location: { page: 4 }, quote: "Exact source sentence." }] }} />);
    expect(screen.getByText("Completion outcomes")).toBeTruthy();
    expect(screen.getByText("Exact source sentence.")).toBeTruthy();
  });
});
