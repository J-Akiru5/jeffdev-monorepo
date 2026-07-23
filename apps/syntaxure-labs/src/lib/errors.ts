/**
 * Error Normalization Utility
 * ---------------------------
 * Supabase/PostgREST rejections are plain objects, not Error instances
 * (e.g. `{ message: "TypeError: fetch failed", details, hint, code }`).
 * Next.js dev's server→browser console replay cannot serialize those, so
 * they surface in the browser console as `{}`. Normalize every thrown value
 * to `{ message, code, hint }` and log it as a plain string so the real
 * cause is always readable in both the server terminal and the browser.
 */

export interface NormalizedError {
  message: string;
  code: string;
  hint: string;
}

export function normalizeError(error: unknown): NormalizedError {
  if (error !== null && typeof error === "object") {
    const e = error as Record<string, unknown>;
    let message =
      typeof e.message === "string" && e.message.length > 0
        ? e.message
        : "Unknown error";

    // PostgREST puts the root cause of network failures in `details`
    // ("...Caused by: Error: getaddrinfo ENOTFOUND host..."). Surface it.
    const details = typeof e.details === "string" ? e.details : "";
    const causedBy = details.match(/Caused by:\s*(.+)/)?.[1]?.trim();
    if (causedBy && !message.includes(causedBy)) {
      message = `${message} (${causedBy})`;
    }

    return {
      message,
      code: typeof e.code === "string" ? e.code : "",
      hint: typeof e.hint === "string" ? e.hint : "",
    };
  }

  if (typeof error === "string" && error.length > 0) {
    return { message: error, code: "", hint: "" };
  }

  return { message: "Unknown error", code: "", hint: "" };
}

/**
 * Log a data-layer error as a single composed string. A lone string argument
 * always survives console serialization — logging the raw object is what
 * produced the unreadable `{}` output.
 */
export function logDataError(tag: string, error: unknown): NormalizedError {
  const normalized = normalizeError(error);
  const suffix = [
    normalized.code ? `code=${normalized.code}` : "",
    normalized.hint ? `hint=${normalized.hint}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  console.error(`${tag}: ${normalized.message}${suffix ? ` [${suffix}]` : ""}`);
  return normalized;
}
