interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function parseMarkdown(md: string): string {
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Paragraphs (lines that aren't already wrapped)
    .replace(/^(?!<[hulo])((?!^\s*$).+)$/gm, '<p>$1</p>')
    // Clean up empty lines
    .replace(/\n{3,}/g, '\n\n');
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const html = parseMarkdown(content);

  return (
    <div
      className={
        className ??
        "prose prose-invert mt-12 max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-white/60 prose-strong:text-white prose-li:text-white/60 prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline"
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
