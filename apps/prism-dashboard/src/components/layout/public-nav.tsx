'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

export function PublicNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="glass-heavy fixed top-0 left-0 right-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/prism-icon.png"
              alt="Prism Context Engine"
              width={32}
              height={32}
              className="transition-transform group-hover:scale-110"
            />
            <span className="text-gradient-cyan font-bold text-lg">
              Prism Context Engine
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="https://docs.jeffdev.studio"
              target="_blank"
              className="text-white/60 hover:text-cyan-400 transition-colors text-sm font-mono uppercase tracking-wider"
            >
              Docs
            </Link>
            <Link
              href="/pricing"
              className={clsx(
                "transition-colors text-sm font-mono uppercase tracking-wider",
                isActive('/pricing') ? "text-cyan-400" : "text-white/60 hover:text-cyan-400"
              )}
            >
              Pricing
            </Link>
            <Link
              href="https://jeffdev.studio"
              target="_blank"
              className="text-white/60 hover:text-cyan-400 transition-colors text-sm font-mono uppercase tracking-wider"
            >
              Agency
            </Link>
            <Link
              href="/sign-in"
              className="text-white/60 hover:text-white transition-colors text-sm font-mono uppercase tracking-wider"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="glass px-4 py-2 rounded-md hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider text-white"
            >
              Start Free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
