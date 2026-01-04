import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'
import { Callout, Steps, Tabs } from 'nextra/components'
import Link from 'next/link'
import type { ReactNode, ReactElement } from 'react'

// Icon wrapper for Card component
function CardIcon({ children }: { children: ReactNode }) {
  return (
    <div className="card-icon-container">
      {children}
    </div>
  )
}

// Custom Card Component for Nextra 4 - Windsurf Style
function Card({ 
  title, 
  href, 
  icon,
  children 
}: { 
  title: string
  href: string
    icon?: ReactElement
  children?: ReactNode 
}) {
  return (
    <Link
      href={href}
      className="nextra-card group"
    >
      {icon && (
        <CardIcon>{icon}</CardIcon>
      )}
      <div className="card-content">
        <h3 className="card-title">
          {title}
        </h3>
        {children && (
          <span className="card-description">{children}</span>
        )}
      </div>
    </Link>
  )
}

// Cards Grid Container - Windsurf 2x3 Layout
function Cards({ children }: { children: ReactNode }) {
  return (
    <div className="nextra-cards">
      {children}
    </div>
  )
}

// Feature Card - For larger feature highlights
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon?: ReactElement
  title: string
  description: string
}) {
  return (
    <div className="feature-card">
      {icon && (
        <div className="feature-icon">{icon}</div>
      )}
      <h4 className="feature-title">{title}</h4>
      <p className="feature-description">{description}</p>
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
    FeatureCard,
    Callout,
    Steps,
    Tabs,
    ...components
  }
}

