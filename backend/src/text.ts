/** Trims the edges and collapses inner whitespace into single spaces. */
export function normalizeSpaces(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}
