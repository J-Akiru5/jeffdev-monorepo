"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Loader2, CheckCheck, X } from "lucide-react";
import {
  getAgencyNotifications,
  getAgencyUnreadCount,
  markAgencyNotificationRead,
  markAllAgencyNotificationsRead,
  dismissAgencyNotification,
} from "@/app/actions/agency-notifications";

/**
 * Notification Popover Component
 * -------------------------------
 * Displays user notifications with unread badge.
 */

interface Props {
  userId: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  link?: string;
  read: boolean;
  created_at: string;
}

const typeColors: Record<string, string> = {
  info: "border-l-cyan-500/50",
  success: "border-l-emerald-500/50",
  warning: "border-l-amber-500/50",
  error: "border-l-red-500/50",
};

export function NotificationPopover({ userId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const [notifs, count] = await Promise.all([
      getAgencyNotifications(userId),
      getAgencyUnreadCount(userId),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
    setLoading(false);
  }

  async function handleMarkRead(id: string) {
    await markAgencyNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function handleMarkAllRead() {
    await markAllAgencyNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function handleDismiss(id: string) {
    await dismissAgencyNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white transition-all"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-white/5">
            <h3 className="text-sm font-medium text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-white/30" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/30">
                No notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-3 border-l-2 hover:bg-white/[0.02] transition-colors group ${
                    typeColors[notif.type] || "border-l-transparent"
                  } ${!notif.read ? "bg-white/[0.03]" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${notif.read ? "text-white/50" : "text-white/80"}`}
                    >
                      {notif.title}
                    </p>
                    {notif.message && (
                      <p className="text-xs text-white/40 mt-0.5">{notif.message}</p>
                    )}
                    <p className="text-[10px] text-white/30 mt-1">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="p-1 text-white/30 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(notif.id)}
                      className="p-1 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
