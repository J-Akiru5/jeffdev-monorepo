"use client";

import { useState } from "react";
import { clearAppCache } from "@/app/actions/users";

export function ClearCacheButton() {
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    const result = await clearAppCache();
    setMessage(result.message);
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        className="px-4 py-2 text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors"
      >
        Clear Cache
      </button>
      {message && (
        <span className="text-[10px] text-emerald-400">{message}</span>
      )}
    </div>
  );
}
