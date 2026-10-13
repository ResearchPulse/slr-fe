/**
 * Convert the author shapes returned by the API into display text.
 *
 * Crossref imports may return authors as `{ name, affiliation }` objects,
 * while older records and some endpoints still return a plain string.
 */
export function formatAuthors(authors: unknown): string | null {
  if (typeof authors === "string") {
    const value = authors.trim();
    return value || null;
  }

  if (!Array.isArray(authors)) {
    return null;
  }

  const names = authors
    .map((author) => {
      if (typeof author === "string") {
        return author.trim();
      }

      if (author && typeof author === "object" && "name" in author) {
        const name = (author as { name?: unknown }).name;
        return typeof name === "string" ? name.trim() : "";
      }

      return "";
    })
    .filter(Boolean);

  return names.length > 0 ? names.join(", ") : null;
}

/** Keep paper lists compact while preserving the complete author string for tooltips/details. */
export function formatAuthorPreview(authors: unknown, maxAuthors = 3): string | null {
  const formatted = formatAuthors(authors);
  if (!formatted) return null;

  const names = formatted.split(",").map((name) => name.trim()).filter(Boolean);
  if (names.length <= maxAuthors) return formatted;

  return `${names.slice(0, maxAuthors).join(", ")}, et al.`;
}
