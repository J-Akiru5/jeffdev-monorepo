'use client';

/**
 * Notification Popover Component
 * ------------------------------
 * Bell icon with dropdown showing recent notifications.
 * Includes unread count badge and mark-all-as-read functionality.
 */

import { useState, useEffect, useTransition } from 'react';
import { Bell, Check, X, Loader2, Mail, MessageSquare, CreditCard, FolderKanban, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  dismissNotification 
} from '@/app/actions/notifications';
import type { Notification, NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  quote: MessageSquare,
  message: Mail,
  system: Bell,
  payment: CreditCard,
  project: FolderKanban,
};

const colorMap: Record<NotificationType, string> = {
  quote: 'text-cyan-400 bg-cyan-500/10',
  message: 'text-purple-400 bg-purple-500/10',
  system: 'text-yellow-400 bg-yellow-500/10',
  payment: 'text-emerald-400 bg-emerald-500/10',
  project: 'text-blue-400 bg-blue-500/10',
};

interface NotificationPopoverProps {
  userId: string;
}

export function NotificationPopover({ userId }: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch unread count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    };
    fetchUnreadCount();
  }, [userId]);

  // Fetch notifications when popover opens
  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsLoading(true);
      const data = await getNotifications(userId);
      setNotifications(data);
      setIsLoading(false);
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    startTransition(async () => {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    startTransition(async () => {
      await markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });
  };

  // Dismiss notification
  const handleDismiss = async (notificationId: string, isUnread: boolean) => {
    startTransition(async () => {
      await dismissNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (isUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative rounded-md p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-md border border-white/10 bg-[#0a0a0a] shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isPending}
                  className="text-xs text-cyan-400 hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-white/20" />
                  <p className="mt-2 text-sm text-white/40">No notifications</p>
                </div>
              ) : (
                <ul>
                  {notifications.map((notification) => {
                    const Icon = iconMap[notification.type] || Bell;
                    const colorClass = colorMap[notification.type] || 'text-white/50 bg-white/5';

                    return (
                      <li
                        key={notification.id}
                        className={`group relative border-b border-white/5 last:border-0 ${
                          !notification.read ? 'bg-white/2' : ''
                        }`}
                      >
                        <div className="flex gap-3 p-4">
                          {/* Icon */}
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                            </p>
                            <p className="mt-0.5 text-xs text-white/50 line-clamp-2">
                              {notification.body}
                            </p>
                            <p className="mt-1 text-[10px] text-white/30">
                              {notification.createdAt?.toDate
                                ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })
                                : 'Just now'}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDismiss(notification.id, !notification.read)}
                              className="rounded p-1 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                              title="Dismiss"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Link overlay */}
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!notification.read) handleMarkAsRead(notification.id);
                              setIsOpen(false);
                            }}
                            className="absolute inset-0 z-0"
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-4 py-2">
              <Link
                href="/admin/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-xs text-white/40 hover:text-white"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
