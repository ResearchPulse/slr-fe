import { describe, expect, it } from "vitest";
import { formatAuthorPreview } from "./formatAuthors";

describe("formatAuthorPreview", () => {
  it("keeps up to three authors unchanged", () => {
    expect(formatAuthorPreview(["Alice", "Bob", "Carol"])).toBe("Alice, Bob, Carol");
  });

  it("shortens long author lists with et al.", () => {
    expect(formatAuthorPreview(["Alice", "Bob", "Carol", "Dave"])).toBe(
      "Alice, Bob, Carol, et al.",
    );
  });

  it("returns null when no authors are available", () => {
    expect(formatAuthorPreview([])).toBeNull();
  });
});
