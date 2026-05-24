/**
 * Copies en-US sub-page .mdx and _meta.json files to target locales.
 * Follows the ja/tl pattern: sub-pages keep English content but get locale-prefixed hrefs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enUSDir = path.resolve(__dirname, '../apps/prism-docs/app/en-US');
const targetLocales = ['es', 'id', 'en-GB', 'ru', 'nl'];

/** Recursively walk a directory and return all files with relative paths */
function walkDir(dir, baseDir = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath, baseDir));
    } else {
      files.push({ fullPath, relPath });
    }
  }
  return files;
}

/** Fix JSX href attributes (href="/path") to locale-prefixed version */
function fixHrefs(content, locale) {
  return content.replace(
    /(href=")\/(?!\/)([^"]+)(")/g,
    (match, prefix, url, suffix) => {
      if (url.startsWith('http') || url.startsWith('#') || url.startsWith('mailto:')) return match;
      if (targetLocales.some(l => url === l || url.startsWith(l + '/'))) return match;
      return `${prefix}/${locale}/${url}${suffix}`;
    }
  );
}

/** Fix markdown links [text](/path) to locale-prefixed version */
function fixMarkdownLinks(content, locale) {
  return content.replace(
    /(\]\()\/(?!\/)([^)\s]+)(\))/g,
    (match, prefix, url, suffix) => {
      if (url.startsWith('http') || url.startsWith('#') || url.startsWith('mailto:')) return match;
      if (targetLocales.some(l => url === l || url.startsWith(l + '/'))) return match;
      return `${prefix}/${locale}/${url}${suffix}`;
    }
  );
}

let copiedCount = 0;
let metaCount = 0;

for (const locale of targetLocales) {
  const targetDir = path.resolve(__dirname, `../apps/prism-docs/app/${locale}`);
  const files = walkDir(enUSDir);

  // Copy sub-page .mdx files (skip page.mdx which is already translated)
  for (const { fullPath, relPath } of files) {
    if (relPath === 'page.mdx') continue;

    if (relPath.endsWith('.mdx')) {
      const targetPath = path.join(targetDir, relPath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      const content = fs.readFileSync(fullPath, 'utf-8');
      let fixed = fixHrefs(content, locale);
      fixed = fixMarkdownLinks(fixed, locale);
      fs.writeFileSync(targetPath, fixed, 'utf-8');
      copiedCount++;
    }
  }

  // Copy sub-directory _meta.json files (not root _meta.json which is already translated)
  for (const { fullPath, relPath } of files) {
    if (relPath.endsWith('_meta.json') && relPath !== '_meta.json') {
      const targetPath = path.join(targetDir, relPath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(fullPath, targetPath);
      metaCount++;
    }
  }
}

console.log(`✅ Copied ${copiedCount} sub-page .mdx files across ${targetLocales.length} locales`);
console.log(`✅ Copied ${metaCount} sub-directory _meta.json files`);
