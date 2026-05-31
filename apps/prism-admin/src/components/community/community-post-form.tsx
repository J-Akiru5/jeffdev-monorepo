"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, X, Plus } from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  createCommunityPost,
  updateCommunityPost,
  type CommunityPostInput,
  type CommunityPost,
  type CommunityMember,
} from "@/app/actions/community";

interface CommunityPostFormProps {
  initialData?: CommunityPost;
  mode: "create" | "edit";
  members?: CommunityMember[];
}

interface PostFormState {
  title: string;
  body: string;
  image_url: string;
  category: "discussion" | "showcase" | "question";
  tags: string[];
  author_id: string;
  is_pinned: boolean;
  is_published: boolean;
}

const DEFAULT_FORM: PostFormState = {
  title: "",
  body: "",
  image_url: "",
  category: "discussion",
  tags: [],
  author_id: "",
  is_pinned: false,
  is_published: true,
};

function toFormState(data: CommunityPost): PostFormState {
  return {
    title: data.title,
    body: data.body,
    image_url: data.image_url ?? "",
    category: data.category,
    tags: data.tags ?? [],
    author_id: data.author_id ?? "",
    is_pinned: data.is_pinned,
    is_published: data.is_published,
  };
}

function toPayload(form: PostFormState): CommunityPostInput {
  return {
    title: form.title,
    body: form.body,
    image_url: form.image_url || null,
    category: form.category,
    tags: form.tags,
    author_id: form.author_id || null,
    is_pinned: form.is_pinned,
    is_published: form.is_published,
  };
}

const postCategories = [
  { value: "discussion", label: "Discussion", description: "General discussion or questions" },
  { value: "showcase", label: "Showcase", description: "Show off your project or work" },
  { value: "question", label: "Question", description: "Ask the community for help" },
] as const;

export function CommunityPostForm({ initialData, mode, members = [] }: CommunityPostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<PostFormState>(
    initialData ? toFormState(initialData) : DEFAULT_FORM
  );
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload = toPayload(form);
      const id = initialData && mode === "edit" ? initialData.id : undefined;

      const result = id
        ? await updateCommunityPost(id, payload)
        : await createCommunityPost(payload);

      if (result.success) {
        setMessage({ type: "success", text: mode === "edit" ? "Post updated." : "Post created." });
        setTimeout(() => router.push("/admin/agency/community"), 1000);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save." });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !form.tags.includes(trimmed)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/agency/community"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Community
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {mode === "edit" ? "Edit Post" : "Create Post"}
          </h1>
          <p className="text-sm text-white/50">
            {mode === "edit" ? "Update community post" : "Share something with the community"}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !form.title || !form.body}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : mode === "edit" ? "Update Post" : "Create Post"}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Content */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Post Content
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Title <span className="text-amber-400">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
              placeholder="What's on your mind?"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Body <span className="text-amber-400">*</span>
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              rows={8}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none resize-y"
              placeholder="Write your post content here..."
            />
          </div>
        </div>
      </section>

      {/* Cover Image */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Cover Image
        </h2>
        <ImageUpload
          bucket="community_posts"
          currentUrl={form.image_url}
          onUpload={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
          onDelete={() => setForm((prev) => ({ ...prev, image_url: "" }))}
          label="Post Cover Image"
        />
      </section>

      {/* Settings */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value as "discussion" | "showcase" | "question",
                }))
              }
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
            >
              {postCategories.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#030303]">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {members.length > 0 && (
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Author</label>
              <select
                value={form.author_id}
                onChange={(e) => setForm((prev) => ({ ...prev, author_id: e.target.value }))}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              >
                <option value="" className="bg-[#030303]">
                  No author
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#030303]">
                    {m.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_pinned: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="h-6 w-11 rounded-full border border-white/10 bg-white/5 peer-checked:bg-amber-500/30 peer-checked:border-amber-500/50 transition-colors" />
                <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white/30 peer-checked:bg-amber-400 peer-checked:translate-x-5 transition-all shadow-sm" />
              </div>
              <span className="text-sm text-white/80">Pin this post</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="h-6 w-11 rounded-full border border-white/10 bg-white/5 peer-checked:bg-amber-500/30 peer-checked:border-amber-500/50 transition-colors" />
                <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white/30 peer-checked:bg-amber-400 peer-checked:translate-x-5 transition-all shadow-sm" />
              </div>
              <span className="text-sm text-white/80">Published</span>
            </label>
          </div>
        </div>
      </section>

      {/* Tags */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Tags
        </h2>
        <div className="flex gap-2 mb-3">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
            placeholder="Type a tag and press Enter"
          />
          <button
            onClick={addTag}
            className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
        {form.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30">No tags added yet.</p>
        )}
      </section>

      {/* Bottom Save */}
      <div className="flex justify-end border-t border-white/5 pt-6">
        <button
          onClick={handleSave}
          disabled={saving || !form.title || !form.body}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : mode === "edit" ? "Update Post" : "Create Post"}
        </button>
      </div>
    </div>
  );
}
