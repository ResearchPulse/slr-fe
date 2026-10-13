import type { ExtractionPaperStatus } from "./types";

export function normalizeExtractionStatus(
  status?: string | null,
): ExtractionPaperStatus {
  switch ((status ?? "").trim().toLowerCase().replaceAll("_", "-")) {
    case "in-progress":
    case "inprogress":
      return "in-progress";
    case "awaiting-consensus":
    case "awaitingconsensus":
      return "awaiting-consensus";
    case "completed":
      return "completed";
    default:
      return "todo";
  }
}
