'use client';

/**
 * Admin Header
 * -------------
 * Top header bar with user info and quick actions.
 */

import Link from 'next/link';
import { Search } from 'lucide-react';
import { NotificationPopover } from './notification-popover';
import { useUser } from '@/contexts/user-context';

export function AdminHeader() {
  const { user, loading } = useUser();

  // Fallback while loading
  const displayUser = user || {
    uid: '',
    displayName: 'Loading...',
    email: '',
    photoURL: null,
    role: 'employee' as const,
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/6 bg-void/80 px-4 backdrop-blur-md lg:px-6">
      {/* Search - Hidden on mobile */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-md border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/20 focus:bg-white/10"
          />
        </div>

        {/* Mobile Logo/Title (Optional, if you want something on the left) */}
        <div className="md:hidden font-semibold text-white">
          Dashboard
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        {displayUser.uid && <NotificationPopover userId={displayUser.uid} />}

        {/* User - Clickable to Profile */}
        <Link
          href="/admin/profile"
          className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
        >
          <div className="hidden text-right md:block">
            <div className="text-sm font-medium text-white">
              {loading ? 'Loading...' : displayUser.displayName}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              {displayUser.role}
            </div>
          </div>
          {displayUser.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUser.photoURL}
              alt={displayUser.displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500" />
          )}
        </Link>
      </div>
    </header>
  );
}
