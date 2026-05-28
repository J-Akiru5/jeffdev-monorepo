# Prism Manage — C-Level Role Plan

## Overview

Founders can optionally assign themselves a C-Level title (`c_level_title`) that refines their permissions within Syntaxure Labs. Employees remain as-is. C-Level founders see only their department's views unless they are the **CEO** (who sees everything).

## Data Model

### Supabase: `workspace_members` table

Add a nullable `c_level_title text` column. Valid values:

| Value  | Title | Department                              |
| ------ | ----- | --------------------------------------- |
| `ceo`  | CEO   | All (executive oversight)               |
| `cto`  | CTO   | Engineering                             |
| `cpo`  | CPO   | Product                                 |
| `coo`  | COO   | Operations                              |
| `cmo`  | CMO   | Marketing                               |
| `null` | —     | Regular founder (no C-level refinement) |

A member is a **C-Level founder** when `role = 'founder'` AND `c_level_title IS NOT NULL`.

### Schema (`schemas.ts`)

```ts
export const CLevelTitleEnum = z.enum(["ceo", "cto", "cpo", "coo", "cmo"]);
export type CLevelTitle = z.infer<typeof CLevelTitleEnum>;
```

## Role Access Matrix

### ↔️ Sidebar Visibility

| Role         | Engineering | Product | Operations | Marketing | Dashboard Overview |
| ------------ | ----------- | ------- | ---------- | --------- | ------------------ |
| **CEO**      | ✅          | ✅      | ✅         | ✅        | ✅ (all KPIs)      |
| **CTO**      | ✅          | ❌      | ❌         | ❌        | ✅ (Eng KPIs)      |
| **CPO**      | ❌          | ✅      | ❌         | ❌        | ✅ (Product KPIs)  |
| **COO**      | ❌          | ❌      | ✅         | ❌        | ✅ (Ops KPIs)      |
| **CMO**      | ❌          | ❌      | ❌         | ✅        | ✅ (Mktg KPIs)     |
| **Employee** | —           | —       | —          | —         | Assigned dept only |

### 👥 Members Management

| Role         | Can manage members of…                |
| ------------ | ------------------------------------- |
| **CEO**      | All departments (full founder access) |
| **CTO**      | Engineering only                      |
| **CPO**      | Product only                          |
| **COO**      | Operations only                       |
| **CMO**      | Marketing only                        |
| **Employee** | Read-only (no edits)                  |

### ✅ Task Approval

| Role            | Can approve tasks in…                                 |
| --------------- | ----------------------------------------------------- |
| **CEO**         | Any department                                        |
| **CPO**         | Product department (current behavior + c_level check) |
| **CTO/COO/CMO** | Cannot approve (not in their scope)                   |
| **Employee**    | No approval rights                                    |

## Hub Pages

Each C-Level role gets a dedicated hub/summary page:

| Role    | Hub Route      | Content                                             |
| ------- | -------------- | --------------------------------------------------- |
| **CEO** | `/dashboard`   | Company-wide KPIs, all departments summary          |
| **CTO** | `/engineering` | Engineering velocity, PRs, issues, sprints          |
| **CPO** | `/product`     | Feature roadmap, task approval queue, feedback      |
| **COO** | `/operations`  | Operational metrics, resource allocation            |
| **CMO** | `/marketing`   | Campaign tracking, funnel metrics, content pipeline |

## Implementation Phases

### Phase 1 — Data Layer

1. Create Supabase migration: add `c_level_title` column to `workspace_members`
2. Update `schemas.ts`: add `CLevelTitleEnum`, extend member schema
3. Update `workspace-store.ts`: add `cLevelTitle` field + setter
4. Update `workspace-provider.tsx`: hydrate `cLevelTitle` from membership
5. Update dashboard layout: fetch `c_level_title` alongside role

### Phase 2 — Profile Page

6. Overhaul Settings → Account section into an editable profile with C-level title selector (founder-only)

### Phase 3 — Sidebar Scoping

7. Refactor `sidebar.tsx` `visibleDepartments` logic to use `cLevelTitle`
8. Hide Marketing nav from non-CEO founders
9. Collapse other department navs based on role

### Phase 4 — Members Management

10. Scope member management actions to department (founders with c_level can only manage their dept)

### Phase 5 — Task Approval

11. Update `task-sheet.tsx` approval check: CPO + CEO approve; others don't
12. Update `cpoUserId` logic to also check `cLevelTitle === 'cpo'`

### Phase 6 — Hubs & Guards

13. Create role-specific hub pages (Engineering, Product, Operations, Marketing)
14. Create `role-guard.tsx` component that redirects if user lacks department access
15. Update command palette actions based on role
