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
            banner={<Banner storageKey="prism-docs-banner">🎉 Prism Context Engine v1.0.3 - Now with FlexSearch &amp; Azure OpenAI!</Banner>}
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
              <Footer>
                <div className="w-full">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
                  {/* Brand */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                      <Image
                        src="/prism-icon.png"
                        alt="Prism Context Engine"
                        width={24}
                        height={24}
                      />
                      <span className="text-gradient-cyan font-bold">Prism Context Engine</span>
                    </div>
                    <p className="text-white/40 text-sm">
                      The Context Operating System for developers who ship fast.
                    </p>
                    <p className="text-white/30 text-xs mt-2 font-mono">
                      v1.0.3
                    </p>
                  </div>

                  {/* Product */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Product</h3>
                    <ul className="space-y-2">
                      <li>
                        <a href="https://prism.jeffdev.studio" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                          Dashboard
                        </a>
                      </li>
                      <li>
                        <a href="https://prism.jeffdev.studio/pricing" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                          Pricing
                        </a>
                      </li>
                      <li>
                        <a href="/api-reference" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                          API Reference
                        </a>
                      </li>
                      <li>
                        <a href="/guide" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                          User Guide
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Company */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Company</h3>
                    <ul className="space-y-2">
                      <li>
                        <a href="https://jeffdev.studio" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                          About JD Studio
                        </a>
                      </li>
                      <li>
                        <a href="https://jeffdev.studio/contact" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                          Contact
                        </a>
                      </li>
                      <li>
                        <a href="https://github.com/J-Akiru5/jeffdev-monorepo" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-cyan-400 text-sm transition-colors">
                          GitHub
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* CTA */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Get Started</h3>
                    <p className="text-white/60 text-sm mb-4">
                      Ready to eliminate context pollution?
                    </p>
                    <a
                      href="https://prism.jeffdev.studio/sign-up"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block glass px-6 py-2 rounded-md hover:border-cyan-500/50 transition-all text-sm font-mono uppercase tracking-wider text-white"
                    >
                      Start Free →
                    </a>
                  </div>
                    </div>

                    <div className="border-t border-white/5 pt-8 pb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                      <p className="text-white/30 text-xs font-mono">
                        © {new Date().getFullYear()} JD Studio. Built with Prism Context Engine.
                      </p>
                      <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="https://jeffdev.studio/terms" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                          Terms
                        </a>
                        <a href="https://jeffdev.studio/privacy" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                          Privacy
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </Footer>
            }
            sidebar={{ defaultMenuCollapseLevel: 1 }}
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
