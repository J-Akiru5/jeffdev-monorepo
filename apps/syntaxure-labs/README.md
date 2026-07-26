# Syntaxure Labs

Public-facing marketing website and client portal for Syntaxure Labs — a B2B digital transformation agency based in Iloilo City, Philippines. Built with Next.js 16 and Supabase.

## Tech Stack

| Layer           | Technology                                           |
| --------------- | ---------------------------------------------------- |
| Framework       | Next.js 16 (App Router, React 19)                    |
| Language        | TypeScript 5.9                                       |
| Styling         | Tailwind CSS v4, next-themes (dark/light)            |
| Database / Auth | Supabase                                             |
| Email           | Resend                                               |
| AI              | Google Gemini (chat assistant)                       |
| Payments        | PayPal, Maya (PayMaya)                               |
| Scheduling      | FullCalendar                                         |
| PDF             | @react-pdf/renderer                                  |
| Testing         | Vitest (unit), Playwright (E2E)                      |
| Shared packages | @syntaxure/ui, @syntaxure/supabase, @syntaxure/redis |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9.1.0+
- Doppler CLI (for secrets)

### Setup

```bash
# From the monorepo root
pnpm install

# Copy environment variables
cp apps/syntaxure-labs/.env.example apps/syntaxure-labs/.env.local
# Fill in .env.local with your Supabase credentials and API keys
```

### Development

```bash
# Start just this app (port 3000)
pnpm --filter syntaxure-labs run dev

# Or via Doppler with secrets
doppler run -- pnpm --filter syntaxure-labs run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
# Unit tests
pnpm --filter syntaxure-labs run test:unit

# E2E tests
pnpm --filter syntaxure-labs run test:e2e

# Both unit + E2E
pnpm --filter syntaxure-labs run test
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── about/              # About page (mission, team, Kwadra TBI)
│   ├── actions/            # Server actions (blog, contact, quote, payments, etc.)
│   ├── api/                # API routes (assistant, webhooks, health, exchange-rate)
│   ├── auth/               # OAuth callback, invite acceptance
│   ├── blog/               # Blog listing & article pages
│   ├── card/               # Public digital namecards (/card/[username])
│   ├── community/          # Community releases, discussions, registration
│   ├── contact/            # Contact form page
│   ├── features/           # Features/comparison page
│   ├── oauth/              # OAuth consent screen
│   ├── pay/                # Invoice payment & Maya checkout pages
│   ├── pricing/            # Pricing tiers, care plans, comparisons
│   ├── prism/              # Prism Context Engine teaser
│   ├── products/           # Product catalog & detail pages
│   ├── quote/              # Quote request form
│   ├── services/           # Services grid & detail pages
│   ├── work/               # Portfolio/case studies
│   └── legal/              # Privacy, Terms, Cookies
├── components/             # React components
│   ├── layout/             # Header, footer
│   ├── sections/           # Homepage sections (hero, services, works, etc.)
│   ├── payments/           # Payment button, GCash upload
│   ├── pricing/            # Pricing cards, comparison, FAQ
│   ├── products/           # Product cards, comparison
│   ├── invoice/            # PDF invoice generation
│   ├── providers/          # Theme, feature flag providers
│   ├── ui/                 # Theme toggle, price display, markdown renderer
│   └── chat-assistant-client.tsx  # AI chatbot widget
├── contexts/               # Currency context
├── hooks/                  # Custom React hooks
├── lib/                    # Supabase clients, data layer, CMS, email, utils
└── types/                  # TypeScript type definitions
```

## Pages

| Route                 | Description                                         |
| --------------------- | --------------------------------------------------- |
| `/`                   | Homepage — hero, services, portfolio, features, FAQ |
| `/about`              | About — team, mission, values, Kwadra TBI           |
| `/services`           | Services catalog                                    |
| `/services/[slug]`    | Individual service detail                           |
| `/work`               | Portfolio / case studies                            |
| `/work/[slug]`        | Individual project detail                           |
| `/features`           | Feature comparison                                  |
| `/pricing`            | Pricing plans                                       |
| `/products`           | Product templates catalog                           |
| `/products/[slug]`    | Product detail with billing options                 |
| `/blog`               | Blog listing                                        |
| `/blog/[slug]`        | Blog article                                        |
| `/contact`            | Contact form                                        |
| `/quote`              | Quote request form                                  |
| `/community`          | Community hub (releases, discussions)               |
| `/community/register` | Community member registration                       |
| `/prism`              | Prism Context Engine teaser                         |
| `/card/[username]`    | Digital namecard                                    |
| `/pay/[refNo]`        | Invoice payment page                                |
| `/pay/maya/success`   | Maya payment confirmation                           |
| `/pay/maya/cancel`    | Maya payment cancellation                           |
| `/privacy`            | Privacy policy                                      |
| `/terms`              | Terms of service                                    |
| `/cookies`            | Cookie policy                                       |

## Environment Variables

| Variable                        | Required | Purpose                                            |
| ------------------------------- | -------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anonymous key                             |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Supabase service role key                          |
| `RESEND_API_KEY`                | Yes      | Email delivery (Resend)                            |
| `GEMINI_API_KEY`                | Yes      | AI chat assistant (Google Gemini)                  |
| `PAYPAL_CLIENT_ID`              | —        | PayPal checkout                                    |
| `PAYPAL_CLIENT_SECRET`          | —        | PayPal checkout                                    |
| `PAYPAL_MODE`                   | —        | `sandbox` or `live`                                |
| `MAYA_PUBLIC_KEY`               | —        | Maya payment gateway                               |
| `MAYA_SECRET_KEY`               | —        | Maya payment gateway                               |
| `MAYA_WEBHOOK_SECRET`           | —        | Maya webhook HMAC                                  |
| `EXCHANGE_RATE_API_KEY`         | —        | Currency conversion                                |
| `NEXT_PUBLIC_ADMIN_URL`         | —        | prism-admin URL (default: `http://localhost:3004`) |
| `COOKIE_DOMAIN`                 | —        | Cross-subdomain auth (e.g., `.syntaxure.dev`)      |

## Architecture Notes

- **Data fetching:** Supabase-first with static fallbacks. Marketing pages use ISR (`revalidate: 60-300s`), transactional pages use `force-dynamic`.
- **CMS:** Structured content in `page_sections` table, keyed by `page_slug` + `section_key`.
- **Auth:** Supabase Auth (Google SSO) with invite-based team onboarding. Admin routes (`/admin/*`) proxy to prism-admin.
- **AI Assistant:** Floating chatbot on all pages, powered by Google Gemini with rate limiting (Redis) and topic guard rails.
- **Payments:** PayPal (create/capture orders) and Maya (checkout + subscriptions) via webhooks with HMAC verification.
- **SEO:** JSON-LD structured data, dynamic OG images, sitemap, robots.txt, PWA manifest.
- **Email:** All transactional emails via Resend (`src/lib/email.ts`).

## Deployment

Deployed on Vercel. Configuration in `vercel.json`:

```json
{
  "buildCommand": "pnpm turbo build --filter=syntaxure-labs",
  "installCommand": "pnpm install --frozen-lockfile",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

A `Dockerfile` is also available for containerized deployments (port 3000).
