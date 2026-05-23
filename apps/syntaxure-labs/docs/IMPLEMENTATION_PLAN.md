# JeffDev Agency — Implementation Plan

**Project:** High-Performance B2B Agency Satellite Site  
**Framework:** Next.js 16.1.1 (App Router) + Tailwind v4 + Lenis  
**Last Updated:** December 29, 2025

---

## Current State

| Layer | Status | Technology |
|-------|--------|------------|
| Framework | ✅ Ready | Next.js 16.1.1 (App Router) |
| Styling | ✅ Ready | Tailwind v4 + CSS tokens |
| Scroll | ✅ Ready | Lenis smooth scroll |
| Utils | ✅ Ready | `cn()` utility |
| Components | 🔲 Pending | Header, Hero, Services, etc. |
| Backend | 🔲 Pending | Firebase, Resend, Admin |

---

## Phase 1: Core Components (Landing Page)

| # | Component | File | Priority |
|---|-----------|------|----------|
| 1 | Header | `src/components/layout/header.tsx` | 🔴 Critical |
| 2 | Footer | `src/components/layout/footer.tsx` | 🔴 Critical |
| 3 | Hero | `src/components/sections/hero.tsx` | 🔴 Critical |
| 4 | Services Grid | `src/components/sections/services.tsx` | 🔴 Critical |
| 5 | Case Studies | `src/components/sections/case-studies.tsx` | 🟡 High |
| 6 | Testimonials | `src/components/sections/testimonials.tsx` | 🟡 High |
| 7 | About/Founder | `src/components/sections/about.tsx` | 🟡 High |
| 8 | CTA Banner | `src/components/sections/cta.tsx` | 🟢 Medium |

---

## Phase 2: Pages Structure

```
src/app/
├── page.tsx              # Homepage (Hero + Services + CTA)
├── services/
│   ├── page.tsx          # Services grid
│   └── [slug]/page.tsx   # Service detail
├── work/
│   ├── page.tsx          # Case studies
│   └── [slug]/page.tsx   # Project detail
├── about/page.tsx        # About Studio + Founder
├── contact/page.tsx      # Contact + Quote form
├── quote/page.tsx        # Multi-step quote form
├── blog/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── terms/page.tsx
├── privacy/page.tsx
└── admin/                # Dedicated Admin Panel
    ├── page.tsx          # Dashboard
    ├── messages/page.tsx
    ├── quotes/page.tsx
    ├── bookings/page.tsx
    ├── projects/page.tsx
    └── login/page.tsx
```

---

## Phase 3: Backend Integration

| Feature | Implementation |
|---------|----------------|
| Firebase | **Separate project** (not shared with portfolio) |
| Admin Auth | Firebase Auth + session cookies |
| Route Protection | Next.js Middleware (like SineAI Hub) |
| Email | Resend API |
| Storage | Cloudflare R2 |

### Firestore Collections

| Collection | Purpose |
|------------|---------|
| `quotes` | Multi-step quote submissions |
| `messages` | Contact form submissions |
| `projects` | Case studies / portfolio |
| `services` | Service offerings |
| `posts` | Blog articles |
| `bookings` | Calendar bookings |

---

## Multi-Step Quote Form

### Flow
```
Step 1: Project Type → Step 2: Budget & Timeline → Step 3: Contact Info → Submit
```

### Schema
```ts
const quoteSchema = z.object({
  projectType: z.enum(['web', 'mobile', 'saas', 'ai', 'other']),
  budget: z.enum(['50k-100k', '100k-250k', '250k-500k', '500k+']),
  timeline: z.enum(['1-2-weeks', '1-month', '2-3-months', 'flexible']),
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  details: z.string().min(20),
})
```

### Firestore Document
```ts
{
  id: string
  projectType: 'web' | 'mobile' | 'saas' | 'ai' | 'other'
  budget: string
  timeline: string
  name: string
  email: string
  company?: string
  details: string
  status: 'new' | 'contacted' | 'in-progress' | 'closed'
  closedReason?: 'won' | 'lost' | 'unresponsive'
  createdAt: Timestamp
}
```

---

## Admin Panel

### Auth Strategy
- Firebase Auth with session cookies
- Middleware-based route protection
- `await cookies()` pattern (Next.js 15+)

### Middleware Example
```ts
// middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  
  if (request.nextUrl.pathname.startsWith('/admin') && 
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}
```

---

## Environment Variables

```env
# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx

# Firebase (Admin)
FIREBASE_ADMIN_PRIVATE_KEY=xxx
FIREBASE_ADMIN_CLIENT_EMAIL=xxx

# Email
RESEND_API_KEY=xxx

# Storage
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=xxx
R2_ACCOUNT_ID=xxx
```

---

## Design Constraints

| Constraint | Value |
|------------|-------|
| Background | `#050505` (`--color-void`) |
| Border radius | `rounded-sm` or `rounded-md` only |
| Language | B2B ("We partner..." not "I freelance...") |
| Forms | Zod validation mandatory |
| TypeScript | Strict mode, no `any` |
| Cookies API | Use `await cookies()` |

---

## Build Priority

1. ✅ Foundation (layout, fonts, scroll) — **COMPLETE**
2. 🔲 Header component
3. 🔲 Hero section
4. 🔲 Services grid
5. 🔲 CTA banner
6. 🔲 Footer
7. 🔲 Wire up homepage
8. 🔲 Firebase config
9. 🔲 Middleware auth
10. 🔲 Contact form
11. 🔲 Quote form (multi-step)
12. 🔲 Admin panel
