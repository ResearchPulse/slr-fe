import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../config/axios";
import { slrArtifactsService } from "./slrArtifactsService";

vi.mock("../config/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const run = { run_id: "run-20261001000000-abc123", artifacts: [], reviews: [] };
const base = "/projects/p1/synthesis/artifacts";

describe("slrArtifactsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the run record from the generate response and sends only set options", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { isSuccess: true, data: { run, artifacts: {} }, message: "" } });
    await expect(slrArtifactsService.generateRun("p1", { researchQuestionId: "", fieldRoles: {}, sparseThreshold: 2 })).resolves.toEqual(run);
    expect(api.post).toHaveBeenCalledWith(`${base}/runs`, { a3Mode: "deterministic", sparseThreshold: 2 });
  });

  it("reads the success flag under either name", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [run], message: "" } });
    await expect(slrArtifactsService.listRuns("p1")).resolves.toEqual([run]);
    vi.mocked(api.get).mockResolvedValueOnce({ data: { isSuccess: false, data: null, message: "nope" } });
    await expect(slrArtifactsService.listRuns("p1")).rejects.toThrow("nope");
  });

  it("sends the review note only when there is one", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { isSuccess: true, data: run, message: "" } });
    await slrArtifactsService.reviewArtifact("p1", run.run_id, "A3", "REJECTED", "  Unsupported CA  ");
    expect(api.post).toHaveBeenLastCalledWith(`${base}/runs/${run.run_id}/artifacts/A3/review`, { decision: "REJECTED", note: "Unsupported CA" });
    await slrArtifactsService.reviewArtifact("p1", run.run_id, "A3", "APPROVED", "   ");
    expect(api.post).toHaveBeenLastCalledWith(`${base}/runs/${run.run_id}/artifacts/A3/review`, { decision: "APPROVED" });
  });

  it("validates a graph against a run", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { isSuccess: true, data: { status: "valid" }, message: "" } });
    await slrArtifactsService.validateA3("p1", { nodes: [] }, run.run_id);
    expect(api.post).toHaveBeenCalledWith(`${base}/a3/validate`, { graph: { nodes: [] }, runId: run.run_id });
  });
});
