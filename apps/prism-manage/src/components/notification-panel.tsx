"use client";

/**
 * Notification Panel
 * ------------------
 * Slide-out panel showing real notifications from the `notifications` table,
 * with live updates via Supabase Realtime.
 */

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X,
  Bell,
  CheckSquare,
  UserCheck,
  MessageSquare,
  AtSign,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/app/actions/collaboration";

function getNotificationIcon(type: string) {
  switch (type) {
    case "comment":
      return MessageSquare;
    case "mention":
      return AtSign;
    case "assignment":
      return UserCheck;
    case "approval":
      return Sparkles;
    case "task":
      return CheckSquare;
    default:
      return Bell;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case "comment":
      return "text-cyan-400 bg-cyan-500/10";
    case "mention":
      return "text-purple-400 bg-purple-500/10";
    case "assignment":
      return "text-amber-400 bg-amber-500/10";
    case "approval":
      return "text-emerald-400 bg-emerald-500/10";
    case "task":
      return "text-cyan-400 bg-cyan-500/10";
    default:
      return "text-white/50 bg-white/5";
  }
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const items = await getNotifications(30);
    setNotifications(items);
  }, []);

  // Load on open + subscribe to live inserts while open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    refresh().finally(() => {
      if (!cancelled) setLoading(false);
    });

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return;
      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            refresh();
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [open, refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead();
  };

  const handleClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
      await markNotificationRead(notification.id);
    }
    if (notification.actionUrl) {
      onClose();
      router.push(notification.actionUrl);
    }
  };

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-400">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="rounded-md p-1.5 text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto p-4 space-y-2">
          {loading && (
            <p className="px-2 py-8 text-center text-xs text-white/40">
              Loading…
            </p>
          )}

          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-2 py-12 text-center">
              <Bell className="h-6 w-6 text-white/15" />
              <p className="text-xs text-white/40">You&apos;re all caught up</p>
            </div>
          )}

          {!loading &&
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={`group flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                    notification.read
                      ? "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]"
                      : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] font-mono text-white/20 mt-1">
                      {formatRelative(notification.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.06] bg-[#0a0a0a]/80 px-6 py-3">
          <p className="text-center text-[10px] font-mono uppercase tracking-wider text-white/20">
            {notifications.length > 0
              ? `Latest ${notifications.length}`
              : "Live updates enabled"}
          </p>
        </div>
      </div>
    </>,
    document.body,
  );
}
