import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'
import Link from 'next/link'
import type { ReactNode } from 'react'

// Custom Card Component for Nextra 4
function Card({ 
  title, 
  href, 
  children 
}: { 
  title: string
  href: string
  children?: ReactNode 
}) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-white/20 hover:bg-white/[0.04]"
    >
      <h3 className="mb-2 font-semibold text-white group-hover:text-cyan-400 transition-colors">
        {title} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </h3>
      {children && (
        <span className="text-sm text-white/60 block">{children}</span>
      )}
    </Link>
  )
}

// Cards Grid Container
function Cards({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {children}
    </div>
  )
}

// Get the default MDX components from theme
const themeComponents = getThemeComponents()

// Merge with custom components
export function useMDXComponents(components?: Record<string, React.ComponentType>) {
  return {
    ...themeComponents,
    Card,
    Cards,
    ...components
  }
}
