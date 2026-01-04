import type { Metadata, Viewport } from 'next'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Inter, JetBrains_Mono } from 'next/font/google'
import 'nextra-theme-docs/style.css'
import './globals.css'
import Image from 'next/image'
import { DocsAssistant } from './components/docs-assistant'

// Typography - Matching Agency Design System
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
}

export const metadata: Metadata = {
  title: {
    template: '%s | Prism Context Engine',
    default: 'Prism Context Engine - Context Governance for LLMs'
  },
  description: 'AI-powered context governance for LLMs. Extract architectural rules from video transcripts, enforce coding standards, and deploy constraints to AI coding assistants via MCP.',
  applicationName: 'Prism Context Engine',
  keywords: ['MCP', 'Model Context Protocol', 'AI', 'LLM', 'Cursor', 'Windsurf', 'Copilot', 'architectural rules', 'code standards', 'video transcripts', 'Azure OpenAI'],
  authors: [{ name: 'JeffDev Studio', url: 'https://jeffdev.studio' }],
  creator: 'JeffDev Studio',
  publisher: 'JeffDev Studio',
  metadataBase: new URL(process.env.NEXT_PUBLIC_DOCS_URL || 'http://localhost:3002'),
  openGraph: {
    title: 'Prism Context Engine - Context Governance for LLMs',
    description: 'AI-powered context governance. Extract rules from video, enforce standards via MCP.',
    url: '/',
    siteName: 'Prism Context Engine',
    images: [
      {
        url: '/prism-icon.png',
        width: 1200,
        height: 630,
        alt: 'Prism Context Engine',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prism Context Engine - Context Governance for LLMs',
    description: 'AI-powered context governance. Extract rules from video, enforce standards via MCP.',
    images: ['/prism-icon.png'],
    creator: '@jeffdevstudio',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pageMap = await getPageMap()

  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <Head />
      <body className="bg-void font-sans antialiased">
        {/* Global Grid Background - Matching Agency Design */}
        <div className="docs-grid-bg" aria-hidden="true">
          <div className="bg-noise opacity-[0.02]" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10">
          <Layout
            banner={<Banner storageKey="prism-docs-banner">Prism Context Engine v1.0.3 - Now with FlexSearch &amp; Azure OpenAI!</Banner>}
            navbar={
              <Navbar 
                logo={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Image 
                      src="/prism-icon.png" 
                      alt="Prism Context Engine" 
                      width={28} 
                      height={28}
                      style={{ objectFit: 'contain' }}
                    />
                    <span className="text-gradient-cyan" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      Prism Context Engine
                    </span>
                  </div>
                }
                projectLink="https://github.com/J-Akiru5/jeffdev-monorepo"
              />
            }
            pageMap={pageMap}
            docsRepositoryBase="https://github.com/J-Akiru5/jeffdev-monorepo/tree/main/apps/prism-docs"
            footer={
              <div className="w-full bg-[#050505] border-t border-white/5">
                {/* Main Footer Content */}
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 w-full">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                      <div className="flex items-center gap-3 mb-6">
                        <Image
                          src="/prism-icon.png"
                          alt="Prism Context Engine"
                          width={28}
                          height={28}
                        />
                        <span className="text-white font-semibold text-lg">Prism Context Engine</span>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed mb-6">
                        The Context Operating System for developers who ship fast. Eliminate AI hallucinations with governed context rules.
                      </p>
                      <div className="space-y-2 text-sm">
                        <a href="mailto:hello@jeffdev.studio" className="flex items-center gap-2 text-white/40 hover:text-cyan-400 transition-colors">
                          <span>✉</span> hello@jeffdev.studio
                        </a>
                      </div>
                    </div>

                    {/* Documentation Column */}
                    <div>
                      <h4 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-6">Documentation</h4>
                      <ul className="space-y-3">
                        <li>
                          <a href="/introduction" className="text-white/70 hover:text-cyan-400 text-sm transition-colors">Introduction</a>
                        </li>
                        <li>
                          <a href="/quick-start" className="text-white/70 hover:text-cyan-400 text-sm transition-colors">Quick Start</a>
                        </li>
                        <li>
                          <a href="/video" className="text-white/70 hover:text-cyan-400 text-sm transition-colors">Video Processing</a>
                        </li>
                        <li>
                          <a href="/integrations" className="text-white/70 hover:text-cyan-400 text-sm transition-colors">IDE Integrations</a>
                        </li>
                      </ul>
                    </div>

                    {/* Product Column */}
                    <div>
                      <h4 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-6">Product</h4>
                      <ul className="space-y-3">
                        <li>
                          <a href="https://prism.jeffdev.studio" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-cyan-400 text-sm transition-colors">Dashboard</a>
                        </li>
                        <li>
                          <a href="https://prism.jeffdev.studio/pricing" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-cyan-400 text-sm transition-colors">Pricing</a>
                        </li>
                        <li>
                          <a href="/advanced/api-reference" className="text-white/70 hover:text-cyan-400 text-sm transition-colors">API Reference</a>
                        </li>
                        <li>
                          <a href="/changelog-page" className="text-white/70 hover:text-cyan-400 text-sm transition-colors">Changelog</a>
                        </li>
                      </ul>
                    </div>

                    {/* CTA Column */}
                    <div>
                      <h4 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-6">Start a Project</h4>
                      <p className="text-white/50 text-sm leading-relaxed mb-6">
                        Ready to eliminate context pollution? Let&apos;s get you started.
                      </p>
                      <a
                        href="https://prism.jeffdev.studio/sign-up"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
                      >
                        GET_STARTED <span className="text-xs">↗</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5">
                  <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-6 text-xs">
                      <a href="https://prism.jeffdev.studio/terms" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/60 transition-colors">
                        Terms of Service
                      </a>
                      <a href="https://prism.jeffdev.studio/privacy" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/60 transition-colors">
                        Privacy Policy
                      </a>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/30">
                      <span>© {new Date().getFullYear()} JD Studio.</span>
                      <span className="font-mono text-[10px] text-white/20">DTI: VL1927082895984</span>
                    </div>
                  </div>
                </div>
              </div>
            }
            sidebar={{ defaultMenuCollapseLevel: 2, toggleButton: true }}
            editLink="Edit on GitHub"
          >
            {children}
          </Layout>
        </div>

        {/* AI Docs Assistant */}
        <DocsAssistant />
      </body>
    </html>
  )
}
