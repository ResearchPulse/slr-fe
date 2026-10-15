import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../config/axios";
import { dataExtractionConductingService } from "./dataExtractionConductingService";

vi.mock("../config/axios", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe("canonical extraction API client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the project dashboard and unwraps the canonical envelope", async () => {
    const dashboard = {
      summary: {
        totalIncluded: 1,
        inProgress: 1,
        awaitingConsensus: 0,
        completed: 0,
        notStarted: 0,
      },
      tasks: { items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0 },
    };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: dashboard } } as never);

    await expect(
      dataExtractionConductingService.getDashboard("project-1", {
        pageNumber: 1,
        pageSize: 20,
      }),
    ).resolves.toEqual(dashboard);
    expect(api.get).toHaveBeenCalledWith(
      "/projects/project-1/extraction/dashboard",
      { params: { pageNumber: 1, pageSize: 20, search: undefined } },
    );
  });

  it("assigns both selected reviewers to an extraction paper", async () => {
    const payload = {
      reviewerIds: ["reviewer-1", "reviewer-2"] as [string, string],
      templateId: "template-1",
    };
    vi.mocked(api.put).mockResolvedValue({ data: { success: true, data: {} } } as never);

    await expect(
      dataExtractionConductingService.assignReviewers("project-1", "paper-1", payload),
    ).resolves.toEqual({});

    expect(api.put).toHaveBeenCalledWith(
      "/projects/project-1/extraction/papers/paper-1/assignment",
      payload,
    );
  });

  it("submits an independently versioned reviewer draft to its project paper", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { success: true, data: {} } } as never);

    await dataExtractionConductingService.saveExtractionDraft("project-1", "paper-1", {
      templateVersion: 3,
      values: { title: "Independent answer" },
      expectedVersion: 2,
    });

    expect(api.put).toHaveBeenCalledWith(
      "/projects/project-1/extraction/papers/paper-1/reviewer/draft",
      {
        templateVersion: 3,
        values: { title: "Independent answer" },
        expectedVersion: 2,
      },
    );
  });

  it("stores consensus only through the canonical finalize operation", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: {} } } as never);

    await dataExtractionConductingService.finalizeConsensus("project-1", "paper-1", 5);

    expect(api.post).toHaveBeenCalledWith(
      "/projects/project-1/extraction/papers/paper-1/consensus/finalize",
      { expectedVersion: 5 },
    );
  });
  it("unwraps canonical JSON export projections into a downloadable Blob", async () => {
    const projection = {
      templateVersion: 4,
      fields: ["Title"],
      rows: [{ Title: "Study" }],
    };
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, data: projection },
    } as never);

    const result = await dataExtractionConductingService.exportExtractedData(
      "project-1",
      "json",
    );

    expect(result).toBeInstanceOf(Blob);
    expect(result.size).toBeGreaterThan(0);
    expect(api.get).toHaveBeenCalledWith(
      "/projects/project-1/extraction/export",
      { params: { format: "json", search: undefined } },
    );
  });

  it("returns the canonical AI proposal response without dropping typed values", async () => {
    const proposal = {
      values: { publicationYear: 2024, title: "Study" },
      evidenceRefs: [{ fieldId: "title", quote: "Study" }],
      templateVersion: 3,
    };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: proposal } } as never);

    await expect(
      dataExtractionConductingService.autoExtractWithAI("project-1", "paper-1", ["title", "publicationYear"]),
    ).resolves.toEqual(proposal);
    expect(api.post).toHaveBeenCalledWith(
      "/projects/project-1/extraction/papers/paper-1/ai-draft",
      { fieldIds: ["title", "publicationYear"] },
    );
  });

  it("maps canonical comment records into the reviewer comment DTO", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: {
          comments: [{
            id: "comment-1",
            fieldId: "title",
            reviewerId: "reviewer-1",
            userId: "reviewer-1",
            text: "Check the title",
            version: 1,
            createdAt: "2026-10-12T00:00:00.000Z",
            updatedAt: "2026-10-12T00:00:00.000Z",
          }],
        },
      },
    } as never);

    await expect(
      dataExtractionConductingService.getFieldComments("project-1", "paper-1", "title"),
    ).resolves.toEqual([{
      id: "comment-1",
      fieldId: "title",
      threadOwnerId: "reviewer-1",
      userId: "reviewer-1",
      userName: "reviewer-1",
      content: "Check the title",
      createdAt: "2026-10-12T00:00:00.000Z",
    }]);
  });
});
