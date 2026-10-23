import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SlrArtifactsWorkspace from "./SlrArtifactsWorkspace";

const { listRuns, getArtifact, generateRun, reviewArtifact } = vi.hoisted(() => ({
  listRuns: vi.fn(),
  getArtifact: vi.fn(),
  generateRun: vi.fn(),
  reviewArtifact: vi.fn(),
}));

vi.mock("../../../services/slrArtifactsService", () => ({
  SLR_ARTIFACT_TYPES: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"],
  slrArtifactsService: { listRuns, getArtifact, generateRun, reviewArtifact },
}));
vi.mock("../../../hooks/useProjectMember", () => ({ useProjectMember: () => ({ member: { isLeader: true } }) }));

const run = {
  run_id: "run-20261024090000-abc123",
  project_id: "project-1",
  generated_at: "2026-10-24T09:00:00.000Z",
  generated_by: "owner-1",
  corpus_hash: "sha256:corpus",
  corpus_version: "slr-artifact-corpus-v2",
  artifacts: [],
};

function renderWorkspace() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><SlrArtifactsWorkspace projectId="project-1" /></QueryClientProvider>);
}

describe("SLR artifacts workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listRuns.mockResolvedValue([run]);
    getArtifact.mockImplementation((_projectId: string, _runId: string, type: string) => Promise.resolve(type === "corpus" ? ({
      evidence: [{ evidence_id: "quote-1", document_id: "fulltext-1", source_location: { page: 3, section: "Results", paragraph: 2 }, quote: "Exact line from the article.", quote_hash_verified: true }],
    }) : type === "A1" ? ({
      title: "Knowledge Synthesis Matrix",
      metadata: { generated_at: run.generated_at, corpus: { corpus_version: run.corpus_version }, review_status: "unreviewed", validation_status: "not_applicable" },
      rows: [{ row_id: "row-1", synthesis_group: { claim_id: "theme-1", title: "Completion outcomes", research_question_id: "rq-1" }, synthesized_finding: { text: "Completion improved in the reviewed study.", origin: "researcher", claim_id: "theme-1" }, citations: [{ study_id: "study-1", title: "Fixture article A", authors: ["Author One", "Author Two", "Author Three"], year: 2024, doi: "10.0000/fixture" }], supporting_findings: [{ item_id: "evidence-1", study_id: "study-1", value_drift: "unchanged", cited_finding: { finding_id: "finding-1", study_id: "study-1", field_name: "Main finding", text: "Completion improved.", evidence_ids: ["quote-1"] } }], not_reported_items: [{ item_id: "evidence-2", study_id: "study-2" }], unresolved_items: [{ item_id: "evidence-3", study_id: "study-3", unresolved_reason: "value_missing" }] }],
      unsynthesized_findings: [],
    }) : type === "A8" ? ({
      title: "Evidence Gap Map",
      rows: { dimension: { name: "Population" }, categories: [{ category_id: "pop-1", label: "University students" }] },
      columns: { dimension: { name: "Outcome" }, categories: [{ category_id: "out-1", label: "Completion" }] },
      cells: [{ cell_id: "cell-1", row_category_id: "pop-1", column_category_id: "out-1", study_count: 2, study_ids: ["study-1", "study-2"], status: "covered", quality: { high: 1, low: 1, unresolved_or_not_assessed: 0 } }],
      summary: { empty: 0, sparse: 0, covered: 1 },
      sparse_threshold: 1,
    }) : ({
      title: "Scientific Argument Graph",
      metadata: { validation: { status: "valid", layer_a: { issues: [] }, layer_b: { issues: [] } } },
      nodes: [{ node_id: "I1", type: "I", content_kind: "finding", content: "Completion improved.", provenance: [] }, { node_id: "S1", type: "S", scheme_type: "RA", label: "Induction" }],
      edges: [{ edge_id: "edge-1", source: "I1", target: "S1", role: "premise" }],
    })));
  });

  it("shows sourced findings and distinguishes not reported and unresolved theme evidence", async () => {
    renderWorkspace();

    expect(await screen.findByText("Completion outcomes")).toBeTruthy();
    expect(screen.getByText("Completion improved.")).toBeTruthy();
    expect(screen.getByText("Fixture article A")).toBeTruthy();
    expect(await screen.findByText("Exact line from the article.")).toBeTruthy();
    expect(screen.getByText(/page 3 · paragraph 3/)).toBeTruthy();
    expect(screen.getByText(/resolved · unchanged/)).toBeTruthy();
    fireEvent.click(screen.getByText("Items not counted as supporting evidence"));
    expect(screen.getAllByText(/not reported/).length).toBeGreaterThan(0);
    expect(screen.getByText(/unresolved · value_missing/)).toBeTruthy();
  });

  it("renders argument graph nodes and directed edge semantics from the stored A3 payload", async () => {
    renderWorkspace();
    await screen.findByText("Completion outcomes");
    fireEvent.change(screen.getByLabelText("Artifact"), { target: { value: "A3" } });

    await waitFor(() => expect(screen.getByText("Scientific Argument Graph")).toBeTruthy());
    expect(screen.getByText("I · finding")).toBeTruthy();
    expect(screen.getByText("S · RA")).toBeTruthy();
    expect(screen.getByText("premise")).toBeTruthy();
    expect(screen.getAllByText("I1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("S1").length).toBeGreaterThan(0);
  });

  it("renders gap-map dimensions, coverage counts, and supporting study details", async () => {
    renderWorkspace();
    await screen.findByText("Completion outcomes");
    fireEvent.change(screen.getByLabelText("Artifact"), { target: { value: "A8" } });

    expect(await screen.findByText("University students")).toBeTruthy();
    expect(screen.getByText("Completion")).toBeTruthy();
    expect(screen.getByText(/Rows: Population/)).toBeTruthy();
    const coveredCell = document.querySelector('td[title*="study-1"]');
    expect(coveredCell?.getAttribute("title")).toContain("covered: 2 studies");
  });
});
