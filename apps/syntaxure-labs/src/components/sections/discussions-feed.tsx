"use client";

/**
 * Discussions Feed Component
 * --------------------------
 * Renders community posts as interactive cards with:
 * - Category filtering (All, Showcase, Discussion, Question)
 * - Author profile badges with role indicators
 * - Pinned post highlighting
 * - Inline body expansion
 * - Tags and relative timestamps
 * - Premium stealth-luxury aesthetic
 */

import { useState } from "react";
import {
  MessageSquare,
  Lightbulb,
  HelpCircle,
  Pin,
  User,
  ChevronDown,
  ChevronUp,
  Tag,
  MessageCircle,
} from "lucide-react";
import { cn } from "@syntaxure/ui";
import { formatDistanceToNow } from "date-fns";
import type { CommunityPostWithAuthor } from "@/app/actions/community";

interface DiscussionsFeedProps {
  posts: CommunityPostWithAuthor[];
}

const categoryConfig = {
  discussion: {
    icon: MessageSquare,
    label: "Discussion",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
  },
  showcase: {
    icon: Lightbulb,
    label: "Showcase",
    color: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
  },
  question: {
    icon: HelpCircle,
    label: "Question",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
} as const;

type CategoryKey = keyof typeof categoryConfig;

const roleColors: Record<string, string> = {
  developer: "text-cyan-400",
  founder: "text-purple-400",
  cto: "text-amber-400",
  designer: "text-pink-400",
  researcher: "text-emerald-400",
  other: "text-white/50",
};

function PostCard({ post }: { post: CommunityPostWithAuthor }) {
  const [expanded, setExpanded] = useState(false);
  const config = categoryConfig[post.category as CategoryKey] ?? categoryConfig.discussion;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative rounded-md border bg-white/[0.02] p-6 transition-all duration-300",
        config.border,
        "hover:bg-white/[0.04]",
        "hover:shadow-[0_0_30px_rgba(6,182,212,0.06)]",
        post.is_pinned && "border-amber-500/30 bg-amber-500/[0.03]",
      )}
    >
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full border border-amber-500/30 bg-[#050505] px-2.5 py-0.5">
          <Pin className="h-3 w-3 text-amber-400" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-amber-400">
            Pinned
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border",
            config.border,
            config.bg,
          )}
        >
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{post.title}</h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                config.border,
                config.bg,
                config.color,
              )}
            >
              {config.label}
            </span>
          </div>

          {/* Author & Timestamp */}
          <div className="mt-2 flex items-center gap-3">
            {post.author ? (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <User className="h-3.5 w-3.5 text-white/50" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white/80">
                    {post.author.full_name}
                  </span>
                  {post.author.primary_role && (
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-wider",
                        roleColors[post.author.primary_role] ?? "text-white/40",
                      )}
                    >
                      {post.author.primary_role}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  {post.author.github_username && (
                    <a
                      href={`https://github.com/${post.author.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 transition-colors hover:text-white/60"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  )}
                  {post.author.discord_handle && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-sm text-white/30">Anonymous</span>
            )}
            <span className="text-xs text-white/30">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Body Preview / Expanded */}
          <div className="mt-3">
            {expanded ? (
              <div className="text-sm leading-relaxed text-white/60 whitespace-pre-wrap">
                {post.body}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-white/60 line-clamp-3">
                {post.body}
              </p>
            )}
            {post.body.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1 text-xs text-cyan-400/70 transition-colors hover:text-cyan-400"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Read more
                  </>
                )}
              </button>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Tag className="h-3 w-3 text-white/30" />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DiscussionsFeed({ posts }: DiscussionsFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredPosts = posts.filter((post) => {
    if (selectedCategory === "all") return true;
    return post.category === selectedCategory;
  });

  const pinnedPosts = filteredPosts.filter((p) => p.is_pinned);
  const regularPosts = filteredPosts.filter((p) => !p.is_pinned);

  const categories = [
    { id: "all", label: "All Posts", count: posts.length },
    {
      id: "discussion",
      label: "Discussions",
      count: posts.filter((p) => p.category === "discussion").length,
    },
    {
      id: "showcase",
      label: "Showcases",
      count: posts.filter((p) => p.category === "showcase").length,
    },
    {
      id: "question",
      label: "Questions",
      count: posts.filter((p) => p.category === "question").length,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all",
              selectedCategory === cat.id
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60",
            )}
          >
            {cat.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                selectedCategory === cat.id
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "bg-white/5 text-white/30",
              )}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-amber-400">
              {"// Pinned"}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
          </div>
          <div className="space-y-4">
            {pinnedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Regular Posts */}
      <section>
        {pinnedPosts.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider text-white/40">
              {"// Recent"}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
        )}
        {regularPosts.length > 0 ? (
          <div className="space-y-4">
            {regularPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          filteredPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] py-16">
              <MessageSquare className="h-8 w-8 text-white/20" />
              <p className="mt-3 text-sm text-white/30">
                No posts in this category yet.
              </p>
            </div>
          )
        )}
      </section>
    </div>
  );
}

export default DiscussionsFeed;
