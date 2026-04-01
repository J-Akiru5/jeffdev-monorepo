import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ChatAssistant } from '@jdstudio/ui/chat-assistant';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Martinez Hybrid Technologies — Internet & Solar Energy',
    template: '%s | Martinez Hybrid Technologies',
  },
  description:
    'Empowering communities in Western Visayas with fiber-fast internet by Nexure Networks and intelligent solar energy systems by Joularix Solar.',
  keywords: [
    'Martinez Hybrid Technologies',
    'Nexure Networks',
    'Joularix Solar',
    'internet service provider',
    'solar energy Philippines',
    'Dingle Iloilo',
    'Western Visayas ISP',
  ],
  authors: [{ name: 'Martinez Hybrid Technologies OPC' }],
  creator: 'Martinez Hybrid Technologies OPC',
  metadataBase: new URL('https://martinezhybrid.jeffdev.studio'),
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: 'https://martinezhybrid.jeffdev.studio',
    siteName: 'Martinez Hybrid Technologies',
    title: 'Martinez Hybrid Technologies — Internet & Solar Energy',
    description:
      'Next-generation connectivity and sustainable power for Western Visayas.',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased font-sans">
        {/* Structured background — light twin of Syntaxure grid */}
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          {/* Base gradient canvas */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/20" />

          {/* Visible grid — Syntaxure-style but for light mode */}
          <div
            className="absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23000000' stroke-width='0.75'%3E%3Cpath d='M0 0h60v60H0z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px',
            }}
          />

          {/* Radial light bloom — top center, mirrors Syntaxure's cyan but in blue/green */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.07),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(22,163,74,0.05),transparent)]" />
        </div>

        {/* Application Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </div>
        <ChatAssistant 
          apiEndpoint="/api/assistant" 
          title="MHT Support" 
          welcomeMessage="Welcome to Martinez Hybrid Technologies! How can I assist you with our Internet or Solar services today?"
          suggestions={[
            "How do I apply for Nexure Internet?",
            "What happens during Joularix Solar free maintenance?",
            "Are you available in Dingle, Iloilo?",
            "How do I contact support?"
          ]}
        />
      </body>
    </html>
  );
}
