"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Search,
  Trash2,
  Edit,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import { cn } from "@syntaxure/ui";
import {
  deleteCommunityPost,
  togglePostPinned,
  togglePostPublished,
  type CommunityPost,
} from "@/app/actions/community";

const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
  discussion: {
    bg: "bg-cyan-500/10 border-cyan-500/20",
    text: "text-cyan-400",
    label: "Discussion",
  },
  showcase: {
    bg: "bg-purple-500/10 border-purple-500/20",
    text: "text-purple-400",
    label: "Showcase",
  },
  question: {
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-400",
    label: "Question",
  },
};

const defaultCategory = {
  bg: "bg-cyan-500/10 border-cyan-500/20",
  text: "text-cyan-400",
  label: "Discussion",
};

export function CommunityPostsTable({ posts }: { posts: CommunityPost[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeleting(id);
    const result = await deleteCommunityPost(id);
    setDeleting(null);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to delete post.");
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    const result = await togglePostPinned(id, !currentPinned);
    if (result.success) {
      router.refresh();
    }
  };

  const handleTogglePublish = async (id: string, currentPublished: boolean) => {
    const result = await togglePostPublished(id, !currentPublished);
    if (result.success) {
      router.refresh();
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-white/[0.06] bg-white/[0.02] py-16">
        <FileText className="h-10 w-10 text-white/20" />
        <p className="mt-4 text-sm text-white/40">No community posts yet.</p>
        <Link
          href="/admin/agency/community/posts/new"
          className="mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Create your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-white/5 bg-white/[0.02] pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/40 focus:bg-white/[0.04] focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-white/70 focus:border-amber-500/40 focus:outline-none font-mono"
          >
            <option value="all" className="bg-[#0f0f0f]">All Categories</option>
            <option value="discussion" className="bg-[#0f0f0f]">Discussion</option>
            <option value="showcase" className="bg-[#0f0f0f]">Showcase</option>
            <option value="question" className="bg-[#0f0f0f]">Question</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-white/[0.06]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
                Post
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
                Category
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
                Author
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
                Status
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/30">
                Date
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-white/30">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-white/20 font-mono">
                  No matching results found.
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => {
                const catConfig = categoryColors[post.category] ?? defaultCategory;
                return (
                  <tr key={post.id} className="transition-colors hover:bg-white/[0.02]">
                    {/* Post Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.image_url ? (
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-white/10">
                            <img
                              src={post.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white/[0.02] border border-white/5">
                            <FileText className="h-4 w-4 text-white/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {post.is_pinned && (
                              <Pin className="h-3 w-3 text-amber-400 shrink-0" />
                            )}
                            <span className="text-sm font-semibold text-white truncate">
                              {post.title}
                            </span>
                          </div>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] text-white/30 font-mono"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="text-[10px] text-white/20 font-mono">
                                  +{post.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider",
                          catConfig.bg,
                          catConfig.text
                        )}
                      >
                        {catConfig.label}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3 text-xs text-white/60">
                      {post.author?.full_name ?? <span className="text-white/20">—</span>}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider",
                            post.is_published
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-white/5 border-white/10 text-white/40"
                          )}
                        >
                          {post.is_published ? (
                            <Eye className="h-2.5 w-2.5" />
                          ) : (
                            <EyeOff className="h-2.5 w-2.5" />
                          )}
                          {post.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-white/40 font-mono">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleTogglePin(post.id, post.is_pinned)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
                          title={post.is_pinned ? "Unpin" : "Pin"}
                        >
                          {post.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleTogglePublish(post.id, post.is_published)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors"
                          title={post.is_published ? "Unpublish" : "Publish"}
                        >
                          {post.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <Link
                          href={`/admin/agency/community/posts/${post.id}/edit`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={deleting === post.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
