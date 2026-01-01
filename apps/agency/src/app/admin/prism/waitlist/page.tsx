'use client';

/**
 * Admin Waitlist Page
 * -------------------
 * Direct view of the Prism Engine waitlist.
 */

import { useState, useEffect } from 'react';
import { getWaitlistEntries, type WaitlistEntry } from '@/app/actions/waitlist';
import { Loader2, Mail, Calendar, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    async function loadData() {
      const data = await getWaitlistEntries();
      setEntries(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredEntries = entries.filter(
    (entry) =>
      entry.email.toLowerCase().includes(filter.toLowerCase()) ||
      (entry.role && entry.role.toLowerCase().includes(filter.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prism Waitlist</h1>
          <p className="mt-1 text-white/50">
            {entries.length} total signups
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search emails..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-white/90">{entry.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-white/70">
                    <User className="h-3.5 w-3.5 opacity-50" />
                    <span className="capitalize">{entry.role || 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-white/50">
                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                    {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Approved
                  </span>
                </td>
              </tr>
            ))}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-white/30">
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
