import Image from 'next/image'

const config = {
  logo: (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Image 
        src="/prism-icon.png" 
        alt="Prism" 
        width={28} 
        height={28}
        style={{ objectFit: 'contain' }}
      />
      <span className="text-gradient-cyan" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
        Prism Context Engine
      </span>
    </div>
  ),
  project: {
    link: 'https://github.com/J-Akiru5/jeffdev-monorepo'
  },
  docsRepositoryBase: 'https://github.com/J-Akiru5/jeffdev-monorepo/tree/main/apps/prism-docs',
  useNextSeoProps() {
    return {
      titleTemplate: '%s | Prism Context Engine'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Prism Context Engine" />
      <meta property="og:description" content="AI-powered context governance for LLMs" />
    </>
  ),
  primaryHue: 189, // Cyan
  darkMode: false,
  nextThemes: {
    defaultTheme: 'dark',
    forcedTheme: 'dark'
  },
  search: {
    placeholder: 'Search documentation...'
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true
  },
  footer: {
    text: (
      <span>
        {new Date().getFullYear()} ©{' '}
        <a href="https://jeffdev.studio" target="_blank" rel="noopener noreferrer">
          JeffDev Studio
        </a>
        . Built with Prism Context Engine.
      </span>
    )
  },
  editLink: {
    text: 'Edit this page on GitHub'
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback'
  },
  toc: {
    backToTop: true,
    title: 'On This Page'
  },
  navigation: {
    prev: true,
    next: true
  },
  gitTimestamp: true
}

export default config
