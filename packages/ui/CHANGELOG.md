# @syntaxure/ui

## 0.2.0

### Minor Changes

- **v3.1.0 — Blog Architecture, Admin Consolidation & Landing Page Refresh**

  ### syntaxure-labs
  - Added blog section with public pages (`/blog`, `/blog/[slug]`) and Supabase-backed content
  - Added testimonials section component (fetches from `testimonials` table)
  - Added about section component with company values
  - Simplified landing page language for general audience
  - Added phone number (+63 970 576 2593) to footer and contact page
  - Added error boundaries for blog, quote, and services pages
  - Added loading skeleton for blog page
  - Purged all admin routes (15 pages), components (41 files), and actions (17 files) — admin now lives in prism-admin
  - Updated documentation to reflect Supabase architecture
  - Deleted outdated docs (PHASE3\_\*, AGENT_RULES, archive/)
  - Created stubs for public-facing functionality (invites, invoice, upload, users, waitlist)

  ### prism-admin
  - Added blog admin pages (`/admin/agency/blog`, `/new`, `/[id]/edit`)
  - Added `agency-blog.ts` server actions for blog CRUD
  - Added Blog link to sidebar navigation
  - Fixed dashboard Messages MetricCard href (was pointing to quotes instead of messages)
  - Added `blog_posts` to audit resource types

  ### @syntaxure/ui
  - Added shared chart components: `ActivityChart`, `ProjectStatusChart`, `RevenueChart`, `DashboardCharts`
  - Added `StatusFilter` component for dropdown filtering
  - Added `CalendarLegend` component for event type display
  - Added `recharts` and `next-themes` dependencies

  ### Database
  - Added `blog_posts` table migration with RLS policies
  - Added `testimonials` table migration with RLS policies

  ### syntaxure-pm
  - Fixed build errors (migrated middleware.ts to proxy.ts)
  - Added loading skeletons for tasks and dashboard pages
  - Added custom not-found page
