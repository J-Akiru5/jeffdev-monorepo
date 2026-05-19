import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Joularix Solar — Smart Grid Solar Solutions',
    template: '%s | Joularix Solar',
  },
  description: 'Tier-1 solar panels, battery storage, and turnkey installation for Filipino homes and businesses. Powered by Martinez Hybrid Technologies.',
  metadataBase: new URL('https://joularix.jeffdev.studio'),
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    siteName: 'Joularix Solar',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased font-sans">
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-white to-emerald-50/30" />
        </div>
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
