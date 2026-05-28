"use client";

import { useState } from "react";
import { Input } from "@syntaxure/ui";
import { Save, Plus, Trash2, ArrowLeft } from "lucide-react";
import { saveAboutContent, type AboutContent } from "@/app/actions/content";
import Link from "next/link";

export function AboutEditor({
  initialContent,
}: {
  initialContent: AboutContent | null;
}) {
  const [content, setContent] = useState<AboutContent>(
    initialContent ?? DEFAULT_ABOUT_CONTENT,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await saveAboutContent(content);
      if (result.success) {
        setMessage({ type: "success", text: "About page content saved." });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to save.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const hero = content.hero;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/agency/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">About Page Content</h1>
          <p className="text-sm text-white/50">
            Edit the public About Us page content
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
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

      {/* Hero Section */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Hero Section
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Tagline
            </label>
            <Input
              value={hero.tagline}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, tagline: e.target.value },
                }))
              }
              className="w-full"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Heading Line 1
              </label>
              <Input
                value={hero.heading1}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, heading1: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Heading Line 2
              </label>
              <Input
                value={hero.heading2}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, heading2: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Description
            </label>
            <textarea
              value={hero.description}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, description: e.target.value },
                }))
              }
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Sub-Description
            </label>
            <textarea
              value={hero.subDescription}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, subDescription: e.target.value },
                }))
              }
              rows={2}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70">
            Stats
          </h2>
          <button
            onClick={() =>
              setContent((prev) => ({
                ...prev,
                stats: [...prev.stats, { label: "", value: "" }],
              }))
            }
            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Stat
          </button>
        </div>
        <div className="space-y-3">
          {content.stats.map((stat, i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-white/40 mb-1">
                  Label
                </label>
                <Input
                  value={stat.label}
                  onChange={(e) =>
                    setContent((prev) => {
                      const stats = prev.stats.map((s, j) =>
                        j === i ? { ...s, label: e.target.value } : s,
                      );
                      return { ...prev, stats };
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-white/40 mb-1">
                  Value
                </label>
                <Input
                  value={stat.value}
                  onChange={(e) =>
                    setContent((prev) => {
                      const stats = prev.stats.map((s, j) =>
                        j === i ? { ...s, value: e.target.value } : s,
                      );
                      return { ...prev, stats };
                    })
                  }
                  className="w-full"
                />
              </div>
              <button
                onClick={() =>
                  setContent((prev) => ({
                    ...prev,
                    stats: prev.stats.filter((_, j) => j !== i),
                  }))
                }
                disabled={content.stats.length <= 1}
                className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Founder Section */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Founder Card
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Name</label>
            <Input
              value={content.founder.name}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  founder: { ...prev.founder, name: e.target.value },
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Title</label>
            <Input
              value={content.founder.title}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  founder: { ...prev.founder, title: e.target.value },
                }))
              }
              className="w-full"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-white/60 mb-1.5">Bio</label>
            <textarea
              value={content.founder.bio}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  founder: { ...prev.founder, bio: e.target.value },
                }))
              }
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Image URL
            </label>
            <Input
              value={content.founder.image}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  founder: { ...prev.founder, image: e.target.value },
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Email</label>
            <Input
              value={content.founder.email}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  founder: { ...prev.founder, email: e.target.value },
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Location
            </label>
            <Input
              value={content.founder.location}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  founder: { ...prev.founder, location: e.target.value },
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Availability
            </label>
            <Input
              value={content.founder.availability}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  founder: { ...prev.founder, availability: e.target.value },
                }))
              }
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Tech Stack
        </h2>
        <p className="text-xs text-white/40 mb-4">
          Enter comma-separated list of technologies for each category.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(content.techStack).map(([category, techs]) => (
            <div key={category}>
              <label className="block text-sm capitalize text-white/60 mb-1.5">
                {category}
              </label>
              <Input
                value={techs.join(", ")}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    techStack: {
                      ...prev.techStack,
                      [category]: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                className="w-full"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70">
            Values
          </h2>
          <button
            onClick={() =>
              setContent((prev) => ({
                ...prev,
                values: [...prev.values, { title: "", description: "" }],
              }))
            }
            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Value
          </button>
        </div>
        <div className="space-y-4">
          {content.values.map((val, i) => (
            <div
              key={i}
              className="rounded-md border border-white/[0.06] bg-white/[0.01] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      Title
                    </label>
                    <Input
                      value={val.title}
                      onChange={(e) =>
                        setContent((prev) => {
                          const values = prev.values.map((v, j) =>
                            j === i ? { ...v, title: e.target.value } : v,
                          );
                          return { ...prev, values };
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      Description
                    </label>
                    <textarea
                      value={val.description}
                      onChange={(e) =>
                        setContent((prev) => {
                          const values = prev.values.map((v, j) =>
                            j === i ? { ...v, description: e.target.value } : v,
                          );
                          return { ...prev, values };
                        })
                      }
                      rows={2}
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      values: prev.values.filter((_, j) => j !== i),
                    }))
                  }
                  disabled={content.values.length <= 1}
                  className="mt-1 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Assets Section */}
      <section className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Brand Assets
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Asset Title
            </label>
            <Input
              value={content.brandAssets.title}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  brandAssets: {
                    ...prev.brandAssets,
                    title: e.target.value,
                  },
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Description
            </label>
            <Input
              value={content.brandAssets.description}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  brandAssets: {
                    ...prev.brandAssets,
                    description: e.target.value,
                  },
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Image URL
            </label>
            <Input
              value={content.brandAssets.image}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  brandAssets: {
                    ...prev.brandAssets,
                    image: e.target.value,
                  },
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Download URL
            </label>
            <Input
              value={content.brandAssets.downloadUrl}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  brandAssets: {
                    ...prev.brandAssets,
                    downloadUrl: e.target.value,
                  },
                }))
              }
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Bottom Save */}
      <div className="flex justify-end border-t border-white/5 pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

const DEFAULT_ABOUT_CONTENT: AboutContent = {
  hero: {
    tagline: "// About.studio",
    heading1: "We Build Systems",
    heading2: "That Launch",
    description:
      "Syntaxure Labs is a new-breed development agency architecting high-performance systems for ambitious startups. We don't just write code — we partner with founders to turn 'Zero to One' ideas into scalable reality.",
    subDescription:
      "Est. 2025. Built on 5+ years of the founder's hands-on experience shipping production systems across SaaS, AI, and enterprise platforms.",
  },
  stats: [
    { label: "Niche Focus", value: "Specialized" },
    { label: "Founder Exp", value: "5+" },
    { label: "Dedication", value: "100%" },
    { label: "Uptime SLA", value: "99.9%" },
  ],
  founder: {
    name: "Jeff Edrick Martinez",
    title: "Lead Architect & Founder",
    bio: "Full-stack engineer with 5+ years building production systems. Specializing in Next.js, cloud architecture, and AI integration. Previously worked on projects for education, e-commerce, and SaaS clients.",
    image: "/profilepic.webp",
    email: "jeff@syntaxure.dev",
    location: "Iloilo City, Philippines",
    availability: "Available for Q1 2026 projects",
  },
  techStack: {
    frontend: ["Next.js", "React", "TypeScript", "Tailwind CSS", "GSAP"],
    backend: ["Node.js", "Laravel", "PostgreSQL", "Firebase"],
    cloud: ["Vercel", "AWS", "Cloudflare", "Docker"],
    ai: ["OpenAI", "Claude", "Langchain", "Pinecone"],
  },
  values: [
    {
      title: "Clarity Over Complexity",
      description:
        "We write code that's readable, maintainable, and built to last. No clever hacks — just clean architecture.",
    },
    {
      title: "Fixed Investment, No Surprises",
      description:
        "We scope properly, quote fairly, and deliver on time. You know exactly what you're getting before we start.",
    },
    {
      title: "Partnership, Not Vendorship",
      description:
        "We invest in your success. Our best clients become long-term partners who come back project after project.",
    },
  ],
  brandAssets: {
    title: "Digital Business Card",
    description: "High-resolution PNG",
    image: "/syntaxure-business-card.png",
    downloadUrl: "/syntaxure-business-card.png",
  },
};
