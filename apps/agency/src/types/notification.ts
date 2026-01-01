/**
 * Notification Types
 * ------------------
 * Type definitions for the in-app notification system.
 */

import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'quote' | 'message' | 'system' | 'payment' | 'project';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface NotificationCreateInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

// Icon mapping for notification types
export const notificationIcons: Record<NotificationType, string> = {
  quote: 'MessageSquare',
  message: 'Mail',
  system: 'Bell',
  payment: 'CreditCard',
  project: 'FolderKanban',
};

// Color mapping for notification types
export const notificationColors: Record<NotificationType, string> = {
  quote: 'text-cyan-400 bg-cyan-500/10',
  message: 'text-purple-400 bg-purple-500/10',
  system: 'text-yellow-400 bg-yellow-500/10',
  payment: 'text-emerald-400 bg-emerald-500/10',
  project: 'text-blue-400 bg-blue-500/10',
};
