# Changelog - Prism Context Engine Docs

All notable changes to the Prism Context Engine documentation site will be documented in this file.

## [1.0.3] - 2026-01-03

### ✨ Added
- **FlexSearch Integration**: Switched from Pagefind to Nextra FlexSearch for better search performance
- **JD Studio Endgame Design**: Complete design system overhaul matching agency branding
- **Enhanced Footer**: 4-column footer with links to dashboard, company info, and CTAs
- **Meta Tags**: Comprehensive OpenGraph and Twitter card metadata for social sharing
- **PWA Support**: Multiple favicon sizes (16px, 32px, 180px, 192px, 512px) and web manifest
- **Kitchen Metaphor**: Explanatory table comparing Kitchen (SaaS) / Recipe (Rules) / Waiter (MCP)

### 🎨 Design System
- **Dark Theme**: Forced dark mode with cyan (#06b6d4) primary hue
- **Custom CSS**: 400+ lines of Nextra theme overrides for consistent branding
- **Typography**: Inter (UI) + JetBrains Mono (code) matching dashboard
- **Glass Effects**: Glass morphism components with backdrop-blur
- **Gradient Text**: Cyan-to-purple gradient utilities
- **Grid Background**: Dark grid with noise texture overlay

### 🔍 Search Enhancements
- **Provider**: FlexSearch with codeblocks indexing enabled
- **Configuration**: `flexsearch: { codeblocks: true }` for comprehensive search
- **Performance**: Client-side search index for instant results

### 📝 Content Improvements
- **Landing Page**: Updated with "Context Operating System for Vibecoders" tagline
- **Branding**: All references updated to "Prism Context Engine"
- **Version Display**: v1.0.3 shown in footer

### 🔧 Technical Updates
- **Nextra 4.x**: Latest docs framework with enhanced features
- **Next.js 16**: App Router with improved performance
- **Theme Config**: Custom `theme.config.tsx` with logo, links, and footer
- **Version**: Package bumped to 1.0.3

---

## [0.1.0] - 2025-12-31

### Initial Release
- Basic Nextra documentation structure
- API Reference, Guide, and Rules sections
- Changelog tracking

---

## Format
This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
