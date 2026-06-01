# syntaxure-labs

## 1.0.0

### Major Changes

- Phase 0-4 database normalization (3NF) + admin consolidation. Major schema changes: clients table extraction, junction tables for tags/releases/community posts, subscriptions.user_email drop, page_sections normalization. Prisma schema with 40+ models. Admin sidebar restructure and CRUD for quotes/messages/feedback. Type safety via prisma generate pipeline.
