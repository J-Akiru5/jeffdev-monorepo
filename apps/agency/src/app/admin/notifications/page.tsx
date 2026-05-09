import Link from 'next/link';
import { ArrowLeft, Bell, CheckCircle2, Mail, MessageSquare, FolderKanban, CreditCard } from 'lucide-react';

const notifications = [
  {
    title: 'New quote request received',
    body: 'A potential client submitted a request for a SaaS platform build.',
    type: 'quote',
    time: '5 minutes ago',
  },
  {
    title: 'Project milestone completed',
    body: 'The latest deliverable was approved and marked complete.',
    type: 'project',
    time: '2 hours ago',
  },
  {
    title: 'Subscription payment confirmed',
    body: 'A recurring payment was captured successfully.',
    type: 'payment',
    time: 'Yesterday',
  },
  {
    title: 'Unread message in inbox',
    body: 'There is a new message waiting in the agency inbox.',
    type: 'message',
    time: 'Yesterday',
  },
];

const iconMap = {
  quote: MessageSquare,
  message: Mail,
  system: Bell,
  payment: CreditCard,
  project: FolderKanban,
} as const;

export default function AdminNotificationsPage() {
  return (
    <div className="min-h-screen bg-void px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mt-8 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-cyan-400">
              {'// Admin.Notifications'}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              Notifications
            </h1>
            <p className="mt-2 max-w-2xl text-white/50">
              Centralized notification feed for quotes, messages, projects, and payments.
            </p>
          </div>

          <div className="hidden rounded-md border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-right md:block">
            <div className="text-2xl font-bold text-white">{notifications.length}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              Recent events
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type as keyof typeof iconMap] || Bell;

            return (
              <div
                key={`${notification.title}-${notification.time}`}
                className="flex flex-col gap-4 rounded-md border border-white/[0.08] bg-white/[0.02] p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5">
                    <Icon className="h-5 w-5 text-cyan-400" />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-white">
                      {notification.title}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-white/50">
                      {notification.body}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:justify-end">
                  <span className="rounded-sm border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60">
                    {notification.time}
                  </span>
                  <button className="inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark read
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
