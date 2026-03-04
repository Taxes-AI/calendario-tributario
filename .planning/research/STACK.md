# Stack Research

**Domain:** Colombian tax obligations calendar (SaaS)
**Researched:** 2026-02-26
**Confidence:** MEDIUM-HIGH

> **Critical finding:** Auth.js (NextAuth.js) was absorbed by Better Auth in September 2025. The original maintainer (Balazs Orban) left in January 2025, and v5 never reached stable release. Auth.js will only receive security patches. For greenfield projects in 2026, **Better Auth is the recommended replacement**. However, since the PROJECT.md specifies NextAuth.js as non-negotiable and this is a v1 personal-use project, we document both paths below.

> **Version note:** PROJECT.md specifies Next.js 14, but the latest stable is **Next.js 16.1** (December 2025). Recommend using Next.js 15 (latest LTS-equivalent with broad ecosystem compatibility) or Next.js 16 if the team is comfortable with the newest APIs. The stack below targets **Next.js 15** for maximum library compatibility, with notes on Next.js 16 where relevant.

---

## Recommended Stack

### Core Technologies (Pre-chosen -- non-negotiable per PROJECT.md)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js | 15.x (App Router) | Fullstack React framework | Stable, broad ecosystem support, Vercel-native deployment. 16.x is available but 15.x has wider library compatibility for auth/forms. | HIGH |
| TypeScript | 5.7+ | Type safety | Non-negotiable for any serious project. Prisma, Zod, and Better Auth all generate types. | HIGH |
| Tailwind CSS | 4.x | Utility-first CSS | shadcn/ui migrated to Tailwind v4 in Feb 2025. Use v4 for compatibility with latest shadcn components. | HIGH |
| shadcn/ui | Latest (CLI 3.0+) | Component library | Copy-paste components, full ownership, Radix primitives. Calendar component added June 2025. Field/Spinner/Empty components added Oct 2025. | HIGH |
| PostgreSQL | 16+ | Primary database | Best Prisma support, robust for relational tax data model, Vercel Postgres or Supabase for hosting. | HIGH |
| Prisma ORM | 7.x | Database toolkit | v7 is a major rewrite (Rust-free, TypeScript-native client). 98% fewer types, 70% faster type checking. Breaking changes from v6 -- start with v7 for greenfield. | HIGH |
| Auth (see note) | next-auth@5.0.0-beta.x OR better-auth@1.4.x | Authentication | See "Authentication Decision" section below. | MEDIUM |

### Authentication Decision

**Option A: NextAuth.js v5 (beta)** -- matches PROJECT.md spec
- Install: `next-auth@beta` (latest beta, ~5.0.0-beta.25+)
- Credentials provider for email/password
- Prisma adapter via `@auth/prisma-adapter`
- Risk: v5 never reached stable, main maintainer left, project absorbed by Better Auth. Will receive security patches only.
- Pro: Extensive tutorials, matches original spec, simpler for credentials-only auth.

**Option B: Better Auth** -- recommended for new projects in 2026
- Install: `better-auth@1.4.x`
- Built-in email/password with password policies, rate limiting, MFA
- Prisma adapter built-in (`better-auth/adapters/prisma`)
- CLI auto-generates auth schema in your Prisma schema
- Pro: Actively maintained, TypeScript-first, official successor to Auth.js
- Con: Slightly different API, newer ecosystem, fewer tutorials

**Recommendation:** Use **Better Auth 1.4.x** for this greenfield project. The PROJECT.md lists "NextAuth.js" but the intent is "authentication" -- Better Auth is the direct, officially-blessed successor. Starting with a deprecated-in-practice library creates tech debt on day one. Better Auth has a Prisma adapter, credentials support, and a Next.js integration guide.

### Database & ORM

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Prisma ORM | 7.x | Schema, migrations, queries | Greenfield = start on v7. TypeScript-native client, faster builds, auto-generated types. Use `compilerBuild: "fast"` for dev, `"small"` for production. | HIGH |
| @prisma/client | 7.x | Type-safe query client | Auto-generated from schema. Pairs with Prisma Studio for visual DB browsing during development. | HIGH |

### Email

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Resend | 6.9.x | Transactional email API | Vercel-native, simple API, 100 emails/day free tier (sufficient for v1). PROJECT.md already specifies this. | HIGH |
| @react-email/components | 1.0.x | Email templates in React | Build reminder emails (15/7/3/1 day) as React components. Supports Tailwind v4, React 19. Version 5.0 of the ecosystem. | HIGH |
| react-email | 5.2.x | Email dev server/preview | Local preview of email templates during development. Not a production dependency. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| date-fns | 4.1.x | Date manipulation & formatting | ALL date operations: tax deadline calculations, "days until due" countdowns, date formatting for Spanish locale (`es` locale built-in). Tree-shakeable -- only import what you use. | HIGH |
| @date-fns/tz | latest | Timezone handling | Colombia is UTC-5 (no DST). Use for explicit timezone-aware date comparisons when checking if a deadline has passed. Critical for cron jobs running in UTC on Vercel. | HIGH |
| Zod | 4.x | Schema validation | Shared validation schemas for forms (client) and server actions (server). v4 is stable, works with react-hook-form resolvers and next-safe-action. | HIGH |
| react-hook-form | 7.71.x | Form state management | Onboarding wizard (4 steps), profile editing, login/register forms. Minimal re-renders, uncontrolled inputs by default. | HIGH |
| @hookform/resolvers | 5.2.x | RHF + Zod bridge | Connects react-hook-form to Zod schemas. v5.2.2 includes Zod v4 resolver fix. | HIGH |
| next-safe-action | 8.x | Type-safe server actions | Wraps Next.js server actions with input validation (Zod), error handling, middleware. Use for ALL mutations: mark obligation paid, update profile, recalculate obligations. | HIGH |
| Zustand | 5.0.x | Client state management | Global user/empresa state, notification unread count, sidebar collapse state. SSR-friendly, minimal boilerplate. Prefer over React Context for anything beyond simple theme/locale. | HIGH |
| nuqs | 2.8.x | URL query state | Obligaciones table filters (estado, impuesto, entidad, periodo). Type-safe URL params = shareable/bookmarkable filtered views. Used by Vercel, Sentry, Supabase. | MEDIUM-HIGH |
| sonner | 2.0.x | Toast notifications | In-app feedback: "Obligation marked as paid", "Profile updated", error toasts. shadcn/ui ships a Sonner wrapper component. Replaces deprecated shadcn Toast. | HIGH |
| bcryptjs | 2.4.x | Password hashing | Hash passwords for credentials auth. Use `bcryptjs` (pure JS) not `bcrypt` (native C++ bindings) -- avoids build issues on Vercel/serverless. 10 salt rounds. | HIGH |
| clsx + tailwind-merge | clsx@2.x, tailwind-merge@3.x | Class name utilities | shadcn/ui `cn()` utility depends on both. Already included if you init shadcn, but listing for completeness. | HIGH |

### Calendar UI

| Approach | Library | Notes | Confidence |
|----------|---------|-------|------------|
| Monthly grid calendar | shadcn/ui Calendar component | Added June 2025. Built on react-day-picker + date-fns. Color-code cells by obligation status (green/yellow/red/blue per PROJECT.md). | HIGH |
| react-day-picker | 9.x | Underlying primitive for shadcn Calendar. Can customize `DayContent` for color-coded dots/badges per obligation status. | HIGH |

### Cron / Scheduled Tasks

| Technology | Purpose | Configuration | Confidence |
|------------|---------|---------------|------------|
| Vercel Cron | Trigger daily status updates + notification dispatch | Define in `vercel.json`. Hobby plan: 2 cron jobs, once/day each. Sufficient for v1 (1 job for status transitions, 1 for email reminders). | HIGH |
| CRON_SECRET env var | Secure cron endpoints | Vercel auto-injects. Verify in route handler via `Authorization: Bearer <secret>`. Prevents external triggering. | HIGH |

**Cron architecture for v1:**
- **Job 1:** `POST /api/cron/update-statuses` -- runs daily at 06:00 UTC (01:00 COT). Transitions: PENDIENTE -> PROXIMO (within 15 days), PROXIMO -> VENCIDO (past due date).
- **Job 2:** `POST /api/cron/send-reminders` -- runs daily at 12:00 UTC (07:00 COT). Checks obligations due in 15/7/3/1 days, sends Resend emails + creates in-app notifications.

**Hobby plan constraint:** Max 2 cron jobs, each once/day. This is sufficient for v1. If you need more frequency, upgrade to Pro (40 jobs, custom schedules) or consolidate into a single job that does both status updates and reminders.

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| Prisma Studio | Visual database browser | `npx prisma studio` for inspecting/editing tax data during development. | HIGH |
| react-email dev | Email template preview | `npx react-email dev` for previewing reminder email templates locally. | HIGH |
| Turbopack | Dev server bundler | Default in Next.js 15+. Significantly faster HMR than Webpack. | HIGH |
| ESLint + Prettier | Code quality | Use `eslint-config-next` (ships with Next.js). Add `prettier-plugin-tailwindcss` for class sorting. | HIGH |

---

## Installation

```bash
# Core framework
npm install next@15 react@19 react-dom@19

# Database
npm install prisma@7 @prisma/client@7

# Authentication (choose one)
# Option A: NextAuth (legacy, matches original spec)
npm install next-auth@beta @auth/prisma-adapter
# Option B: Better Auth (recommended for greenfield)
npm install better-auth

# UI
npm install tailwindcss@4
npx shadcn@latest init

# Email
npm install resend @react-email/components

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Server Actions
npm install next-safe-action

# State Management
npm install zustand nuqs

# Date/Time
npm install date-fns @date-fns/tz

# Utilities
npm install bcryptjs sonner clsx tailwind-merge

# Dev dependencies
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D @types/bcryptjs
npm install -D prisma
npm install -D react-email
npm install -D prettier prettier-plugin-tailwindcss
npm install -D eslint eslint-config-next
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Better Auth | NextAuth.js v5 (beta) | Only if you need maximum tutorial coverage or are migrating an existing NextAuth project. For greenfield, Better Auth is the successor. |
| date-fns 4.x | Day.js 2.x | If you want a smaller bundle and Moment-like chainable API. Day.js is 7x smaller than Luxon but date-fns tree-shakes better and is the default in shadcn Calendar. |
| date-fns 4.x | Luxon 3.x | Only if you need heavy timezone/i18n operations. Colombia has one timezone (COT, UTC-5, no DST), so Luxon's overhead is unjustified. |
| Zustand 5.x | React Context | Only for truly trivial state (e.g., single boolean). Context causes full re-renders of all consumers on any change. Zustand is ~1KB and avoids this. |
| Zustand 5.x | Redux Toolkit | Only if team is >5 devs and needs strict action/reducer patterns. Massive overkill for this project. |
| next-safe-action | Raw server actions | Only for the simplest mutations. next-safe-action adds input validation, error boundaries, middleware, and optimistic updates for ~3KB. |
| nuqs | useSearchParams (Next.js built-in) | Only for 1-2 simple string params. nuqs adds type safety, serialization, throttling, and prevents browser rate limiting. |
| Resend | AWS SES | Only if you need >100 emails/day on free tier and already have AWS infrastructure. SES is cheaper at scale but harder to set up. |
| Resend | Nodemailer | Only as a local dev fallback or if you need SMTP relay. Resend's API is simpler and Vercel-native. |
| react-email | MJML | Only if your team already knows MJML. react-email lets you write emails as React components, which matches the rest of the stack. |
| Vercel Cron | GitHub Actions Cron | If you need >2 jobs on Hobby plan without upgrading. GitHub Actions can call your API endpoints on a schedule, but adds deployment coupling. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Moment.js | Deprecated since 2020. 329KB minified, mutable API, no tree-shaking. | date-fns 4.x |
| next-auth v4 (stable) | Pages Router era. No App Router support, different API surface entirely. | Better Auth 1.4.x or next-auth@beta (v5) |
| bcrypt (native) | C++ bindings fail on Vercel serverless/Edge. Requires node-gyp at build time. | bcryptjs (pure JavaScript) |
| Redux / MobX | Excessive boilerplate for this project scope. Redux Toolkit is 10x the setup of Zustand for the same result. | Zustand 5.x |
| Prisma v5/v6 | v7 is a major rewrite. Starting greenfield on v6 means a migration later. v7 has better performance and smaller client. | Prisma 7.x |
| react-big-calendar | Heavyweight full calendar (Google Calendar clone). Overkill -- you need a monthly grid with colored dots, not a scheduling UI. | shadcn Calendar + react-day-picker |
| FullCalendar | 150KB+ bundle, jQuery legacy, complex licensing (premium features). | shadcn Calendar + react-day-picker |
| Chakra UI / MUI | Different design systems. Mixing with shadcn/ui creates inconsistency and bloat. | shadcn/ui only |
| tRPC | Adds an RPC layer when Next.js server actions + next-safe-action already provide type-safe server communication. Unnecessary abstraction. | next-safe-action |
| Temporal API (native) | Still Stage 3 TC39 proposal (not shipping in browsers/Node). Polyfills are heavy. | date-fns 4.x + @date-fns/tz |
| cron-job.org / EasyCron | External cron services add a dependency and latency. Vercel Cron is built-in and free. | Vercel Cron |

---

## Stack Patterns by Variant

**If staying on Next.js 14 (per original PROJECT.md spec):**
- Use `next-auth@beta` (v5 beta was designed for Next.js 14+)
- Tailwind CSS v3 (v4 requires Next.js 15+ for full support)
- Turbopack may not be stable -- use Webpack dev server
- NOT recommended: you miss 2 years of improvements

**If using Next.js 15 (recommended):**
- Full Tailwind v4 + shadcn/ui latest
- React 19 with Server Components and Server Actions
- Turbopack stable for dev
- Better Auth or next-auth@beta both work
- React Compiler available but optional

**If using Next.js 16 (bleeding edge):**
- Turbopack stable for both dev AND build
- React Compiler stable and on by default
- Middleware replaced by "proxy" -- auth checks move to page/route level
- Better Auth recommended (actively tracks Next.js 16 changes)
- Risk: some libraries may not yet support Next.js 16 APIs

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@15.x | react@19, react-dom@19 | Next.js 15 requires React 19. |
| prisma@7.x | @prisma/client@7.x | Must match major versions. Run `npx prisma generate` after schema changes. |
| better-auth@1.4.x | prisma@7.x | Prisma adapter supports v7. Use CLI: `npx @better-auth/cli generate --config ./auth.ts` to add auth tables to Prisma schema. |
| next-auth@5-beta | @auth/prisma-adapter@2.x | If using NextAuth path. Adapter must match v5 beta. |
| zod@4.x | @hookform/resolvers@5.2.x | v5.2.2 specifically fixes Zod v4 resolver. Do NOT use Zod 3.x with resolvers 5.x. |
| zod@4.x | next-safe-action@8.x | v8 uses Standard Schema, which Zod 4 implements. |
| react-hook-form@7.71.x | @hookform/resolvers@5.x | RHF v7 is stable. v8 does not exist yet. |
| shadcn/ui (latest) | tailwindcss@4.x, react-day-picker@9.x | shadcn Calendar depends on react-day-picker. Ensure date-fns 4.x is installed (peer dep). |
| sonner@2.x | shadcn/ui Sonner component | shadcn wraps sonner. Install sonner, then `npx shadcn@latest add sonner`. |
| nuqs@2.8.x | next@14.2+ | Supports Next.js 14.2 through 16.x App Router. |

---

## Sources

- [Next.js 16.1 blog post](https://nextjs.org/blog/next-16-1) -- confirmed Next.js 16.1 as latest stable (Dec 2025). HIGH confidence.
- [Prisma 7 announcement](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) -- confirmed Prisma 7 Rust-free rewrite. HIGH confidence.
- [Auth.js joins Better Auth](https://github.com/nextauthjs/next-auth/discussions/13252) -- confirmed Auth.js/NextAuth.js absorbed by Better Auth (Sep 2025). HIGH confidence.
- [Better Auth Prisma adapter docs](https://www.better-auth.com/docs/adapters/prisma) -- confirmed Prisma adapter with joins support. HIGH confidence.
- [Better Auth Next.js integration](https://www.better-auth.com/docs/integrations/next) -- confirmed Next.js integration guide. HIGH confidence.
- [Vercel Cron docs](https://vercel.com/docs/cron-jobs) -- confirmed Hobby plan limits (2 jobs, daily). HIGH confidence.
- [Vercel Cron pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) -- confirmed 100 jobs/project update. MEDIUM confidence (may vary by plan).
- [Resend docs for Next.js](https://resend.com/docs/send-with-nextjs) -- confirmed Server Actions support and API. HIGH confidence.
- [React Email 5.0](https://resend.com/blog/react-email-5) -- confirmed Tailwind v4, React 19, Next.js 16 support. HIGH confidence.
- [shadcn/ui changelog](https://ui.shadcn.com/docs/changelog) -- confirmed Calendar component (Jun 2025), CLI 3.0 (Aug 2025), Tailwind v4 (Feb 2025). HIGH confidence.
- [date-fns npm](https://www.npmjs.com/package/date-fns) -- confirmed v4.1.0 as latest. HIGH confidence.
- [Zod v4 release notes](https://zod.dev/v4) -- confirmed Zod 4.x as latest stable. HIGH confidence.
- [nuqs at React Advanced 2025](https://www.infoq.com/news/2025/12/nuqs-react-advanced/) -- confirmed adoption by Vercel, Sentry, Supabase. MEDIUM confidence.
- [npm: zustand](https://www.npmjs.com/package/zustand) -- confirmed v5.0.11. HIGH confidence.
- [npm: next-safe-action](https://www.npmjs.com/package/next-safe-action) -- confirmed v8.1.3. HIGH confidence.
- [npm: better-auth](https://www.npmjs.com/package/better-auth) -- confirmed v1.4.19. HIGH confidence.
- [npm: sonner](https://www.npmjs.com/package/sonner) -- confirmed v2.0.7. HIGH confidence.
- [npm: @hookform/resolvers](https://www.npmjs.com/package/@hookform/resolvers) -- confirmed v5.2.2 with Zod v4 fix. HIGH confidence.
- [npm: resend](https://www.npmjs.com/package/resend) -- confirmed v6.9.2. HIGH confidence.
- [npm: react-email](https://www.npmjs.com/package/react-email) -- confirmed v5.2.8. HIGH confidence.

---
*Stack research for: Colombian tax obligations calendar (Calendario Tributario)*
*Researched: 2026-02-26*
