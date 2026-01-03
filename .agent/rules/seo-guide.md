---
trigger: always_on
---

# 🔍 JEFFDEV MONOREPO - SEO & METADATA PROTOCOLS

## 1. CORE STRATEGY: "THE AUTHORITY SIGNAL"

*Goal: We do not compete for "Freelancer" keywords. We compete for "Architecture" keywords.*

### A. Title Taxonomy

* **Agency (`jeffdev.studio`):**
* *Template:* `%s // JeffDev Studio`
* *Voice:* Enterprise, Architectural, Heavy.
* *Good:* "Enterprise Systems Architecture // JeffDev Studio"
* *Bad:* "Web Design Services - JeffDev"


* **Prism SaaS (`prism.jeffdev.studio`):**
* *Template:* `%s | Prism Context Engine`
* *Voice:* Technical, Tool-focused.
* *Good:* "Context Governance for LLMs | Prism Context Engine"



### B. The "No-Index" Filter

* **Rule:** If a page is not "Alpha-Ready" (e.g., a half-baked internal tool or client portal), strictly apply:
```typescript
export const metadata: Metadata = { robots: "noindex, nofollow" }

```


* **Why:** Only index your "Endgame" content. Don't let Google see your messy drafts.

## 2. NEXT.JS 16 IMPLEMENTATION

### A. The Metadata API (Server-Side)

* **Static:** Use `export const metadata` in `layout.tsx` for global fallbacks.
* **Dynamic:** Use `generateMetadata` for Case Studies and Doc Pages.
* *Requirement:* Titles must be truncated to 60 chars. Descriptions to 160 chars.



### B. Programmatic Open Graph (The "Link Flex")

* **Technology:** `next/og` (`ImageResponse`).
* **Design System:**
* **Background:** `#050505` (Void) with the `grid-pattern`.
* **Foreground:** "JeffDev" Logo (Bottom Right).
* **Dynamic Text:** Huge `Inter` Bold Heading + `JetBrains Mono` Subtitle (e.g., "ID: CASE-004").


* **Why:** When you drop a link in Discord/Slack, it must look like a "System Alert," not a blog post.

## 3. STRUCTURED DATA (THE "SCHEMATIC")

*We speak Google's native language (JSON-LD).*

### A. Agency Schema (`apps/agency`)

* **Type:** `ProfessionalService` & `Corporation`.
* **Inject:** Into Root Layout.

```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "JeffDev Studio",
  "founder": "Jeff Edrick Martinez",
  "legalName": "JeffDev Web Development Services",
  "taxID": "VLLP979818395984",
  "priceRange": "$$$$",
  "knowsAbout": ["Next.js", "Cloud Architecture", "LLM Orchestration"],
  "image": "https://jeffdev.studio/brand/og-main.png"
}

```

### B. Prism Product Schema (`apps/prism-dashboard`)

* **Type:** `SoftwareApplication`.
* **Why:** This makes "Prism Context Engine" show up as a Tool/App in search results, distinct from your agency services.

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Prism Context Engine",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Cloud, VS Code",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}

```

## 4. TECHNICAL SEO (MONOREPO HYGIENE)

### A. Canonical Strategy

* **Rule:** Every page MUST self-reference its canonical URL to prevent "Duplicate Content" penalties if users access via `www` vs non-www.
```typescript
metadataBase: new URL('https://jeffdev.studio'),
alternates: { canonical: '/' }

```



### B. Sitemap & Robots

* **Implementation:** Use Next.js 16's native `app/sitemap.ts` and `app/robots.ts`.
* **Separation:**
* `apps/agency/app/sitemap.ts` -> Maps the marketing site.
* `apps/prism-docs/app/sitemap.ts` -> Maps the documentation.
* `apps/prism-dashboard` -> **NO SITEMAP** (It is a private app behind auth).

