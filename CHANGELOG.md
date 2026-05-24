# Changelog

# 1.0.0 (2026-05-22)

### Bug Fixes

- add null check for db in updateFeatureFlags ([d1a14ef](https://github.com/J-Akiru5/jeffdev-monorepo/commit/d1a14efaf0a1416e2e0dac9cff03451e5671e7b9))
- **agency:** fix hydration mismatch in ThemeToggle by using null initial state instead of typeof window branch ([dbdc174](https://github.com/J-Akiru5/jeffdev-monorepo/commit/dbdc174fa8d89674eec0bfcaad180dad2bd5f0fd))
- **agency:** rebrand Syntaxure Labs to JeffDev Studio in about page ([7bf7798](https://github.com/J-Akiru5/jeffdev-monorepo/commit/7bf779897798cb730b65059f6b76551aae6f5b08))
- **agency:** resolve lint error in ThemeToggle by using useState initializer instead of setState in useEffect ([6773fdf](https://github.com/J-Akiru5/jeffdev-monorepo/commit/6773fdfe4f8c01aa381b981fcc0ae6dd73399bf4))
- Correct generated_subtitles placement for Mux direct uploads ([f60bd0a](https://github.com/J-Akiru5/jeffdev-monorepo/commit/f60bd0adbc17401edce8fb95f01c07d5aa3c2006))
- graceful fallback for missing Firebase credentials on Vercel build ([727ecd7](https://github.com/J-Akiru5/jeffdev-monorepo/commit/727ecd73ef83a519b7e85c6bd5d8b3aa96b8bbbe))
- Make embedding generation optional in webhook ([fe798a2](https://github.com/J-Akiru5/jeffdev-monorepo/commit/fe798a2bfa4d72c67b7c61e7ce734efc7e78f8fb))
- **prism-docs:** Add key to footer div for Nextra compatibility ([f7c21ae](https://github.com/J-Akiru5/jeffdev-monorepo/commit/f7c21ae7bb91a4d232ed4c05cb12dc8168bd1b99))
- **prism-docs:** Add safety checks to pageMap filter ([f2fd622](https://github.com/J-Akiru5/jeffdev-monorepo/commit/f2fd6228a304ed66923b127a3a5cf97c68497a54))
- **prism-docs:** Remove pageMap filtering - getPageMap already scoped ([f35b97b](https://github.com/J-Akiru5/jeffdev-monorepo/commit/f35b97b8fb9da4b56c3518b80beb8dfb545ccd5b))
- **prism-docs:** Restore Nextra layout with TranslatedContent component ([bef00cb](https://github.com/J-Akiru5/jeffdev-monorepo/commit/bef00cbdee9735b22f575acde65c48e064696bd2))
- **prism-docs:** Restructure translations to use dynamic page.tsx ([75d3f91](https://github.com/J-Akiru5/jeffdev-monorepo/commit/75d3f9167ceacc23ba971bd8c875339b3790ece8))
- **prism-docs:** Use current locale children for sidebar ([522c202](https://github.com/J-Akiru5/jeffdev-monorepo/commit/522c202f3a88a5a60844360bc89a8054ad531f2d))
- remove broken bin from prism-mcp-server, force-dynamic prism-admin layout to prevent Clerk build crash ([3b05910](https://github.com/J-Akiru5/jeffdev-monorepo/commit/3b059100e2a1625b43912ad411bdd7cbe9f163f9))
- remove ESLint warnings across prism-dashboard and prism-mcp-server ([ae45f28](https://github.com/J-Akiru5/jeffdev-monorepo/commit/ae45f28cd0ef65214fa8bfe975b0ed8b21efc14d))
- Resolve error in `dev_log.txt` indicating command failure with exit code 3221225786 ([5953624](https://github.com/J-Akiru5/jeffdev-monorepo/commit/59536248cddf01db8ce4888d9c2dcd9701f4daac))
- resolve TypeScript build error in agency admin service edit page and add missing turbo.json env vars ([c93ae81](https://github.com/J-Akiru5/jeffdev-monorepo/commit/c93ae81a7a723c8d04d3e1916094b2aedad49953))
- Update docs assistant UI to show Gemini 2.5 Flash ([5854ca5](https://github.com/J-Akiru5/jeffdev-monorepo/commit/5854ca5613e02a3f8f80802b1acfd827308ee522))
- Use stable gemini-1.5-flash model for docs assistant ([211dc6c](https://github.com/J-Akiru5/jeffdev-monorepo/commit/211dc6ca746db0ba717c0f9820b2c98516808e23))

### Features

- Add `next-env.d.ts` to `tracker` and `prism-admin` apps and update `pnpm-lock.yaml`. ([b75b481](https://github.com/J-Akiru5/jeffdev-monorepo/commit/b75b481b0306bedb52d6a15e382975cb578416c6))
- Add `prism-admin` application and implement Supabase authentication for `prism-exercise`. ([033f9af](https://github.com/J-Akiru5/jeffdev-monorepo/commit/033f9af631857ce8ab90cc850ff419d14bc9319a))
- add About pages for MHT and Agency, implement OG image generation script, and update branding assets ([a1db950](https://github.com/J-Akiru5/jeffdev-monorepo/commit/a1db950f085501d5ac32b7977e2a374ae224e93f))
- add admin notifications and service management pages with basic structure and functionality ([5178a5c](https://github.com/J-Akiru5/jeffdev-monorepo/commit/5178a5c0a2387b5e05fabe8b5d6550bc1eeb9780))
- add Agentic Protocol section with GSAP animations and structured content ([45590b3](https://github.com/J-Akiru5/jeffdev-monorepo/commit/45590b3d81b01ae2cbac4063770564aac5124a14))
- Add auto-captions, toast notifications, and upload warning ([de98f77](https://github.com/J-Akiru5/jeffdev-monorepo/commit/de98f772dbb77509e58a264c8078beec62324990))
- add full CLI interface for prism-dashboard with VS Code integration ([85e935b](https://github.com/J-Akiru5/jeffdev-monorepo/commit/85e935b03940a71f9912443c5bedd630d1451ab6))
- Add manifest.json for Prism Context Engine Documentation ([831af69](https://github.com/J-Akiru5/jeffdev-monorepo/commit/831af69781575630a7539049cd788351a46de789))
- Add Prism favicon pack to dashboard ([01fef81](https://github.com/J-Akiru5/jeffdev-monorepo/commit/01fef81c8e6f9f7551bf1ce25fb5c661b49486fd))
- add prism-docs, prism-cli, subscription UI, and AI kitchen ([25b6a33](https://github.com/J-Akiru5/jeffdev-monorepo/commit/25b6a3309c570d4915b67eed4a85901e16a13078))
- add the About page for the agency application, including studio overview, founder profile, stats, and tech stack. ([a9fdce6](https://github.com/J-Akiru5/jeffdev-monorepo/commit/a9fdce6258c79330e2a22760e7381be9e4cf4606))
- add theme configuration for Prism Context Engine documentation ([532f8b3](https://github.com/J-Akiru5/jeffdev-monorepo/commit/532f8b3784d38a396ed61c84c7402cc8f527a851))
- Add Video Library and Gemini AI rule enhancement ([34db564](https://github.com/J-Akiru5/jeffdev-monorepo/commit/34db5647a258071c39917f52f9931985e5b1b7c1))
- **agency:** add light/dark theme system with theme-toggle component ([363c12d](https://github.com/J-Akiru5/jeffdev-monorepo/commit/363c12dcb832e563f2bed7b861727cf3d656e13f))
- **agency:** implement left-aligned hero with neon bend and office image ([757f520](https://github.com/J-Akiru5/jeffdev-monorepo/commit/757f520363312bf80c3a16038e70defa34f4513d))
- **agency:** modernize agentic protocol with spotlight cards and terminal ui ([1a50051](https://github.com/J-Akiru5/jeffdev-monorepo/commit/1a50051dd7e33139e76dd8a51f563222aa9034ee))
- **agency:** update hero and header to match AI prompt specifications ([b247e47](https://github.com/J-Akiru5/jeffdev-monorepo/commit/b247e479355fa2040793f4ac40b442330adc35f6))
- **agentic-terminal:** add styles for terminal section in light mode ([ac8936b](https://github.com/J-Akiru5/jeffdev-monorepo/commit/ac8936bba8827839061deb075010236a4174a089))
- **api:** add authentication and subscription verification endpoints ([16add31](https://github.com/J-Akiru5/jeffdev-monorepo/commit/16add312ed39a35cd2b6772dc8d9e38228c67177))
- **create-turbo:** apply official-starter transform ([5b50bef](https://github.com/J-Akiru5/jeffdev-monorepo/commit/5b50befedb42c0f62ab96dff19f25806b81a41f7))
- **create-turbo:** apply package-manager transform ([c3553bd](https://github.com/J-Akiru5/jeffdev-monorepo/commit/c3553bd281f23102cb1c6d09a39bab4600def57e))
- **create-turbo:** create basic ([0ca0513](https://github.com/J-Akiru5/jeffdev-monorepo/commit/0ca05134b139e06c5535a4555517aaa581a1a29c))
- **docs:** Add comprehensive installation, integration, and usage guides for Prism Context Engine ([4a6c27b](https://github.com/J-Akiru5/jeffdev-monorepo/commit/4a6c27b02ab0ffd98b78cc56dbbfc6d6a8cd1b28))
- Enhance Prism Dashboard UI and functionality ([35a8189](https://github.com/J-Akiru5/jeffdev-monorepo/commit/35a81899bd96f7ef30640462b1d2d5f365810150))
- Enhance UI with fade-in animations and implement AI assistant API ([a0397c4](https://github.com/J-Akiru5/jeffdev-monorepo/commit/a0397c437db2fe857efb468398f90f1245b143bd))
- Enhance Video Library with Mux asset integration and error handling ([7b53117](https://github.com/J-Akiru5/jeffdev-monorepo/commit/7b53117b406f6e5281955770ba442c666705d047))
- Establish monorepo structure with new applications, shared packages, and comprehensive documentation for Prism products. ([9108063](https://github.com/J-Akiru5/jeffdev-monorepo/commit/91080632303974e36d8d80d2aa2ab2ffd4963437))
- Implement AI enhancement for rule editing and improve video detail and library pages ([ccbb043](https://github.com/J-Akiru5/jeffdev-monorepo/commit/ccbb0438f169bfc5e79f16f5c9e3f521d395ec70))
- implement features page with detailed descriptions and showcase section ([c000e89](https://github.com/J-Akiru5/jeffdev-monorepo/commit/c000e893f7e56052c45e3955d56666f60c740e5c))
- Implement initial versions of `agency`, `prism-dashboard`, `prism-admin`, and `prism-mcp-server` applications, including extensive localized documentation for `prism-docs`. ([8fb6ef0](https://github.com/J-Akiru5/jeffdev-monorepo/commit/8fb6ef04fdfb351d3412ac7833fba6a811e3b30d))
- implement new UI components and quote page for mht app ([f25b7c4](https://github.com/J-Akiru5/jeffdev-monorepo/commit/f25b7c41ddeb6575f1bf3649334f5ca02500fbd2))
- implement privacy policy and terms of service pages with reusable legal layout components ([c096814](https://github.com/J-Akiru5/jeffdev-monorepo/commit/c0968140b8635abcfb4078839d18729a58ee0377))
- implement SEO metadata, sitemap, robots.txt, and dynamic Open Graph image generation for MHT application ([e36e801](https://github.com/J-Akiru5/jeffdev-monorepo/commit/e36e80125cdfc6345749fe630f8cd64659d1e19d))
- initialize MHT landing page with core Nexure and Joularix service sections ([8875e90](https://github.com/J-Akiru5/jeffdev-monorepo/commit/8875e90f02c87496e6c3645cb3f50cff9cd4f56d))
- Initialize new `agency`, `prism-dashboard`, `prism-admin`, and `prism-mcp-server` applications, a multi-language `prism-docs` site, and shared UI components. ([a0d2535](https://github.com/J-Akiru5/jeffdev-monorepo/commit/a0d25352576a2e688df10bb260b1ad3de9933a11))
- Initialize Prism Dashboard app with its README and core navigation layout. ([32fdd47](https://github.com/J-Akiru5/jeffdev-monorepo/commit/32fdd473d4e7310ef841dfc9c935800fd7fd426c))
- Introduce a shared chat assistant UI component in `packages/ui` with an API route, and add a new email sending utility to the `agency` app. ([8211eee](https://github.com/J-Akiru5/jeffdev-monorepo/commit/8211eee7752f999726f9ad77a4a1e2c4441ae8a4))
- **mcp-server:** implement video transcript schema and search tool ([3a409e9](https://github.com/J-Akiru5/jeffdev-monorepo/commit/3a409e947bb21c11c9630a981317ad915a39d19b))
- prism system improvements - dashboard UX, CLI, docs, onboarding ([44fb040](https://github.com/J-Akiru5/jeffdev-monorepo/commit/44fb040b1194c932117965bca97622ad36f62010))
- **prism-docs:** Add actual translations for Tagalog and Japanese ([18cea6c](https://github.com/J-Akiru5/jeffdev-monorepo/commit/18cea6c5cbc56fb173631f388f96a77acdbc4a38))
- **prism-docs:** Filter locale folders from sidebar navigation ([eb65c61](https://github.com/J-Akiru5/jeffdev-monorepo/commit/eb65c61925edd4abfe39b89f23c8fcdeabed0051))
- **prism-docs:** Full locale folders with proper Nextra layout ([65c1804](https://github.com/J-Akiru5/jeffdev-monorepo/commit/65c180488ba3e037a207782d7f23660f7b6beb37))
- **prism-docs:** Locale-aware sidebar with translated labels ([48e4f78](https://github.com/J-Akiru5/jeffdev-monorepo/commit/48e4f784cf444e67ed09484cec2ecfc063de1f9e))
- **prism-docs:** Multi-language infrastructure + UI fixes ([bb27fa6](https://github.com/J-Akiru5/jeffdev-monorepo/commit/bb27fa6e73f305bfc5a16e1d97bf55bef8bf1356))

All notable changes to the Prism Context Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Team Sync feature for shared rules across developers
- VS Code native MCP integration
- Rule import from `.cursorrules` files

---

## [0.1.3] - 2026-01-03

### Added

#### Prism Dashboard (`apps/prism-dashboard`)

- **Brand Management System**: Enterprise branding capture and multi-IDE export
  - Brand profile creation with colors, typography, voice, and imagery
  - Export formats: Cursor, Windsurf, VS Code, Claude Desktop, CSS, Tailwind
  - Brand list and detail pages with visual previews
- **Video Context Pipeline**: Mux integration for video-based rule extraction
  - Video upload component with Mux integration
  - Azure OpenAI transcript processing
  - Webhook handlers for automated rule generation
- **AI Component Generator**: Gemini-powered component creation
  - AI Kitchen interface for design system-aware components
  - Component generation API endpoint
- **Documentation**: CHANGELOG.md structure per documentation standards

#### Documentation (`apps/prism-docs`)

- Updated changelog with v0.1.3 release notes

### Changed

- Version bumped to 0.1.3 across all packages
- Documentation organization aligned with standards

---

## [0.1.0] - 2026-01-01

### 🎉 The Genesis Release

**Milestone**: Prism MCP Server successfully connected to Azure Cosmos DB.
Cursor can now query architectural rules directly from the database.

### Added

#### MCP Server (`apps/prism-mcp-server`)

- `get_architectural_rules` tool - Fetch rules by category/tag
- `validate_code_pattern` tool - Check code for violations
- Resources: `prism://rules/all`, `prism://rules/architecture`
- StdioServerTransport for editor integration

#### Database (`packages/db`)

- Firebase Admin singleton for Agency app
- MongoDB client for Azure Cosmos DB
- Zod schemas: User, Rule, RuleSet, Project, Invoice
- Genesis seed script with 6 core rules

#### Documentation (`apps/prism-docs`)

- 11 documentation pages with Nextra 4
- Getting Started guide
- Rules creation guide
- Editor Setup (Cursor, VS Code/Cline, CLI agents)
- API Reference (MCP Server, Database)

#### UI Library (`@jdstudio/ui`)

- Ghost Glow Button (5 variants)
- Glass Panel Card (4 variants + subcomponents)
- Input (3 variants with label/error)
- Badge (8 variants including semantic + category)
- ProgressBar (extracted from Agency)
- DataTable (TanStack Table integration)

#### Prism Dashboard (`apps/prism-dashboard`)

- Scaffolded with Next.js 16
- Clerk authentication configured
- Landing page with JeffDev aesthetic
- Protected dashboard route

### Core Rules Seeded

1. Visual Constitution (styling)
2. Tech Stack Protocol (architecture)
3. Monorepo Geography (architecture)
4. Security Guard (security)
5. No Cross-App Imports (architecture)
6. Zod Validation Gate (security)

---

## Version History

| Version | Date       | Highlight                                    |
| ------- | ---------- | -------------------------------------------- |
| 0.1.3   | 2026-01-03 | 🎨 Brand Management + Video Context Pipeline |
| 0.1.0   | 2026-01-01 | 🌱 Genesis - MCP Server + DB Connected       |
