"use client";

/**
 * Notification Panel
 * ------------------
 * Slide-out panel showing recent notifications.
 * Glass morphism styling with Syntaxure Labs branding.
 */

import { useState } from "react";
import { X, Bell, CheckSquare, User, Settings, Sparkles } from "lucide-react";

interface Notification {
  id: string;
  type: "task" | "member" | "system" | "achievement";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "task",
    title: "Task assigned",
    message: "You've been assigned to 'Implement auth flow'",
    timestamp: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "member",
    title: "New member",
    message: "Alex joined the Engineering department",
    timestamp: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    type: "system",
    title: "System update",
    message: "Prism Engine v2.0 has been deployed",
    timestamp: "3 hours ago",
    read: true,
  },
  {
    id: "4",
    type: "achievement",
    title: "Milestone reached",
    message: "100 tasks completed this month!",
    timestamp: "1 day ago",
    read: true,
  },
];

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "task":
      return CheckSquare;
    case "member":
      return User;
    case "system":
      return Settings;
    case "achievement":
      return Sparkles;
  }
}

function getNotificationColor(type: Notification["type"]) {
  switch (type) {
    case "task":
      return "text-cyan-400 bg-cyan-500/10";
    case "member":
      return "text-purple-400 bg-purple-500/10";
    case "system":
      return "text-white/50 bg-white/5";
    case "achievement":
      return "text-amber-400 bg-amber-500/10";
  }
}

export function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!open) return null;

  return (
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
                onClick={markAllRead}
                className="text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto p-4 space-y-2">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);

            return (
              <div
                key={notification.id}
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
                    {notification.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.06] bg-[#0a0a0a]/80 px-6 py-3">
          <p className="text-center text-[10px] font-mono uppercase tracking-wider text-white/20">
            Notifications coming soon
          </p>
        </div>
      </div>
    </>
  );
}
