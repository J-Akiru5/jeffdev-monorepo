'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export function CookieConsent() {
  const [isVisible, setIsVisible] = React.useState(false);

  // Check localStorage on mount
  React.useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Delay slightly for smoother entrance
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    // Reload page to activate scripts? Or just trigger event.
    // A reload is the cleanest way to ensure all scripts fire correctly without complex state management.
    window.location.reload();
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-void/80 p-6 shadow-2xl backdrop-blur-xl transition-all md:flex md:items-center md:justify-between md:gap-8">
            {/* Text Content */}
            <div className="mb-6 md:mb-0 md:flex-1">
              <h3 className="mb-2 text-lg font-semibold text-white">
                We value your privacy
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
                <br className="hidden md:block" />
                <span className="mt-2 block">
                  Read our{' '}
                  <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                    Privacy Policy
                  </Link>
                  {' '}and{' '}
                  <Link href="/cookies" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                    Cookie Policy
                  </Link>
                  .
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row md:items-center">
              <button
                onClick={handleReject}
                className="rounded-lg border border-white/10 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/5 active:scale-95"
              >
                Reject All
              </button>
              <button
                onClick={handleAccept}
                className="group relative overflow-hidden rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative">Accept All</span>
              </button>
            </div>
            
            {/* Close (X) - Optional, acts as reject or just dismiss? Better to force choice or default to reject if closed. Let's force choice for now (no X). */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
