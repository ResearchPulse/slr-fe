import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CandidatePaperDto, PaperWithCandidateDto } from "../../../types/paper";
import SnowballingPaperWorkspace from "./SnowballingPaperWorkspace";

const { usePaperSpecificCandidates } = vi.hoisted(() => ({
  usePaperSpecificCandidates: vi.fn(),
}));

vi.mock("../../../hooks/useSnowballCandidates", () => ({
  usePaperSpecificCandidates,
  useSelectCandidates: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useRejectCandidates: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

const makeCandidate = (index: number): CandidatePaperDto => ({
  candidateId: `candidate-${index}`,
  originPaperId: "source-paper",
  originPaperTitle: "Source paper",
  title: `Reference ${index}: a long academic title about reproducible research methods`,
  authors: "A. Researcher, B. Scientist",
  publicationYear: "2024",
  doi: `10.1234/example.${index}`,
  rawReference: "",
  status: 0,
  statusText: "Detected",
  confidenceScore: 0.75,
  extractionQualityScore: 0.75,
  matchConfidenceScore: 0,
  isSelectedInProjectRepository: false,
});

const makePaper = (overrides: Partial<PaperWithCandidateDto> = {}): PaperWithCandidateDto => ({
  id: "source-paper",
  title: "A long source paper title about privacy preserving federated learning",
  authors: '[{"given":"Ada","family":"Lovelace"}]',
  abstract: "A short abstract.",
  publicationYear: "2025",
  doi: "10.1234/source",
  sourceType: "PDF",
  source: "IEEE",
  importedAt: "2025-01-01T00:00:00Z",
  candidateCount: 0,
  suggestedCount: 0,
  duplicateCount: 0,
  ...overrides,
});

const renderWorkspace = (paper: PaperWithCandidateDto) =>
  render(
    <SnowballingPaperWorkspace
      projectId="project-1"
      paper={paper}
      onSelectCandidate={vi.fn()}
      selectedCandidate={null}
      onCloseDetail={vi.fn()}
      onAction={vi.fn().mockResolvedValue(undefined)}
      isProcessing={false}
    />,
  );

describe("SnowballingPaperWorkspace", () => {
  beforeEach(() => {
    usePaperSpecificCandidates.mockReset();
  });

  it("shows a clear empty state and tolerates missing paper metadata", () => {
    usePaperSpecificCandidates.mockReturnValue({
      data: { items: [], totalCount: 0, totalPages: 1 },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderWorkspace(
      makePaper({
        authors: "[object Object]",
        abstract: "",
        publicationYear: "",
        doi: "",
      }),
    );

    expect(screen.getAllByText("No references extracted yet")).toHaveLength(1);
    expect(screen.getAllByText("Author information unavailable").length).toBeGreaterThan(0);
    expect(screen.getByText("No abstract is available for this paper.")).toBeTruthy();
    expect(screen.getAllByText("Year unavailable").length).toBeGreaterThan(0);
  });

  it("renders long paper titles and large candidate results as a compact list", () => {
    const candidates = Array.from({ length: 60 }, (_, index) => makeCandidate(index + 1));
    usePaperSpecificCandidates.mockReturnValue({
      data: { items: candidates, totalCount: candidates.length, totalPages: 6 },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    const longTitle = `${"A detailed source paper title ".repeat(8)}about systematic review methods`;

    renderWorkspace(makePaper({ title: longTitle, candidateCount: candidates.length }));

    expect(screen.getByRole("heading", { name: longTitle })).toBeTruthy();
    expect(
      screen.getAllByRole("button", {
        name: /^Reference \d+: a long academic title about reproducible research methods$/,
      }),
    ).toHaveLength(60);
    expect(screen.getByText("60 total")).toBeTruthy();
  });

  it("keeps the complete abstract available behind an accessible disclosure", () => {
    usePaperSpecificCandidates.mockReturnValue({
      data: { items: [], totalCount: 0, totalPages: 1 },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderWorkspace(makePaper({ abstract: "Research context and findings. ".repeat(30) }));
    const disclosure = screen.getByRole("button", { name: /Read full abstract/ });

    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(disclosure);
    expect(screen.getByRole("button", { name: /Show less/ }).getAttribute("aria-expanded")).toBe("true");
  });

  it("exposes selection and candidate actions through keyboard accessible controls", () => {
    usePaperSpecificCandidates.mockReturnValue({
      data: { items: [makeCandidate(1)], totalCount: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderWorkspace(makePaper({ candidateCount: 1 }));

    expect(screen.getByRole("checkbox", { name: /Select Reference 1/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Actions for Reference 1/ }));
    const addAction = screen.getByRole("menuitem", { name: "Add to repository" });
    expect(document.activeElement).toBe(addAction);
    fireEvent.keyDown(addAction, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Reject" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Actions for Reference 1/ }));
  });
});
