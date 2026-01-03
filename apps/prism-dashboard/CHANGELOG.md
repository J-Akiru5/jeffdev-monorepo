# Changelog

All notable changes to the Prism Context Engine Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.0.3] - 2026-01-03

### ✨ Added
- **Animated Landing Page**: GSAP ScrollTrigger-powered hero section with parallax effects
- **Authentication System**: Complete Clerk integration with session management
- **Subscription Management**: PayPal integration for Pro tier subscriptions with success/cancelled flows
- **Pricing Page**: Tiered pricing (Free/Pro) with feature comparison
- **API Endpoints**: Subscription verification and PayPal webhook handling
- **Version Badge**: Live version display (v1.0.3) in hero section
- **Global Navigation**: Links to docs.jeffdev.studio and jeffdev.studio

### 🎨 Design & Branding
- **Unified Branding**: Complete rebrand to "Prism Context Engine" across all UI
- **JD Studio Endgame Theme**: 
  - Void black (#050505) background
  - Cyan (#06b6d4) primary, purple (#8b5cf6) accent
  - Glass morphism with advanced backdrop-blur
  - Inter font for UI, JetBrains Mono for code
- **Responsive Footer**: 4-column layout with Products, Company, and CTA sections
- **CSS Refinements**: Webkit vendor prefix fixes for cross-browser compatibility

### 🔧 Technical Improvements
- **SEO Optimization**: OpenGraph and Twitter card meta tags
- **Version Management**: Package version updated to 1.0.3
- **TypeScript Strict Mode**: Enhanced type safety
- **Accessibility**: Improved semantic HTML and ARIA labels

---

## [0.1.3] - 2026-01-03

### Added

#### Brand Management System
- Brand profile creation and management interface
- Enterprise branding capture (colors, typography, voice, imagery)
- Multi-IDE export functionality:
  - Cursor (`.cursorrules`)
  - Windsurf (`.windsurfrules`)
  - VS Code (settings.json snippet)
  - Claude Desktop (`CLAUDE.md`)
  - CSS custom properties (`brand-tokens.css`)
  - Tailwind config theme extension
- Brand list and detail pages with visual color previews

#### Video Context Pipeline
- Mux video upload integration for context capture
- Video transcript processing workflow
- Azure OpenAI integration for rule extraction from video transcripts
- Webhook handlers for Mux video processing events

#### AI Component Generator
- AI Kitchen interface for component generation
- Gemini AI integration for design system-aware component creation
- Component generation API endpoint

#### Documentation
- CHANGELOG.md in `apps/prism-dashboard` per documentation standards
- Documentation structure following JEFFDEV Monorepo Documentation Standards
- Build log entries for tracking changes

### Changed
- Documentation organization aligned with `.agent/rules/documentation-standards.md`
- Version bumped to 0.1.3 across all packages

### Infrastructure
- Enhanced project management with brand associations
- Improved dashboard layout and navigation
- Subscription handling improvements

---

## [0.1.0] - 2026-01-01

### Added

#### Initial Setup
- Scaffolded with Next.js 16 (App Router)
- Clerk authentication configured
- Landing page with JeffDev aesthetic
- Protected dashboard route

#### Core Features
- User authentication and authorization
- Dashboard layout and navigation
- Project management interface
- Subscription handling with PayPal integration
- AI component generator with Gemini integration
- Video context uploader with Mux integration

#### Infrastructure
- TypeScript configuration
- Tailwind CSS v4 styling
- ESLint configuration
- Shared UI components from `@jdstudio/ui`
- Database integration via `@jeffdev/db`

---

