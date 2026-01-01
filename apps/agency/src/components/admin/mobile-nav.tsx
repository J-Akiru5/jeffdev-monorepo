'use client';

/**
 * Mobile Bottom Navigation
 * ------------------------
 * Fixed bottom navigation for mobile devices.
 * Shows primary actions + "More" drawer.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Mail,
  User,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Settings
} from 'lucide-react';
import { navSections, NavSection } from './sidebar';
import { logout } from '@/app/actions/auth';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Constants for bottom tabs
  const tabs = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Quotes', href: '/admin/quotes', icon: MessageSquare },
    { label: 'Messages', href: '/admin/messages', icon: Mail },
    { label: 'Profile', href: '/admin/profile', icon: User },
  ];

  const handleNavClick = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* 1. Bottom Tab Bar (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/6 bg-void/80 px-2 backdrop-blur-xl lg:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setIsDrawerOpen(false)}
              className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 transition-all ${
                isActive ? 'text-cyan-400' : 'text-white/40 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}

        {/* 'More' Button */}
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 transition-all ${
            isDrawerOpen ? 'text-cyan-400' : 'text-white/40 hover:text-white'
          }`}
        >
          {isDrawerOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>

      {/* 2. Slide-up Drawer (Full Nav) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-16 left-0 right-0 z-40 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#0A0A0A] p-6 shadow-2xl lg:hidden"
            >
              <div className="mb-6 flex items-center justify-center">
                <div className="h-1 w-12 rounded-full bg-white/20" />
              </div>

              <div className="space-y-8 pb-8">
                {navSections.map((section: NavSection) => (
                  <div key={section.title || 'main'}>
                    {section.title && (
                      <h3 className="mb-3 px-2 font-mono text-xs uppercase tracking-wider text-white/30">
                        {section.title}
                      </h3>
                    )}
                    <ul className="grid grid-cols-2 gap-3">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={handleNavClick}
                              className={`flex items-center gap-3 rounded-xl border border-white/5 p-3 transition-all active:scale-95 ${
                                isActive
                                  ? 'bg-white/10 text-white border-white/10'
                                  : 'bg-white/[0.02] text-white/60 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <Icon className="h-5 w-5 text-cyan-500/80" />
                              <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                
                 {/* Quick Actions (Settings, Visit Site, Logout) */}
                 <div className="border-t border-white/10 pt-6">
                    <h3 className="mb-3 px-2 font-mono text-xs uppercase tracking-wider text-white/30">
                      System
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        <Link
                            href="/admin/settings"
                            onClick={handleNavClick}
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-white/50 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <Settings className="h-5 w-5" />
                            <span>Settings</span>
                        </Link>
                        
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-white/50 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <ExternalLink className="h-5 w-5" />
                            <span>Visit Public Site</span>
                        </a>

                        <form action={logout} className="w-full">
                            <button
                                type="submit"
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            >
                                <LogOut className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </form>
                    </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
