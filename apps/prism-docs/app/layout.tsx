import type { Metadata } from 'next'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Inter, JetBrains_Mono } from 'next/font/google'
import 'nextra-theme-docs/style.css'
import './globals.css'
import Image from 'next/image'

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
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/prism-icon.png', type: 'image/png' },
    ],
    apple: '/prism-icon.png',
  },
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
            banner={<Banner storageKey="prism-docs-banner">🎉 Prism Context Engine v1.0.0 - Now with Azure OpenAI Video Processing!</Banner>}
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
                <span>
                  {new Date().getFullYear()} ©{' '}
                  <a href="https://jeffdev.studio" target="_blank" rel="noopener noreferrer">
                    JeffDev Studio
                  </a>
                  . Built with Prism Context Engine.
                </span>
              </Footer>
            }
            sidebar={{ defaultMenuCollapseLevel: 1 }}
            editLink="Edit on GitHub"
          >
            {children}
          </Layout>
        </div>
      </body>
    </html>
  )
}
