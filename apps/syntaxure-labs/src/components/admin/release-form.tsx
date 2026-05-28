"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createRelease, updateRelease } from "@/app/actions/releases";

interface ReleaseFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    version?: string | null;
    date: string;
    type: "tool" | "update" | "patch";
    description: string;
    link?: string | null;
    tags?: string[] | null;
    is_featured: boolean;
  };
}

export function ReleaseForm({ mode, initialData }: ReleaseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [version, setVersion] = useState(initialData?.version ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [type, setType] = useState<"tool" | "update" | "patch">(
    initialData?.type ?? "update"
  );
  const [link, setLink] = useState(initialData?.link ?? "");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (initialData?.date) {
      setDate(initialData.date);
    }
  }, [initialData]);
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        title,
        version: version || null,
        description,
        type,
        link: link || null,
        tags: tags.filter(Boolean),
        is_featured: isFeatured,
        date: date!,
      };

      const result =
        mode === "create"
          ? await createRelease(payload)
          : await updateRelease(initialData!.id, payload);

      if (result.success) {
        toast.success(mode === "create" ? "Release created" : "Release updated");
        router.push("/admin/community");
        router.refresh();
      } else {
        toast.error(result.error || "Something went wrong");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto py-4">
      <Link
        href="/admin/community"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Community
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">
          {mode === "create" ? "New Release" : "Edit Release"}
        </h1>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mode === "create" ? "Create" : "Save"}
        </button>
      </div>

      <div className="mt-8 space-y-6">
        <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-semibold text-white">Release Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                placeholder="Prism Context Engine v2.0"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                Version
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                placeholder="2.0.0"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
                Type
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "tool" | "update" | "patch")
                }
                className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
              >
                <option value="update">Update</option>
                <option value="tool">Tool</option>
                <option value="patch">Patch</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
              placeholder="What's new in this release?"
            />
          </div>
          <div className="mt-4">
            <label className="block font-mono text-xs uppercase tracking-wider text-white/40">
              Link (optional)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
              placeholder="https://github.com/..."
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full border border-white/10 bg-white/5 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/30 after:transition-all peer-checked:bg-cyan-500/30 peer-checked:border-cyan-500/50 peer-checked:after:translate-x-full peer-checked:after:bg-cyan-400" />
            </label>
            <span className="text-sm text-white/70">Featured release</span>
          </div>
        </section>

        <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Tags</h2>
            <button
              type="button"
              onClick={() => setTags([...tags, ""])}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              + Add Tag
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {tags.map((tag, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => {
                    const next = [...tags];
                    next[i] = e.target.value;
                    setTags(next);
                  }}
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                  placeholder="e.g. prism, release, ai"
                />
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((_, j) => j !== i))}
                  className="p-1 text-red-400/60 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </form>
  );
}
