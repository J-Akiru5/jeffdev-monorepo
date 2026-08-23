import { existsSync, mkdirSync, renameSync, writeFileSync } from "fs";
import { dirname } from "path";
import { randomBytes } from "crypto";

/**
 * Write `content` to `filePath` atomically: write to a sibling temp file,
 * then rename it over the target. `fs.renameSync` is atomic for same-volume
 * renames on both POSIX and Windows (NTFS), which this always is — the temp
 * file is created next to its target. An interrupted process leaves an
 * orphaned `.tmp-*` file behind instead of a half-written target, so a
 * killed `prism pull`/`prism init` can never leave `.prism/rules.json` (or
 * `.prism/config.json`) truncated or corrupt.
 */
export function atomicWriteFileSync(filePath: string, content: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${randomBytes(4).toString("hex")}`;
  writeFileSync(tmpPath, content, "utf8");
  renameSync(tmpPath, filePath);
}
