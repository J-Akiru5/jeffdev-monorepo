# Syntaxure Labs — Implementation Plan

**Project:** High-Performance B2B Agency Satellite Site  
**Framework:** Next.js 16 (App Router) + Tailwind v4 + Supabase  
**Last Updated:** June 7, 2026

---

## Current State

| Layer      | Status      | Technology                   |
| ---------- | ----------- | ---------------------------- |
| Framework  | ✅ Ready    | Next.js 16 (App Router)      |
| Styling    | ✅ Ready    | Tailwind v4 + CSS tokens     |
| Scroll     | ✅ Ready    | Lenis smooth scroll          |
| Utils      | ✅ Ready    | `cn()` utility               |
| Components | ✅ Ready    | Header, Hero, Services, etc  |
| Backend    | ✅ Ready    | Supabase (Auth, DB, Storage) |
| Email      | ✅ Ready    | Resend                       |
| Payments   | ✅ Ready    | Maya + PayPal                |
| Blog       | ✅ Ready    | Supabase blog_posts table    |
| Admin      | ✅ Separate | prism-admin app (port 3004)  |

---

## Architecture

### App Structure

```
src/app/
├── page.tsx              # Homepage (Hero + Services + CTA)
├── about/page.tsx        # About Studio + Founder
├── blog/
│   ├── page.tsx          # Blog listing
│   └── [slug]/page.tsx   # Blog post detail
├── community/
│   ├── page.tsx          # Community discussions
│   └── register/page.tsx # Community registration
├── contact/page.tsx      # Contact form
├── features/page.tsx     # Features page
├── pricing/page.tsx      # Pricing page
├── prism/page.tsx        # Prism Context Engine page
├── products/
│   ├── page.tsx          # Products listing
│   └── [slug]/page.tsx   # Product detail
├── quote/page.tsx        # Multi-step quote form
├── services/
│   ├── page.tsx          # Services grid
│   └── [slug]/page.tsx   # Service detail
├── work/
│   ├── page.tsx          # Case studies
│   └── [slug]/page.tsx   # Project detail
├── terms/page.tsx        # Terms of service
├── privacy/page.tsx      # Privacy policy
├── cookies/page.tsx      # Cookie policy
├── card/[username]/page.tsx  # Public digital namecard
├── pay/[refNo]/page.tsx  # Payment page
└── auth/                 # Auth callback & invite
```

### Admin (Separate App: prism-admin)

Admin functionality lives in the dedicated `prism-admin` app (port 3004):

- `/admin/agency/*` — Agency management (projects, services, quotes, messages, blog, etc.)
- `/admin/*` — Platform management (users, subscriptions, products, settings)

**syntaxure-labs does NOT contain admin routes.**

### Backend (Supabase)

| Table               | Purpose                      |
| ------------------- | ---------------------------- |
| `quotes`            | Multi-step quote submissions |
| `messages`          | Contact form submissions     |
| `projects`          | Case studies / portfolio     |
| `services`          | Service offerings            |
| `blog_posts`        | Blog content                 |
| `testimonials`      | Client testimonials          |
| `community_posts`   | Community discussions        |
| `community_members` | Community members            |
| `product_templates` | SaaS product templates       |
| `invoices`          | Billing                      |
| `user_profiles`     | User profiles & RBAC         |

### Shared Packages

| Package                   | Purpose                           |
| ------------------------- | --------------------------------- |
| `@syntaxure/ui`           | Headless UI + Tailwind components |
| `@syntaxure/supabase`     | Supabase client helpers           |
| `@syntaxure/redis`        | Redis caching utilities           |
| `@repo/eslint-config`     | Shared ESLint config              |
| `@repo/typescript-config` | Shared TypeScript config          |

---

## Sections & Components

### Landing Page Sections

| Component       | File                                          | Status |
| --------------- | --------------------------------------------- | ------ |
| Header          | `src/components/layout/header.tsx`            | ✅     |
| Footer          | `src/components/layout/footer.tsx`            | ✅     |
| Hero            | `src/components/sections/hero.tsx`            | ✅     |
| Services Grid   | `src/components/sections/services.tsx`        | ✅     |
| Works Showcase  | `src/components/sections/works-showcase.tsx`  | ✅     |
| Testimonials    | `src/components/sections/testimonials.tsx`    | ✅     |
| About           | `src/components/sections/about.tsx`           | ✅     |
| CTA Banner      | `src/components/sections/cta.tsx`             | ✅     |
| Features        | `src/components/sections/features.tsx`        | ✅     |
| Prism Highlight | `src/components/sections/prism-highlight.tsx` | ✅     |
| Social Proof    | `src/components/sections/social-proof.tsx`    | ✅     |

---

## Server Actions

| File                       | Purpose                      |
| -------------------------- | ---------------------------- |
| `actions/quote.ts`         | Submit quote form (public)   |
| `actions/contact.ts`       | Submit contact form (public) |
| `actions/blog.ts`          | Fetch blog posts (public)    |
| `actions/testimonials.ts`  | Fetch testimonials (public)  |
| `actions/community.ts`     | Community features (public)  |
| `actions/support.ts`       | Support form (public)        |
| `actions/maya.ts`          | Maya payment (public)        |
| `actions/paypal.ts`        | PayPal payment (public)      |
| `actions/accept-invite.ts` | Accept invite (public)       |

**Admin actions are in prism-admin** (`actions/agency-*.ts`)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Email
RESEND_API_KEY=xxx

# Payments
MAYA_PUBLIC_KEY=xxx
MAYA_SECRET_KEY=xxx
PAYPAL_CLIENT_ID=xxx
```

---

## Design Constraints

| Constraint    | Value                                      |
| ------------- | ------------------------------------------ |
| Background    | `#050505` (`--color-void`)                 |
| Border radius | `rounded-sm` or `rounded-md` only          |
| Language      | B2B ("We partner..." not "I freelance...") |
| Forms         | Zod validation mandatory                   |
| TypeScript    | Strict mode                                |

---

## Build Priority

1. ✅ Foundation (layout, fonts, scroll)
2. ✅ Header component
3. ✅ Hero section
4. ✅ Services grid
5. ✅ CTA banner
6. ✅ Footer
7. ✅ Homepage wired
8. ✅ Supabase config
9. ✅ Middleware auth (proxy.ts)
10. ✅ Contact form
11. ✅ Quote form (multi-step)
12. ✅ Blog section
13. ✅ Testimonials section
14. ✅ About section
15. ✅ Admin (separate app: prism-admin)
