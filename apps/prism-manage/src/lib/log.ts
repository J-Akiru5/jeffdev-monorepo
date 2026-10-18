/**
 * Structured logging
 * ------------------
 * One JSON line per event — greppable in Vercel/CI output, parseable by any
 * log drain. Never throws: logging must not break the request path.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

function write(level: LogLevel, msg: string, fields?: LogFields): void {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      service: "prism-manage",
      msg,
      ...fields,
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  } catch {
    // best-effort — never let logging throw
  }
}

export const logger = {
  debug: (msg: string, fields?: LogFields) => write("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => write("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => write("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => write("error", msg, fields),
};

/**
 * Times an async operation and logs its outcome (with duration). Re-throws
 * failures after logging them.
 */
export async function timed<T>(
  msg: string,
  fields: LogFields,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await fn();
    logger.info(msg, {
      ...fields,
      outcome: "ok",
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    logger.error(`${msg}.failed`, {
      ...fields,
      outcome: "error",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
