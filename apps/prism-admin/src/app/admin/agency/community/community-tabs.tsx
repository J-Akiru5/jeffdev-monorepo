"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Users } from "lucide-react";
import { cn } from "@syntaxure/ui";
import { CommunityPostsTable } from "./community-posts-table";
import { CommunityTable } from "./community-table";
import type { CommunityPost, CommunityMember } from "@/app/actions/community";

interface CommunityTabsProps {
  posts: CommunityPost[];
  members: CommunityMember[];
}

const tabs = [
  { id: "posts", label: "Posts", icon: FileText },
  { id: "members", label: "Members", icon: Users },
] as const;

export function CommunityTabs({ posts, members }: CommunityTabsProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "members">("posts");

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-white/50 hover:text-white/70 border border-transparent"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-mono",
                  activeTab === tab.id
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-white/5 text-white/30"
                )}
              >
                {tab.id === "posts" ? posts.length : members.length}
              </span>
            </button>
          ))}
        </div>

        {/* Create Button */}
        <Link
          href={
            activeTab === "posts"
              ? "/admin/agency/community/posts/new"
              : "/admin/agency/community/members/new"
          }
          className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {activeTab === "posts" ? "Create Post" : "Add Member"}
        </Link>
      </div>

      {/* Tab Content */}
      {activeTab === "posts" ? (
        <CommunityPostsTable posts={posts} />
      ) : (
        <CommunityTable members={members} />
      )}
    </div>
  );
}
