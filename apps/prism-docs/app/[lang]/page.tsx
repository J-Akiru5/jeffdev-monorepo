import { notFound } from 'next/navigation'

// Import all locale-specific content
import EnContent from '@/content/en-US/page.mdx'
import TlContent from '@/content/tl/page.mdx'
import JaContent from '@/content/ja/page.mdx'

// Map locales to their content components
const contentMap: Record<string, React.ComponentType> = {
  'en-US': EnContent,
  'en-GB': EnContent, // Falls back to English
  'tl': TlContent,
  'ja': JaContent,
  // Other locales fall back to English
  'es': EnContent,
  'id': EnContent,
  'ru': EnContent,
  'nl': EnContent,
}

interface PageProps {
  params: Promise<{ lang: string }>
}

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params
  
  const Content = contentMap[lang]
  
  if (!Content) {
    // If locale not found, use English as fallback
    const FallbackContent = contentMap['en-US']
    return <FallbackContent />
  }
  
  return <Content />
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return [
    { lang: 'en-US' },
    { lang: 'tl' },
    { lang: 'ja' },
    { lang: 'es' },
    { lang: 'id' },
    { lang: 'en-GB' },
    { lang: 'ru' },
    { lang: 'nl' },
  ]
}
