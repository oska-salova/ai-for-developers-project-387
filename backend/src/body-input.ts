/**
 * The value of a field, or `undefined` when the key is absent. `null` counts
 * as absent, and keys outside the contract are simply not read.
 */
export function readField(body: Record<string, unknown>, key: string): unknown {
  const value = Object.hasOwn(body, key) ? body[key] : undefined;

  return value ?? undefined;
}

/** The request body as a plain object; anything else is treated as empty. */
export function asRecord(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}
