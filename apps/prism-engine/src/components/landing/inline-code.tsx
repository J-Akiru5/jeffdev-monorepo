import { Fragment } from "react";

/**
 * InlineCode — renders the backtick spans in `content.ts` as monospace chips.
 *
 * The copy for this page is authored as plain strings in one file, which means
 * terms like `block` and `PRISM_DISABLE=1` are written with markdown-style
 * backticks. Without a renderer those backticks show up as literal characters,
 * which on a page whose whole argument is precision reads as a mistake.
 *
 * This is the single place that decides how those terms look, so no section
 * component hand-writes a `<code>` and the copy stays readable as plain text.
 * Balanced pairs only — an odd number of backticks just renders the trailing
 * text as code to the end of the string, which is the same thing markdown does.
 */

interface InlineCodeProps {
  text: string;
  className?: string;
}

export function InlineCode({ text, className }: InlineCodeProps) {
  const parts = text.split("`");

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <code
            key={index}
            className={
              className ??
              "rounded-sm border border-[var(--border-subtle)] bg-white/[0.04] px-1 py-0.5 font-mono text-[0.85em] text-[var(--text-primary)]"
            }
          >
            {part}
          </code>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export default InlineCode;
