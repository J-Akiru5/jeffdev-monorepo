import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts } from "@/app/actions/blog";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

export const revalidate = 300;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: `${post.title} | Syntaxure Labs`,
      description: post.excerpt || undefined,
      url: `https://www.syntaxure.dev/blog/${slug}`,
      siteName: 'Syntaxure Labs',
      type: 'article',
      publishedTime: post.published_at || undefined,
      authors: [post.author],
      images: post.cover_image
        ? [{ url: post.cover_image, width: 1200, height: 630, alt: post.title }]
        : [{ url: 'https://www.syntaxure.dev/syntaxure-business-card.png', width: 1200, height: 630, alt: 'Syntaxure Labs' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | Syntaxure Labs`,
      description: post.excerpt || undefined,
      images: post.cover_image ? [post.cover_image] : ['https://www.syntaxure.dev/syntaxure-business-card.png'],
    },
  };
}

export async function generateStaticParams() {
  const posts = await getBlogPosts(100);
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Article JSON-LD for AI crawlers
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    datePublished: post.published_at || undefined,
    image: post.cover_image || undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Syntaxure Labs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.syntaxure.dev/favicon.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.syntaxure.dev/blog/${slug}`,
    },
  };

  return (
    <>
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Blog', item: 'https://www.syntaxure.dev/blog' },
              { '@type': 'ListItem', position: 2, name: post.title, item: `https://www.syntaxure.dev/blog/${slug}` },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="min-h-screen pt-24 pb-16">
      <article className="mx-auto max-w-3xl px-6 lg:px-8">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Draft"}
            </span>
            <span>·</span>
            <span>{post.author}</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              {post.excerpt}
            </p>
          )}

          {post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs text-[var(--text-tertiary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.cover_image && (
          <div className="mb-10 overflow-hidden rounded-lg border border-[var(--border-subtle)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        <div className="prose prose-invert max-w-none">
          <div
            className="text-[var(--text-secondary)] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    </div>
    </>
  );
}
