/**
 * Workspace naming helpers (client-safe — no server imports).
 *
 * Tenancy seam: one canonical check for the company workspace name instead
 * of scattered string comparisons across the app (handles the legacy
 * ", Inc." variant too).
 */

export function isSyntaxureWorkspaceName(
  name: string | null | undefined,
): boolean {
  return !!name && name.startsWith("Syntaxure Labs");
}
