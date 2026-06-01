import Link from "next/link";
import { ArrowLeft, Trash2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { deleteMessage, markAllMessagesRead, updateMessageStatus } from "@/app/actions/agency-messages";
import { revalidatePath } from "next/cache";

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

const statusColors: Record<string, string> = {
  unread: "bg-cyan-500/20 text-cyan-400",
  read: "bg-white/10 text-white/40",
  archived: "bg-yellow-500/20 text-yellow-400",
};

export default async function AgencyMessagesPage() {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  async function handleMarkAllRead() {
    "use server";
    await markAllMessagesRead();
  }

  async function handleDelete(id: string) {
    "use server";
    await deleteMessage(id);
    revalidatePath("/admin/agency/messages");
  }

  async function handleToggleRead(id: string, currentStatus: string) {
    "use server";
    const newStatus = currentStatus === "read" ? "unread" : "read";
    await updateMessageStatus(id, newStatus);
    revalidatePath("/admin/agency/messages");
  }

  const unreadCount = messages?.filter((m: any) => m.status === "unread" || !m.status).length || 0;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="mt-1 text-sm text-white/50">
            {messages?.length || 0} total &middot; {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={handleMarkAllRead}>
            <button
              type="submit"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </form>
        )}
      </div>

      <div className="space-y-3">
        {messages && messages.length > 0 ? (
          messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`rounded-lg border bg-white/[0.02] p-4 transition-all hover:border-white/10 ${
                msg.status === "unread" || !msg.status
                  ? "border-cyan-500/20"
                  : "border-white/5"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {(!msg.status || msg.status === "unread") && (
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  )}
                  <p className="text-sm font-medium text-white">{msg.name}</p>
                  <span className="text-xs text-white/40">{msg.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider border ${
                      typeColors[msg.type] || typeColors.general
                    }`}
                  >
                    {msg.type || "general"}
                  </span>
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      statusColors[msg.status] || statusColors.unread
                    }`}
                  >
                    {msg.status || "unread"}
                  </span>
                </div>
              </div>
              {msg.subject && (
                <p className="text-xs text-white/50 mb-1">{msg.subject}</p>
              )}
              <p className="text-sm text-white/60 line-clamp-2">{msg.message}</p>
              <p className="mt-2 text-[10px] text-white/30">
                {new Date(msg.created_at).toLocaleDateString()}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <form
                  action={handleToggleRead.bind(null, msg.id, msg.status || "unread")}
                >
                  <button
                    type="submit"
                    className="flex h-7 items-center gap-1 rounded border border-white/10 px-2 text-[11px] text-white/40 hover:bg-white/5 hover:text-white/60 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    {msg.status === "read" ? "Mark unread" : "Mark read"}
                  </button>
                </form>
                <form
                  action={handleDelete.bind(null, msg.id)}
                  onSubmit={(e) => {
                    if (!confirm("Delete this message?")) e.preventDefault();
                  }}
                >
                  <button
                    type="submit"
                    className="flex h-7 items-center gap-1 rounded border border-red-500/20 px-2 text-[11px] text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-white/30">No messages yet</div>
        )}
      </div>
    </div>
  );
}
