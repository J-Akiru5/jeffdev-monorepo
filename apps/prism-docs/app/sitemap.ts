import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.jeffdev.studio';

// All supported locales
const LOCALES = ['en-US', 'en-GB', 'tl', 'ja', 'es', 'id', 'ru', 'nl'] as const;

// Map each locale to its IETF language tag for hreflang
const LOCALE_HREFLANG: Record<(typeof LOCALES)[number], string> = {
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  tl: 'tl',
  ja: 'ja',
  es: 'es',
  id: 'id',
  ru: 'ru',
  nl: 'nl',
};

// Core doc pages that exist across all locales
const DOC_PAGES = [
  { path: '/introduction', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/quick-start', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/video', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/integrations', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/guide/editor-setup', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/troubleshooting/mcp-setup', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/troubleshooting/common-issues', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/advanced/api-reference', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/changelog-page', priority: 0.5, changeFrequency: 'weekly' as const },
  { path: '/advanced/mcp-docker', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/advanced/mcp-vscode', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/advanced/custom-rules', priority: 0.6, changeFrequency: 'monthly' as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const doc of DOC_PAGES) {
    // Generate alternate links for hreflang
    const alternates: Record<string, string> = {};
    for (const locale of LOCALES) {
      alternates[LOCALE_HREFLANG[locale]] = `${BASE_URL}/${locale}${doc.path}`;
    }
    // Add x-default pointing to English
    alternates['x-default'] = `${BASE_URL}/en-US${doc.path}`;

    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${doc.path}`,
        lastModified: currentDate,
        changeFrequency: doc.changeFrequency,
        priority: doc.priority,
        alternates: {
          languages: alternates,
        },
      });
    }
  }

  // Add root pages per locale
  for (const locale of LOCALES) {
    const rootAlternates: Record<string, string> = {};
    for (const l of LOCALES) {
      rootAlternates[LOCALE_HREFLANG[l]] = `${BASE_URL}/${l}/`;
    }
    rootAlternates['x-default'] = `${BASE_URL}/en-US/`;

    entries.push({
      url: `${BASE_URL}/${locale}/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: rootAlternates,
      },
    });
  }

  return entries;
}
