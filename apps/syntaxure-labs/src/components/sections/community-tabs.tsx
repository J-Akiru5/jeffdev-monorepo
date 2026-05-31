"use client";

/**
 * Community Tabs Component
 * ------------------------
 * Client component for switching between Changelog and Discussions views.
 */

import { useState } from "react";
import { FileText, MessageSquare } from "lucide-react";
import { cn } from "@syntaxure/ui";
import { ReleaseTimeline, type Release } from "./release-timeline";
import { DiscussionsFeed } from "./discussions-feed";
import type { CommunityPostWithAuthor } from "@/app/actions/community";

interface CommunityTabsProps {
  releases: Release[];
  featuredReleases: Release[];
  posts: CommunityPostWithAuthor[];
}

const tabs = [
  { id: "changelog", label: "Changelog", icon: FileText },
  { id: "discussions", label: "Discussions", icon: MessageSquare },
] as const;

export function CommunityTabs({
  releases,
  featuredReleases,
  posts,
}: CommunityTabsProps) {
  const [activeTab, setActiveTab] = useState<"changelog" | "discussions">(
    "changelog",
  );

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-all",
              activeTab === tab.id
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-white/40 hover:text-white/60 border border-transparent",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "bg-white/5 text-white/30",
              )}
            >
              {tab.id === "changelog"
                ? featuredReleases.length + releases.length
                : posts.length}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "changelog" ? (
        <ReleaseTimeline featured={featuredReleases} releases={releases} />
      ) : (
        <DiscussionsFeed posts={posts} />
      )}
    </div>
  );
}

export default CommunityTabs;
