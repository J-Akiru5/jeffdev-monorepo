'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Import all translation files
import enUS from '@/locales/en-US.json'
import tl from '@/locales/tl.json'
import ja from '@/locales/ja.json'

type TranslationData = typeof enUS

const translations: Record<string, TranslationData> = {
  'en-US': enUS,
  'tl': tl,
  'ja': ja,
  // Fallback to English for other locales (placeholder)
  'es': enUS,
  'id': enUS,
  'en-GB': enUS,
  'ru': enUS,
  'nl': enUS,
}

const DEFAULT_LOCALE = 'en-US'
const SUPPORTED_LOCALES = ['en-US', 'tl', 'ja', 'es', 'id', 'en-GB', 'ru', 'nl']

/**
 * Custom hook for accessing translated strings
 * @returns Translation functions and current locale
 */
export function useTranslation() {
  const pathname = usePathname()
  const [locale, setLocale] = useState(DEFAULT_LOCALE)
  const [t, setT] = useState<TranslationData>(enUS)

  useEffect(() => {
    if (!pathname) return

    // Extract locale from pathname (e.g., /ja/introduction -> ja)
    const pathLocale = pathname.split('/')[1] ?? ''
    
    if (SUPPORTED_LOCALES.includes(pathLocale)) {
      setLocale(pathLocale)
      setT(translations[pathLocale] ?? enUS)
    }
  }, [pathname])

  /**
   * Get translated string by key path
   * @param keyPath - Dot-separated path like "home.title" or "cards.quick_start"
   * @returns Translated string or the key path if not found
   */
  const translate = (keyPath: string): string => {
    const keys = keyPath.split('.')
    let value: any = t

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        // Return key path if translation not found
        return keyPath
      }
    }

    return typeof value === 'string' ? value : keyPath
  }

  return {
    locale,
    t,
    translate,
    // Direct access to translation sections
    common: t.common,
    nav: t.nav,
    footer: t.footer,
    home: t.home,
    cards: t.cards,
  }
}

/**
 * Get translation data for a specific locale (for server components)
 */
export function getTranslation(locale: string): TranslationData {
  return translations[locale] || enUS
}
