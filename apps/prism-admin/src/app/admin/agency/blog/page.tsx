import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Plus, Edit2, Trash2, Eye } from "lucide-react";
import { getAgencyBlogPosts, deleteAgencyBlogPost } from "@/app/actions/agency-blog";

export const dynamic = "force-dynamic";

export default async function AgencyBlogPage() {
  await cookies();
  const result = await getAgencyBlogPosts();
  const posts = (result.data || []) as any[];

  async function handleDelete(id: string) {
    "use server";
    await deleteAgencyBlogPost(id);
  }

  return (
    <div>
      <Link
        href="/admin/agency/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Blog Posts</h1>
          <p className="mt-2 text-white/50">{posts.length} total posts</p>
        </div>
        <Link
          href="/admin/agency/blog/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      <div className="mt-8 grid gap-4">
        {posts.map((post: any) => (
          <div
            key={post.id}
            className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] p-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-white">{post.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    post.status === "published"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {post.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-white/40">
                {post.excerpt || "No excerpt"} · {post.author}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-white/30">
                <span>/{post.slug}</span>
                {post.tags?.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{post.tags.join(", ")}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {post.status === "published" && (
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="rounded-md p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              )}
              <Link
                href={`/admin/agency/blog/${post.id}/edit`}
                className="rounded-md p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </Link>
              <form action={handleDelete.bind(null, post.id)}>
                <button
                  type="submit"
                  className="rounded-md p-2 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="py-12 text-center text-white/30">No blog posts yet</div>
        )}
      </div>
    </div>
  );
}
