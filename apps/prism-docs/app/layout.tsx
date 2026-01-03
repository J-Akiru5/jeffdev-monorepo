import type { Metadata } from 'next'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Prism Context Engine',
    default: 'Prism Context Engine Documentation'
  },
  description: 'Context Governance for LLMs',
  applicationName: 'Prism Context Engine',
  icons: {
    icon: '/favicon.ico'
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pageMap = await getPageMap()

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          banner={<Banner storageKey="prism-docs-banner">Prism Context Engine v1.0.0 Released!</Banner>}
          navbar={
            <Navbar 
              logo={
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  <span style={{ color: '#06b6d4' }}>◈</span> Prism Context Engine
                </span>
              }
              projectLink="https://github.com/jeffdev/jeffdev-monorepo"
            />
          }
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/jeffdev/jeffdev-monorepo/tree/main/apps/prism-docs"
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
      </body>
    </html>
  )
}
