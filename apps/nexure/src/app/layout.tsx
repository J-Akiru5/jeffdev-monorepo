import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Nexure Networks — Fiber-Fast Internet for Western Visayas',
    template: '%s | Nexure Networks',
  },
  description: 'Reliable, high-speed internet with uncapped data plans for Filipino communities. Powered by Martinez Hybrid Technologies.',
  metadataBase: new URL('https://nexure.jeffdev.studio'),
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    siteName: 'Nexure Networks',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased font-sans">
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-slate-50/30" />
        </div>
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
