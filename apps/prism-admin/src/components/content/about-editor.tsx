"use client";

import { useState, useEffect } from "react";
import { Input, ImageUpload } from "@syntaxure/ui";
import { Save, Plus, Trash2, ArrowLeft, LayoutList, LayoutGrid } from "lucide-react";
import { saveAboutContent, type AboutContent } from "@/app/actions/content";
import { uploadToStorage } from "@/app/actions/storage";
import Link from "next/link";

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "stats", label: "Stats" },
  { id: "founder-card", label: "Founder" },
  { id: "mission-vision", label: "Mission" },
  { id: "kwadra-tbi", label: "KWADRA" },
  { id: "founders", label: "Founders" },
  { id: "team", label: "Team" },
  { id: "tech-stack", label: "Tech" },
  { id: "values", label: "Values" },
  { id: "brand-assets", label: "Brand" },
  { id: "section-headers", label: "Headers" },
];

function SectionNav() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 },
    );

    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky top-0 z-30 -mx-6 mb-6 border-b border-white/[0.06] bg-[var(--bg-primary)] px-6 py-2 backdrop-blur-sm">
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`shrink-0 rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              active === s.id
                ? "bg-amber-500/20 text-amber-400"
                : "text-white/40 hover:text-white/60 hover:bg-white/5"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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
  const [foundersView, setFoundersView] = useState<"list" | "grid">("list");

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

      <SectionNav />

      {/* Hero Section */}
      <section id="hero" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
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
      <section id="stats" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
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
      <section id="founder-card" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
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
            <ImageUpload
              currentImage={content.founder.image || null}
              onUpload={async (file) => {
                const result = await uploadToStorage(file, "avatars");
                if (result.success && result.url) {
                  setContent((prev) => ({
                    ...prev,
                    founder: { ...prev.founder, image: result.url! },
                  }));
                  return { url: result.url };
                }
                return { url: "", error: result.error };
              }}
              onRemove={async () => {
                setContent((prev) => ({
                  ...prev,
                  founder: { ...prev.founder, image: "" },
                }));
                return { success: true };
              }}
              label="Founder Image"
              previewHeight="h-32"
              crop={true}
              cropAspect={1}
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

      {/* Mission & Vision Section */}
      <section id="mission-vision" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Mission &amp; Vision
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Executive Summary
            </label>
            <textarea
              value={content.missionVision.executiveSummary}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  missionVision: {
                    ...prev.missionVision,
                    executiveSummary: e.target.value,
                  },
                }))
              }
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Mission
            </label>
            <textarea
              value={content.missionVision.mission}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  missionVision: {
                    ...prev.missionVision,
                    mission: e.target.value,
                  },
                }))
              }
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Vision
            </label>
            <textarea
              value={content.missionVision.vision}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  missionVision: {
                    ...prev.missionVision,
                    vision: e.target.value,
                  },
                }))
              }
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* KWADRA TBI Section */}
      <section id="kwadra-tbi" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70">
            KWADRA TBI
          </h2>
          <button
            onClick={() =>
              setContent((prev) => ({
                ...prev,
                kwadraTbi: {
                  ...prev.kwadraTbi,
                  badges: [...prev.kwadraTbi.badges, ""],
                },
              }))
            }
            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Badge
          </button>
        </div>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Heading
            </label>
            <Input
              value={content.kwadraTbi.heading}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  kwadraTbi: { ...prev.kwadraTbi, heading: e.target.value },
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Description
            </label>
            <textarea
              value={content.kwadraTbi.description}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  kwadraTbi: { ...prev.kwadraTbi, description: e.target.value },
                }))
              }
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Badges
            </label>
            <div className="space-y-2">
              {content.kwadraTbi.badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={badge}
                    onChange={(e) =>
                      setContent((prev) => {
                        const badges = prev.kwadraTbi.badges.map((b, j) =>
                          j === i ? e.target.value : b,
                        );
                        return {
                          ...prev,
                          kwadraTbi: { ...prev.kwadraTbi, badges },
                        };
                      })
                    }
                    className="flex-1"
                  />
                  <button
                    onClick={() =>
                      setContent((prev) => ({
                        ...prev,
                        kwadraTbi: {
                          ...prev.kwadraTbi,
                          badges: prev.kwadraTbi.badges.filter(
                            (_, j) => j !== i,
                          ),
                        },
                      }))
                    }
                    disabled={content.kwadraTbi.badges.length <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section id="founders" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70">
            Founders
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-white/10 bg-white/5">
              <button
                onClick={() => setFoundersView("list")}
                className={`flex h-7 w-7 items-center justify-center rounded-l-md transition-colors ${
                  foundersView === "list"
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-white/40 hover:text-white/60"
                }`}
                title="List view"
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setFoundersView("grid")}
                className={`flex h-7 w-7 items-center justify-center rounded-r-md transition-colors ${
                  foundersView === "grid"
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-white/40 hover:text-white/60"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  founders: [
                    ...prev.founders,
                    {
                      name: "",
                      title: "",
                      bio: "",
                      image: "",
                      email: "",
                      location: "",
                    },
                  ],
                }))
              }
              className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add Founder
            </button>
          </div>
        </div>

        {/* List View */}
        {foundersView === "list" && (
          <div className="space-y-2">
            {content.founders.map((founder, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-white/[0.06] bg-white/[0.01] p-3 hover:border-white/10 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white overflow-hidden">
                  {founder.image ? (
                    <img src={founder.image} alt={founder.name} className="h-full w-full object-cover" />
                  ) : (
                    founder.name?.charAt(0)?.toUpperCase() || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {founder.name || "Untitled Founder"}
                  </div>
                  <div className="text-xs text-white/40 truncate">
                    {founder.title || "No title"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const el = document.getElementById(`founder-detail-${i}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="rounded p-1.5 text-white/40 hover:text-amber-400 hover:bg-white/5 transition-colors"
                    title="Edit"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setContent((prev) => ({
                        ...prev,
                        founders: prev.founders.filter((_, j) => j !== i),
                      }))
                    }
                    className="rounded p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {content.founders.length === 0 && (
              <div className="py-8 text-center text-sm text-white/30">
                No founders added yet. Click &quot;Add Founder&quot; to get started.
              </div>
            )}
          </div>
        )}

        {/* Grid View (original detail cards) */}
        {foundersView === "grid" && (
          <div className="space-y-4">
          {content.founders.map((founder, i) => (
            <div
              key={i}
              id={`founder-detail-${i}`}
              className="rounded-md border border-white/[0.06] bg-white/[0.01] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">
                        Name
                      </label>
                      <Input
                        value={founder.name}
                        onChange={(e) =>
                          setContent((prev) => {
                            const founders = prev.founders.map((f, j) =>
                              j === i ? { ...f, name: e.target.value } : f,
                            );
                            return { ...prev, founders };
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">
                        Title
                      </label>
                      <Input
                        value={founder.title}
                        onChange={(e) =>
                          setContent((prev) => {
                            const founders = prev.founders.map((f, j) =>
                              j === i ? { ...f, title: e.target.value } : f,
                            );
                            return { ...prev, founders };
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={founder.bio}
                      onChange={(e) =>
                        setContent((prev) => {
                          const founders = prev.founders.map((f, j) =>
                            j === i ? { ...f, bio: e.target.value } : f,
                          );
                          return { ...prev, founders };
                        })
                      }
                      rows={2}
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">
                          Email
                        </label>
                        <Input
                          value={founder.email}
                          onChange={(e) =>
                            setContent((prev) => {
                              const founders = prev.founders.map((f, j) =>
                                j === i ? { ...f, email: e.target.value } : f,
                              );
                              return { ...prev, founders };
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">
                          Location
                        </label>
                        <Input
                          value={founder.location}
                          onChange={(e) =>
                            setContent((prev) => {
                              const founders = prev.founders.map((f, j) =>
                                j === i ? { ...f, location: e.target.value } : f,
                              );
                              return { ...prev, founders };
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <ImageUpload
                        currentImage={founder.image || null}
                        onUpload={async (file) => {
                          const result = await uploadToStorage(file, "avatars");
                          if (result.success && result.url) {
                            setContent((prev) => {
                              const founders = prev.founders.map((f, j) =>
                                j === i ? { ...f, image: result.url! } : f,
                              );
                              return { ...prev, founders };
                            });
                            return { url: result.url };
                          }
                          return { url: "", error: result.error };
                        }}
                        onRemove={async () => {
                          setContent((prev) => {
                            const founders = prev.founders.map((f, j) =>
                              j === i ? { ...f, image: "" } : f,
                            );
                            return { ...prev, founders };
                          });
                          return { success: true };
                        }}
                        label="Founder Image"
                        previewHeight="h-32"
                        crop={true}
                        cropAspect={1}
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      founders: prev.founders.filter((_, j) => j !== i),
                    }))
                  }
                  disabled={content.founders.length <= 1}
                  className="mt-1 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </section>

      {/* Team Section */}
      <section id="team" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70">
            Team
          </h2>
          <button
            onClick={() =>
              setContent((prev) => ({
                ...prev,
                team: [
                  ...prev.team,
                  { name: "", title: "", role: "", bio: "", image: "" },
                ],
              }))
            }
            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Team Member
          </button>
        </div>
        <p className="text-xs text-white/40 mb-4">
          Only members with real data will be shown on the public page.
        </p>
        <div className="space-y-4">
          {content.team.map((member, i) => (
            <div
              key={i}
              className="rounded-md border border-white/[0.06] bg-white/[0.01] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">
                        Name
                      </label>
                      <Input
                        value={member.name}
                        onChange={(e) =>
                          setContent((prev) => {
                            const team = prev.team.map((t, j) =>
                              j === i ? { ...t, name: e.target.value } : t,
                            );
                            return { ...prev, team };
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">
                        Title
                      </label>
                      <Input
                        value={member.title}
                        onChange={(e) =>
                          setContent((prev) => {
                            const team = prev.team.map((t, j) =>
                              j === i ? { ...t, title: e.target.value } : t,
                            );
                            return { ...prev, team };
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">
                        Role
                      </label>
                      <Input
                        value={member.role}
                        onChange={(e) =>
                          setContent((prev) => {
                            const team = prev.team.map((t, j) =>
                              j === i ? { ...t, role: e.target.value } : t,
                            );
                            return { ...prev, team };
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={member.bio}
                        onChange={(e) =>
                          setContent((prev) => {
                            const team = prev.team.map((t, j) =>
                              j === i ? { ...t, bio: e.target.value } : t,
                            );
                            return { ...prev, team };
                          })
                        }
                        rows={2}
                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <ImageUpload
                        currentImage={member.image || null}
                        onUpload={async (file) => {
                          const result = await uploadToStorage(file, "avatars");
                          if (result.success && result.url) {
                            setContent((prev) => {
                              const team = prev.team.map((t, j) =>
                                j === i ? { ...t, image: result.url! } : t,
                              );
                              return { ...prev, team };
                            });
                            return { url: result.url };
                          }
                          return { url: "", error: result.error };
                        }}
                        onRemove={async () => {
                          setContent((prev) => {
                            const team = prev.team.map((t, j) =>
                              j === i ? { ...t, image: "" } : t,
                            );
                            return { ...prev, team };
                          });
                          return { success: true };
                        }}
                        label="Team Member Image"
                        previewHeight="h-32"
                        crop={true}
                        cropAspect={1}
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      team: prev.team.filter((_, j) => j !== i),
                    }))
                  }
                  disabled={content.team.length <= 1}
                  className="mt-1 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech-stack" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
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
      <section id="values" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
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
      <section id="brand-assets" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
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
            <ImageUpload
              currentImage={content.brandAssets.image || null}
              onUpload={async (file) => {
                const result = await uploadToStorage(file, "avatars");
                if (result.success && result.url) {
                  setContent((prev) => ({
                    ...prev,
                    brandAssets: {
                      ...prev.brandAssets,
                      image: result.url!,
                    },
                  }));
                  return { url: result.url };
                }
                return { url: "", error: result.error };
              }}
              onRemove={async () => {
                setContent((prev) => ({
                  ...prev,
                  brandAssets: {
                    ...prev.brandAssets,
                    image: "",
                  },
                }));
                return { success: true };
              }}
              label="Brand Asset Image"
              previewHeight="h-32"
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

      {/* Section Headers */}
      <section id="section-headers" className="rounded-md border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-amber-400/70 mb-4">
          Section Headers
        </h2>
        <p className="text-sm text-white/40 mb-6">
          Edit decorative labels and section headings visible on the About page.
        </p>
        <div className="grid gap-6">
          {/* Founder Card Label */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Founder Card Label
            </label>
            <Input
              value={content.sectionHeaders?.founder?.cardLabel ?? "// Founder.log"}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  sectionHeaders: {
                    ...prev.sectionHeaders,
                    founder: { cardLabel: e.target.value },
                  },
                }))
              }
              className="w-full"
            />
          </div>

          {/* Kwadra TBI Label */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Kwadra TBI Label
            </label>
            <Input
              value={content.sectionHeaders?.kwadraTbi?.label ?? "// Startup Incubator"}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  sectionHeaders: {
                    ...prev.sectionHeaders,
                    kwadraTbi: { label: e.target.value },
                  },
                }))
              }
              className="w-full"
            />
          </div>

          {/* Mission & Vision */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Mission & Vision Label
              </label>
              <Input
                value={content.sectionHeaders?.missionVision?.label ?? "// Mission & Vision"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      missionVision: {
                        ...prev.sectionHeaders?.missionVision,
                        label: e.target.value,
                        missionLabel: prev.sectionHeaders?.missionVision?.missionLabel ?? "Mission",
                        visionLabel: prev.sectionHeaders?.missionVision?.visionLabel ?? "Vision",
                      },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Mission Card Heading
              </label>
              <Input
                value={content.sectionHeaders?.missionVision?.missionLabel ?? "Mission"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      missionVision: {
                        ...prev.sectionHeaders?.missionVision,
                        label: prev.sectionHeaders?.missionVision?.label ?? "// Mission & Vision",
                        missionLabel: e.target.value,
                        visionLabel: prev.sectionHeaders?.missionVision?.visionLabel ?? "Vision",
                      },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Vision Card Heading
              </label>
              <Input
                value={content.sectionHeaders?.missionVision?.visionLabel ?? "Vision"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      missionVision: {
                        ...prev.sectionHeaders?.missionVision,
                        label: prev.sectionHeaders?.missionVision?.label ?? "// Mission & Vision",
                        missionLabel: prev.sectionHeaders?.missionVision?.missionLabel ?? "Mission",
                        visionLabel: e.target.value,
                      },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Founders */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Founders Label
              </label>
              <Input
                value={content.sectionHeaders?.founders?.label ?? "// Founders"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      founders: {
                        label: e.target.value,
                        subtitle: prev.sectionHeaders?.founders?.subtitle ?? "The people behind Syntaxure Labs.",
                      },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Founders Subtitle
              </label>
              <Input
                value={content.sectionHeaders?.founders?.subtitle ?? "The people behind Syntaxure Labs."}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      founders: {
                        label: prev.sectionHeaders?.founders?.label ?? "// Founders",
                        subtitle: e.target.value,
                      },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Tech Stack */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Tech Stack Label
              </label>
              <Input
                value={content.sectionHeaders?.techStack?.label ?? "// Tech_Stack"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      techStack: {
                        label: e.target.value,
                        subtitle: prev.sectionHeaders?.techStack?.subtitle ?? "We use modern, battle-tested technologies.",
                      },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Tech Stack Subtitle
              </label>
              <Input
                value={content.sectionHeaders?.techStack?.subtitle ?? "We use modern, battle-tested technologies."}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      techStack: {
                        label: prev.sectionHeaders?.techStack?.label ?? "// Tech_Stack",
                        subtitle: e.target.value,
                      },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Team */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Team Label
              </label>
              <Input
                value={content.sectionHeaders?.team?.label ?? "// Team"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      team: {
                        label: e.target.value,
                        subtitle: prev.sectionHeaders?.team?.subtitle ?? "Meet the leadership team behind Syntaxure Labs.",
                      },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Team Subtitle
              </label>
              <Input
                value={content.sectionHeaders?.team?.subtitle ?? "Meet the leadership team behind Syntaxure Labs."}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      team: {
                        label: prev.sectionHeaders?.team?.label ?? "// Team",
                        subtitle: e.target.value,
                      },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Values & Brand Assets */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Values Section Heading
              </label>
              <Input
                value={content.sectionHeaders?.values?.heading ?? "How We Work"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      values: { heading: e.target.value },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Brand Assets Heading
              </label>
              <Input
                value={content.sectionHeaders?.brandAssets?.heading ?? "Brand Assets"}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    sectionHeaders: {
                      ...prev.sectionHeaders,
                      brandAssets: { heading: e.target.value },
                    },
                  }))
                }
                className="w-full"
              />
            </div>
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
    { label: "Infrastructure", value: "High-Avail" },
  ],
  founder: {
    name: "Jeff Edrick Martinez",
    title: "Lead Architect & Founder",
    bio: "Full-stack engineer with 5+ years building production systems. Specializing in Next.js, cloud architecture, and AI integration. Previously worked on projects for education, e-commerce, and SaaS clients.",
    image: "/profilepic.webp",
    email: "jeff@syntaxure.dev",
    location: "Iloilo City, Philippines",
    availability: "Currently accepting new projects",
  },
  missionVision: {
    executiveSummary:
      "Syntaxure Labs is a technology company building AI-powered software ecosystems, enterprise solutions, and context intelligence platforms through its flagship product, Prism Context Engine.",
    mission:
      "To serve as the strategic technical foundation for high-impact business concepts, transforming venture-ready ideas into sustainable, scalable software ecosystems through AI governance.",
    vision:
      "To serve as the foundational technological backbone of the Southeast Asian startup economy, empowering enterprises through scalable AI infrastructure and becoming the premier provider of enterprise-grade software solutions by 2030.",
  },
  kwadraTbi: {
    heading: "Kwadra TBI Cohort 5",
    description:
      "Syntaxure Labs is proud to be part of Kwadra TBI Cohort 5 — a startup incubation program by the Iloilo Provincial Government's Kwadra Care initiative. This program supports innovation-driven startups with mentorship, funding access, and go-to-market strategy.",
    badges: [
      "Startup Incubation",
      "Mentorship",
      "Funding Access",
      "Go-to-Market Strategy",
    ],
  },
  founders: [
    {
      name: "Jeff Edrick Martinez",
      title: "Lead Architect & Founder",
      bio: "Full-stack engineer with 5+ years building production systems. Specializing in Next.js, cloud architecture, and AI integration. Previously worked on projects for education, e-commerce, and SaaS clients.",
      image: "/profilepic.webp",
      email: "jeff@syntaxure.dev",
      location: "Iloilo City, Philippines",
    },
  ],
  team: [
    {
      name: "Jeff Edrick Martinez",
      title: "Chief Executive Officer",
      role: "CEO",
      bio: "Visionary leader driving the company strategy and growth.",
      image: "/profilepic.webp",
    },
  ],
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
  sectionHeaders: {
    founder: { cardLabel: "// Founder.log" },
    kwadraTbi: { label: "// Startup Incubator" },
    missionVision: {
      label: "// Mission & Vision",
      missionLabel: "Mission",
      visionLabel: "Vision",
    },
    founders: {
      label: "// Founders",
      subtitle: "The people behind Syntaxure Labs.",
    },
    techStack: {
      label: "// Tech_Stack",
      subtitle:
        "We use modern, battle-tested technologies. No legacy frameworks, no tech debt — just clean, scalable architecture.",
    },
    team: {
      label: "// Team",
      subtitle: "Meet the leadership team behind Syntaxure Labs.",
    },
    values: { heading: "How We Work" },
    brandAssets: { heading: "Brand Assets" },
  },
};
