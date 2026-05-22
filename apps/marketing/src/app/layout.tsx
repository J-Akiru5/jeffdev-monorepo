import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider, UserButton } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Marketing Plan — Syntaxure Labs',
    template: '%s | Marketing Plan',
  },
  description: 'Marketing plan dashboard for Syntaxure Labs + Prism Context Engine',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          userButtonBox: 'text-white',
          userButtonTrigger: 'text-white/70 hover:text-white',
          userButtonPopoverCard: 'bg-glass border border-white/10',
          userButtonPopoverMain: 'text-white',
        },
      }}
    >
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <body className="min-h-screen bg-void antialiased">
          <header className="flex items-center justify-end px-6 py-3">
            <UserButton afterSignOutUrl="/sign-in" />
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
