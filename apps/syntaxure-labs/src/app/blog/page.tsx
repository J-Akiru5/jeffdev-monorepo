import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts } from "@/app/actions/blog";
import { Calendar, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights, tutorials, and updates from Syntaxure Labs on web development, SaaS, and AI.",
};

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getBlogPosts(50);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-12">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Blog
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Insights & Updates
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Tutorials, deep dives, and product updates from the Syntaxure Labs team.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[var(--text-tertiary)]">No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 transition-all hover:border-[var(--text-tertiary)]"
              >
                <Link href={`/blog/${post.slug}`}>
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

                  <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p className="mt-2 text-[var(--text-secondary)] line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}

                  {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[var(--bg-primary)] px-2.5 py-0.5 text-xs text-[var(--text-tertiary)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
