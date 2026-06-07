"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import {
  getAgencyBlogPost,
  updateAgencyBlogPost,
  deleteAgencyBlogPost,
} from "@/app/actions/agency-blog";

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [postId, setPostId] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    author: "Syntaxure Labs",
    status: "draft" as "draft" | "published",
    tags: "",
  });

  useEffect(() => {
    params.then(async ({ id }) => {
      setPostId(id);
      const post = (await getAgencyBlogPost(id)) as any;
      if (post) {
        setForm({
          title: post.title || "",
          slug: post.slug || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
          cover_image: post.cover_image || "",
          author: post.author || "Syntaxure Labs",
          status: post.status || "draft",
          tags: (post.tags || []).join(", "),
        });
      }
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await updateAgencyBlogPost(postId, {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    if (result.success) {
      router.push("/admin/agency/blog");
    } else {
      setError(result.error || "Failed to update post");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setDeleting(true);
    const result = await deleteAgencyBlogPost(postId);
    if (result.success) {
      router.push("/admin/agency/blog");
    } else {
      setError(result.error || "Failed to delete post");
      setDeleting(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/agency/blog"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Edit Blog Post</h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-500/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-cyan-500/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">Excerpt</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-500/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">Content (HTML)</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={15}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-cyan-500/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">Cover Image URL</label>
          <input
            type="url"
            value={form.cover_image}
            onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">Author</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-500/50"
            >
              <option value="draft" className="bg-[#0a0a0a]">Draft</option>
              <option value="published" className="bg-[#0a0a0a]">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">Tags (comma-separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="web, saas, tutorial"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/admin/agency/blog"
            className="rounded-lg border border-white/10 px-6 py-2.5 text-sm text-white/50 transition-colors hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
