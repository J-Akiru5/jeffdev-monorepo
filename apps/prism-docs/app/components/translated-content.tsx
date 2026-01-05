'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, ReactNode } from 'react'

interface TranslatedContentProps {
  en: ReactNode
  tl?: ReactNode
  ja?: ReactNode
  es?: ReactNode
  id?: ReactNode
  ru?: ReactNode
  nl?: ReactNode
}

/**
 * Client component that renders different content based on the current locale.
 * Usage in MDX:
 * <TranslatedContent
 *   en="English text"
 *   tl="Tagalog text"
 *   ja="日本語テキスト"
 * />
 */
export function TranslatedContent({ en, tl, ja, es, id, ru, nl }: TranslatedContentProps) {
  const pathname = usePathname()
  const [locale, setLocale] = useState('en-US')

  useEffect(() => {
    if (!pathname) return
    const pathLocale = pathname.split('/')[1]
    setLocale(pathLocale || 'en-US')
  }, [pathname])

  // Return content based on locale, with fallback to English
  const contentMap: Record<string, ReactNode> = {
    'en-US': en,
    'en-GB': en,
    'tl': tl || en,
    'ja': ja || en,
    'es': es || en,
    'id': id || en,
    'ru': ru || en,
    'nl': nl || en,
  }

  return <>{contentMap[locale] || en}</>
}

/**
 * Hook to get the current locale from the URL
 */
export function useLocale() {
  const pathname = usePathname()
  const [locale, setLocale] = useState('en-US')

  useEffect(() => {
    if (!pathname) return
    const pathLocale = pathname.split('/')[1]
    setLocale(pathLocale || 'en-US')
  }, [pathname])

  return locale
}
