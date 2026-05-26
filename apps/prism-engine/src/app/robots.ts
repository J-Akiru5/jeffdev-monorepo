import { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_PRISM_URL || 'https://prism.syntaxure.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/sign-in/', '/sign-up/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
