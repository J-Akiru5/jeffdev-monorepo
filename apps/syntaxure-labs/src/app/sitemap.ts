import { MetadataRoute } from "next";

/**
 * SITEMAP GENERATOR
 * -----------------
 * Generates a sitemap.xml for search engines.
 * Access at: https://www.syntaxure.dev/sitemap.xml
 */

const BASE_URL = "https://www.syntaxure.dev";

/**
 * Static routes — exported so a unit test can pin coverage
 * (the launch page must never silently drop out of the sitemap).
 */
export function staticSitemapPages(
  now: Date = new Date(),
): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/prism`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE_URL}/services`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${BASE_URL}/work`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/quote`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/features`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/community`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE_URL}/changelog`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 },
    { url: `${BASE_URL}/llms.txt`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/llms-full.txt`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${BASE_URL}/b2039173526041dc8f9e095c3207c8d8.txt`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.1 },
    { url: `${BASE_URL}/cookies`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();
  const staticPages = staticSitemapPages(currentDate);

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

    // Dynamic blog posts
    let blogPages: MetadataRoute.Sitemap = [];
    try {
      const { getBlogPosts } = await import('@/app/actions/blog');
      const posts = await getBlogPosts(100);
      blogPages = posts.map((p) => ({
        url: `${BASE_URL}/blog/${p.slug}`,
        lastModified: p.published_at ? new Date(p.published_at) : currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    } catch {
      // Blog fetching failed, skip
    }

    return [...staticPages, ...servicePages, ...projectPages, ...blogPages];
  } catch {
    return [...staticPages];
  }
}
