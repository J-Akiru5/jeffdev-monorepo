import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Agency Messages Page
 * ---------------------
 * View and manage client/team messages.
 */

const typeColors: Record<string, string> = {
  inquiry: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  quote: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  support: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  general: "bg-white/10 text-white/60 border-white/10",
};

export default async function AgencyMessagesPage() {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="mt-1 text-sm text-white/50">
          {messages?.length || 0} total messages
        </p>
      </div>

      <div className="space-y-3">
        {messages && messages.length > 0 ? (
          messages.map((msg: any) => (
            <div
              key={msg.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {!msg.read && (
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  )}
                  <p className="text-sm font-medium text-white">{msg.name}</p>
                  <span className="text-xs text-white/40">{msg.email}</span>
                </div>
                <span
                  className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider border ${
                    typeColors[msg.type] || typeColors.general
                  }`}
                >
                  {msg.type || "general"}
                </span>
              </div>
              <p className="text-xs text-white/50 mb-1">{msg.subject}</p>
              <p className="text-sm text-white/60 line-clamp-2">{msg.message}</p>
              <p className="mt-2 text-[10px] text-white/30">
                {new Date(msg.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-white/30">No messages yet</div>
        )}
      </div>
    </div>
  );
}
