import { MetadataRoute } from 'next';

/**
 * SITEMAP GENERATOR
 * -----------------
 * Generates a sitemap.xml for search engines.
 * Access at: https://jeffdev.studio/sitemap.xml
 */

const BASE_URL = 'https://jeffdev.studio';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/services', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/work', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/quote', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  const staticPages = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // TODO: Fetch dynamic pages from Firestore (services, projects) if needed
  // const services = await getServices();
  // const servicePages = services.map((s) => ({ url: `${BASE_URL}/services/${s.slug}`, ... }));

  return [...staticPages];
}
