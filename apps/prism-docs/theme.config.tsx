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
      <span style={{
        position: 'relative',
        top: '-6px',
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        background: 'linear-gradient(to right, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        padding: '2px 6px',
        fontSize: '9px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#22d3ee',
        boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        Beta
      </span>
    </div>
  ),
  banner: {
    key: 'beta-notice',
    text: (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '9999px',
          background: 'rgba(6, 182, 212, 0.2)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          padding: '2px 8px',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#22d3ee'
        }}>
          Beta
        </span>
        Prism Context Engine is currently in beta. Some features are still being refined.
      </span>
    ),
    dismissible: true
  },
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
      <meta property="og:title" content="Prism Context Engine (Beta)" />
      <meta property="og:description" content="AI-powered context governance for LLMs - Currently in Beta" />
    </>
  ),
  primaryHue: 189, // Cyan
  darkMode: false,
  nextThemes: {
    defaultTheme: 'dark',
    forcedTheme: 'dark'
  },
  i18n: [
    { locale: 'en-US', text: 'English (US)' },
    { locale: 'tl', text: 'Tagalog' },
    { locale: 'ja', text: '日本語' },
    { locale: 'es', text: 'Español' },
    { locale: 'id', text: 'Bahasa Indonesia' },
    { locale: 'en-GB', text: 'English (UK)' },
    { locale: 'ru', text: 'Русский' },
    { locale: 'nl', text: 'Nederlands' }
  ],
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
        <a href="https://syntaxurelabs.com" target="_blank" rel="noopener noreferrer">
          Syntaxure Labs
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
