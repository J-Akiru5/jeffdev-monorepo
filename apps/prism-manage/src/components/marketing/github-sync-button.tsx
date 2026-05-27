"use client";

import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function GithubSyncButton() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/github/sync", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Sync failed");
        return;
      }
      const data = await res.json();
      toast.success(`Synced ${data.imported} issues from GitHub`);
    } catch {
      toast.error("Failed to sync with GitHub");
    } finally {
      setSyncing(false);
    }
  }, []);

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="glass inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-all hover:border-cyan-500/40 disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync from GitHub"}
    </button>
  );
}
