import { MetadataRoute } from "next";

/**
 * SITEMAP GENERATOR
 * -----------------
 * Generates a sitemap.xml for search engines.
 * Access at: https://jeffdev.studio/sitemap.xml
 */

const BASE_URL = "https://jeffdev.studio";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Static pages
  const staticPages = [
    { url: BASE_URL, lastModified: currentDate, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/services`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${BASE_URL}/work`, lastModified: currentDate, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/quote`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/features`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/cookies`, lastModified: currentDate, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: currentDate, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: currentDate, changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  // Dynamic service pages
  try {
    const { getServices } = await import('@/lib/data');
    const services = await getServices();
    const servicePages = services.map((s) => ({
      url: `${BASE_URL}/services/${s.slug}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    // Dynamic project/case study pages
    const { getProjects } = await import('@/lib/data');
    const projects = await getProjects();
    const projectPages = projects.map((p) => ({
      url: `${BASE_URL}/work/${p.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticPages, ...servicePages, ...projectPages];
  } catch {
    return [...staticPages];
  }
}
