import { describe, expect, it } from "vitest";
import { formatAuthors } from "./formatAuthors";

describe("formatAuthors", () => {
  it("formats structured authors without exposing object strings", () => {
    expect(
      formatAuthors([
        { givenName: "Ada", familyName: "Lovelace" },
        { name: "Grace Hopper" },
      ]),
    ).toBe("Ada Lovelace, Grace Hopper");
  });

  it("parses JSON encoded author arrays", () => {
    expect(formatAuthors('[{"given":"Katherine","family":"Johnson"}]')).toBe(
      "Katherine Johnson",
    );
  });

  it("removes object conversion artifacts and handles missing authors", () => {
    expect(formatAuthors("[object Object], [object Object]")).toBe(
      "Author information unavailable",
    );
    expect(formatAuthors(null)).toBe("Author information unavailable");
  });
});
