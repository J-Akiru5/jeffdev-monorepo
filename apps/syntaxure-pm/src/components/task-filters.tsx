"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function TaskFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/tasks?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={searchParams.get("status") || "all"}
        onChange={(e) => handleChange("status", e.target.value)}
        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
      >
        <option value="all">All Statuses</option>
        <option value="backlog">Backlog</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="in_review">In Review</option>
        <option value="completed">Completed</option>
      </select>

      <select
        value={searchParams.get("priority") || "all"}
        onChange={(e) => handleChange("priority", e.target.value)}
        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
      >
        <option value="all">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>

      <select
        value={searchParams.get("category") || "all"}
        onChange={(e) => handleChange("category", e.target.value)}
        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
      >
        <option value="all">All Categories</option>
        <option value="mcp-stability">MCP Stability</option>
        <option value="documentation">Documentation</option>
        <option value="architecture">Architecture</option>
        <option value="testing">Testing</option>
        <option value="deployment">Deployment</option>
        <option value="general">General</option>
      </select>
    </div>
  );
}
