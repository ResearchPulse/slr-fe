type AuthorRecord = Record<string, unknown>;

const asAuthorName = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";

  const author = value as AuthorRecord;
  const directName =
    author.name ?? author.displayName ?? author.fullName ?? author.authorName;
  if (typeof directName === "string" && directName.trim()) return directName.trim();

  const given = author.givenName ?? author.given ?? author.firstName;
  const family = author.familyName ?? author.family ?? author.lastName;
  return [given, family]
    .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
    .join(" ");
};

export const formatAuthors = (value: unknown): string => {
  let authors = value;

  if (typeof authors === "string") {
    const trimmed = authors.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        authors = JSON.parse(trimmed) as unknown;
      } catch {
        // Keep ordinary author strings intact when they are not JSON.
      }
    }
  }

  if (Array.isArray(authors)) {
    const names = authors.map(asAuthorName).filter(Boolean);
    return names.join(", ") || "Author information unavailable";
  }

  const name = asAuthorName(authors);
  if (!name || name === "[object Object]") return "Author information unavailable";

  const cleaned = name
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part !== "[object Object]")
    .join(", ");

  return cleaned || "Author information unavailable";
};
