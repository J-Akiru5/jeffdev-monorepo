import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.jeffdev.studio';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
