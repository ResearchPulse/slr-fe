import { describe, expect, it } from "vitest";
import { normalizeExtractionStatus } from "../status";

describe("normalizeExtractionStatus", () => {
  it.each([
    ["IN_PROGRESS", "in-progress"],
    ["AWAITING_CONSENSUS", "awaiting-consensus"],
    ["COMPLETED", "completed"],
  ])("maps backend status %s", (input, expected) => {
    expect(normalizeExtractionStatus(input)).toBe(expected);
  });

  it("falls back to not started for missing or unknown status", () => {
    expect(normalizeExtractionStatus()).toBe("todo");
    expect(normalizeExtractionStatus("UNKNOWN")).toBe("todo");
  });
});
