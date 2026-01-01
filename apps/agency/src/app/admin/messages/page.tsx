import Link from 'next/link';
import { ArrowLeft, User, Mail, FileText } from 'lucide-react';
import { getMessages } from '@/lib/data';
import { MessageStatusSelector } from '@/components/admin/message-status-selector';

/**
 * Admin Messages Page
 * -------------------
 * View all contact form submissions with status management.
 * Server Component with client status selector.
 */

export default async function AdminMessagesPage() {
  const messages = await getMessages();

  return (
    <div className="min-h-screen bg-void px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-white">Contact Messages</h1>
          <p className="mt-2 text-white/50">{messages.length} total submissions</p>
        </div>

        {messages.length === 0 ? (
          <div className="mt-12 rounded-md border border-white/[0.08] bg-white/[0.02] p-12 text-center">
            <p className="text-white/40">No messages yet</p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <MessageStatusSelector
                        messageId={msg.id!}
                        currentStatus={msg.status}
                      />
                      <span className="font-mono text-xs text-white/40">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-white/40" />
                        <h3 className="font-semibold text-white">{msg.subject}</h3>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-white/70">
                        <User className="h-4 w-4 text-white/40" />
                        {msg.name}
                      </div>
                      <div className="flex items-center gap-2 text-white/70">
                        <Mail className="h-4 w-4 text-white/40" />
                        <a
                          href={`mailto:${msg.email}`}
                          className="hover:text-cyan-400"
                        >
                          {msg.email}
                        </a>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                      <p className="text-sm leading-relaxed text-white/60">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
