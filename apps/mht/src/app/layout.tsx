import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
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
        {/* Subtle background pattern */}
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-green-50/30" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='none' stroke='%23000000' stroke-width='0.5'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Application Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
