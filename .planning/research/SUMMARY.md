# Project Research Summary

**Project:** Calendario Tributario
**Domain:** Colombian tax obligation tracking SaaS (DIAN compliance calendar)
**Researched:** 2026-02-26
**Confidence:** HIGH

## Executive Summary

Calendario Tributario is a web application that helps Colombian SMEs and accountants track DIAN tax obligations by matching business profiles to applicable taxes, calculating personalized due dates from NIT digits, and sending deadline reminders. This is a well-understood domain -- Colombian competitors (Tribualdia, Calendapp, Alegra, Dataico) have established the feature baseline -- but no standalone free tool combines automatic obligation matching with penalty estimation. The recommended approach is a Next.js 15 App Router monolith with Prisma 7, PostgreSQL, and a declarative rules-based matching engine where tax conditions are stored as database rows rather than code branches. This keeps the core domain logic data-driven and maintainable across annual DIAN calendar changes.

The primary technical risk is data correctness, not system complexity. Wrong deadlines, incorrect NIT digit extraction, stale UVT values, or missing Colombian holidays will silently produce wrong dates -- and users relying on those dates face real financial penalties. The mitigation strategy is to treat all tax reference data (calendar dates, holiday lists, UVT values, obligation conditions) as versioned, year-scoped database records with admin tooling for annual updates. Hard-coding any of this data is explicitly flagged as unacceptable technical debt. The second major risk is notification reliability: the app's core value is "never miss a deadline," so silent email delivery failures undermine the entire proposition. In-app notifications must serve as the reliable baseline, with email as an opt-in channel that includes delivery tracking and retry logic.

The stack is largely pre-decided (Next.js, Prisma, shadcn/ui) with one significant recommendation: replace NextAuth.js with Better Auth 1.4.x, its officially-blessed successor. Auth.js was absorbed by Better Auth in September 2025 and will only receive security patches. For a greenfield project, starting on deprecated infrastructure creates unnecessary debt. The architecture follows a 7-phase build order dictated by hard data dependencies: schema and auth first, seed data second, matching engine third, UI fourth, then notifications and multi-client support layered on top. Multi-client management for accountants is the most cross-cutting feature and should be deferred to v1.1 if timeline pressure exists.

## Key Findings

### Recommended Stack

The stack is pre-chosen per PROJECT.md but with important version updates. Next.js 15 (not 14) with App Router, Prisma 7 (major TypeScript-native rewrite), Tailwind CSS 4, and shadcn/ui form the UI layer. Better Auth 1.4.x replaces NextAuth.js as the authentication solution. Resend handles transactional email with React Email templates. Vercel Cron provides scheduled job execution (2 jobs on Hobby plan: one for status sweeps, one for reminders). All date operations use date-fns 4.x with @date-fns/tz for Colombia's UTC-5 timezone.

**Core technologies:**
- **Next.js 15 (App Router):** Fullstack React framework with Server Components, Server Actions, Turbopack. React 19 required.
- **Prisma 7:** TypeScript-native ORM rewrite. 98% fewer generated types, 70% faster type checking. Use v7 for greenfield.
- **Better Auth 1.4.x:** Authentication. Direct successor to NextAuth.js. Built-in email/password, Prisma adapter, rate limiting.
- **PostgreSQL 16+:** Relational database. Best Prisma support. Neon or Supabase for hosting.
- **shadcn/ui + Tailwind 4:** Component library with Calendar component (June 2025). react-day-picker 9.x for calendar grid.
- **Resend + React Email 5:** Transactional email. 100 emails/day free tier. React components for templates.
- **Vercel Cron:** Two daily jobs -- status transitions (06:00 UTC) and email reminders (12:00 UTC).
- **Zod 4 + react-hook-form 7 + next-safe-action 8:** Type-safe validation pipeline for forms and server actions.
- **date-fns 4 + @date-fns/tz:** Date manipulation with explicit Colombia timezone (UTC-5, no DST).

**Critical version constraints:**
- Zod 4.x requires @hookform/resolvers 5.2.2+ (specific fix for v4 resolver)
- Prisma 7.x requires matching @prisma/client 7.x
- shadcn/ui latest requires Tailwind CSS 4.x and react-day-picker 9.x
- Use bcryptjs (pure JS), NOT bcrypt (native C++ bindings break on Vercel serverless)

### Expected Features

**Must have (table stakes):**
- NIT-based deadline calculation (last 1 digit for monthly taxes, last 2 for annual Renta)
- Business profile onboarding (4-step wizard: empresa data, regime/size, CIIU/city, income thresholds)
- Obligation matching engine (rules-based: ~12 national taxes x ~30 conditions evaluated against profile)
- Monthly calendar view (color-coded by obligation status: pending, upcoming, overdue, paid)
- Obligations table with filters (status, tax type, period; sortable, paginated)
- Mark obligation as paid (simple status toggle with timestamp)
- Email reminders at 15/7/3/1 day thresholds before deadlines
- In-app notification center (bell + unread count + notification list)
- Obligation status auto-progression via daily cron (PENDIENTE -> PROXIMO -> VENCIDO)
- Dashboard summary cards (due this month, overdue count, next deadline)
- Profile edit with automatic obligation recalculation (preserve PAGADO records)
- Spanish-language UI throughout (Colombian tax terminology, COP formatting)
- Responsive web design (desktop + mobile browser)
- User authentication (email/password)

**Should have (differentiators -- v1.x):**
- Penalty estimation calculator with legal disclaimer (Art. 641/642 Estatuto Tributario, 3 formula branches, UVT floor)
- Multi-client management for accountants (client switcher, role system: OWNER/ACCOUNTANT/VIEWER)
- Google Calendar export (.ics file or subscribe link)
- Municipal ICA support for top 4 cities (Bogota, Medellin, Cali, Barranquilla)

**Defer (v2+):**
- WhatsApp notifications (Meta Business API cost + complexity)
- Tax filing/submission integration (entirely different product scope, liability)
- Mobile native app (responsive web is sufficient for v1)
- Multi-country support (each country's tax system is fundamentally different)
- AI-powered tax advice (legal liability; the matching engine IS the intelligence)
- Payment processing / subscriptions (validate product-market fit first)

### Architecture Approach

The architecture is a Next.js App Router monolith with a clean service layer. Server Components fetch empresa-scoped data and pass it as props to Client Component "islands" for interactivity. Server Actions are thin wrappers that validate input with Zod, call service functions, and revalidate paths. All business logic lives in `lib/services/` as pure TypeScript functions testable with Vitest. The matching engine uses a declarative condition-evaluation pattern where tax rules are database rows (ImpuestoCondicion) rather than code branches. Multi-tenant data isolation is achieved via an `empresaId` foreign key on all business-data tables, with a centralized tenant-context service that resolves and validates the active empresa on every request.

**Major components:**
1. **Tax Matching Engine** (`lib/services/tax-matching.service.ts`) -- Evaluates ~50 condition rows against empresa profile to determine applicable taxes; resolves NIT-digit-based due dates from seeded lookup tables; generates ObligacionTributaria records. Runs at onboarding completion and profile edit only (not on a schedule).
2. **Notification Pipeline** (`lib/services/notification.service.ts` + cron route handler) -- Daily cron sweeps obligation statuses (PENDIENTE->PROXIMO->VENCIDO), then queries obligations at 15/7/3/1/0 day thresholds, routes to in-app (always) + email (opt-in via Resend). Idempotent via `ultimoEnvio` timestamp.
3. **Tenant Context Service** (`lib/services/tenant-context.service.ts`) -- Resolves `activeEmpresaId` from JWT session, validates membership via EmpresaUsuario table, enforces role-based access. Called by every Server Component and Server Action that touches empresa data.
4. **Sanctions Calculator** (`lib/services/sanctions.service.ts`) -- Pure stateless function implementing Art. 641/642 ET penalty formulas. Three branches (tax due, no tax/income, no tax/no income), UVT floor (10 UVT), doubling for post-emplazamiento. Reads UVT from database, not constants.
5. **Onboarding Wizard** (Client Component, 4 steps) -- Captures all empresa profile fields needed for obligation matching. Per-step server persistence. Triggers matching engine on completion.

### Critical Pitfalls

The two PITFALLS research files identified 13 distinct pitfalls. The top 6 that must be addressed in the architecture from day one:

1. **Stale DIAN calendar data** -- The DIAN publishes new calendars annually (December) and can amend mid-year via emergency decrees. Model calendar data as versioned, year-scoped database records with admin ingestion workflow. Add a system health check warning when current-year calendar data is missing. Never hard-code dates.

2. **NIT verification digit confusion** -- The NIT format is `XXX.XXX.XXX-Y` where `Y` is a verification digit (NOT part of the base number). Taking the "last digit" of the full string gives the wrong digit. Normalize on input: strip formatting, store base number and verification digit separately, validate using the DIAN check-digit algorithm (Orden Administrativa 4/1989). Use `getDeadlineDigit(nit, obligationType)` that returns 1 digit for monthly taxes, 2 for annual Renta.

3. **Penalty calculation formula errors** -- Colombia's late-filing penalty has 3 branching formulas, 2 cap levels, a 10 UVT floor, and a doubled-rate post-emplazamiento variant. "Month or fraction of month" means 1 day late = 1 month of penalty. Build as a heavily-tested pure function. UVT value must be database-configurable (changes every January). Always display formula breakdown and legal disclaimer.

4. **Colombian holiday calendar errors** -- DIAN deadlines use business days (dias habiles). Colombia has 18 holidays/year; 11 are moveable under Ley Emiliani (move to Monday). 6 depend on Easter (Computus algorithm). Generic npm holiday packages do not handle Colombia correctly. Build a Colombia-specific holiday provider with per-year override support; validate against official DIAN calendar.

5. **Notification delivery failures going undetected** -- The app promises "never miss a deadline." Silent email failures (bounced, cron crash, Vercel timeout) break this promise while users believe they are protected. Use in-app notifications as the reliable baseline. Track delivery status per-notification in a `notification_log` table. Implement retry logic and delivery watchdog alerting.

6. **Multi-client data leakage (accountant model)** -- Accountants managing multiple clients create a two-level access model. Every query must include `empresaId` filtering. Use Prisma Client Extensions or middleware to inject tenant filtering automatically. Write integration tests that specifically attempt cross-client data access and assert failure.

## Implications for Roadmap

Based on combined research, the architecture has hard data dependencies that dictate build order. The matching engine cannot function without seed data; the dashboard cannot render without obligations; notifications cannot send without obligations existing. Multi-client is an enhancement layer, not a prerequisite.

### Phase 1: Foundation (Schema + Auth + Seed Data)

**Rationale:** Everything depends on the data model and authentication. The Prisma schema must include all tables from day one (User, Empresa, EmpresaUsuario, Impuesto, ImpuestoCondicion, FechaVencimiento, ObligacionTributaria, Notificacion, ConfiguracionSistema). Auth must work before any protected page is built. Seed data (12 national taxes, ~50 conditions, NIT-digit date tables for 2026, UVT value, Colombian holidays) must exist before the matching engine is testable.

**Delivers:** Working authentication flow, complete database schema with migrations, seeded tax reference data, Prisma singleton, middleware for route protection and onboarding gate.

**Addresses features:** Auth + account management, Spanish-language foundation, Colombia timezone handling (UTC-5).

**Avoids pitfalls:** Prisma connection pool exhaustion (singleton from day one), NextAuth/BetterAuth session strategy mismatch (explicit JWT config), NIT-digit date modeling (year-scoped lookup tables, not hard-coded dates), UVT as database config (not code constant), Colombian holiday provider (built and validated before any deadline logic).

### Phase 2: Onboarding + Matching Engine

**Rationale:** The matching engine is the core product differentiator and the highest-complexity feature. It depends on seed data (Phase 1) and produces the obligations that every subsequent feature displays. Building it second means the dashboard has real data to render.

**Delivers:** 4-step onboarding wizard, declarative rules-based matching engine, NIT date resolution, tenant context service, ObligacionTributaria record generation.

**Addresses features:** Business profile onboarding, obligation matching engine, NIT-based deadline calculation.

**Avoids pitfalls:** NIT verification digit confusion (validate on input, store base/check separately), Regimen SIMPLE special rules (IVA not standalone, Retencion excluded), ICA city-scoping (only show for seeded cities).

### Phase 3: Dashboard + Core UI

**Rationale:** With obligations in the database, the dashboard can render meaningful content. Calendar view, obligations table, summary cards, and mark-as-paid are all read/display features that depend on Phase 2 output.

**Delivers:** Monthly calendar view with color-coded obligations, filterable/paginated obligations table, dashboard summary cards, mark-as-paid action.

**Addresses features:** Monthly calendar view, obligations table with filters, mark as paid, dashboard summary cards, responsive design.

**Avoids pitfalls:** Filtering by empresaId (not userId) for multi-tenant readiness, COP currency formatting (Colombian convention: $ with dots as thousands separator).

### Phase 4: Profile Edit + Sanctions Calculator

**Rationale:** Profile editing triggers obligation recalculation, which requires the matching engine (Phase 2) and a visible dashboard (Phase 3) to verify results. The sanctions calculator is a pure function with no UI dependency but needs the UVT config from Phase 1 and makes most sense displayed alongside obligations.

**Delivers:** Profile edit form with regime-change detection, obligation recalculation preserving PAGADO records, penalty estimation with formula breakdown and legal disclaimer.

**Addresses features:** Profile edit + recalculation, penalty estimation calculator.

**Avoids pitfalls:** Regime changes not retroactive (only recalculate PENDIENTE/PROXIMO, preserve PAGADO), penalty formula branches (test all 3 x 2 articles), UVT floor enforcement, mandatory legal disclaimer ("estimacion orientativa").

### Phase 5: Notifications + Cron

**Rationale:** Notifications are the second most important feature (after matching) but have the highest infrastructure risk (Vercel Cron limits, Resend timeouts, email deliverability). Building after the core UI means failures are debuggable against a working dashboard. Requires obligations to exist (Phase 2) and benefits from the dashboard being visible (Phase 3) for in-app notification display.

**Delivers:** In-app notification bell + notification list, email reminders at 15/7/3/1/0 day thresholds via Resend, daily cron for status auto-progression (PENDIENTE->PROXIMO->VENCIDO), notification delivery tracking, cron endpoint security.

**Addresses features:** Email reminders, in-app notification center, obligation status auto-progression.

**Avoids pitfalls:** Notification delivery failures (in-app as baseline, email as opt-in, delivery tracking table, retry logic), cron endpoint security (CRON_SECRET validation), Resend timeout in serverless (keep templates simple), idempotency via ultimoEnvio timestamp.

### Phase 6: Multi-Client + Polish

**Rationale:** Multi-client management for accountants is the most cross-cutting feature -- it touches auth (role system), session management (activeEmpresaId switching), every dashboard query (empresa scoping), and notifications (routing to accountants). The single-user experience must work perfectly before adding this complexity. Can ship as v1.1 if timeline is tight.

**Delivers:** Accountant role with client management page, client switcher dropdown in dashboard layout, JWT session switching for active empresa, cross-client authorization enforcement, Google Calendar export.

**Addresses features:** Multi-client management for accountants, Google Calendar export.

**Avoids pitfalls:** Cross-client data leakage (Prisma middleware auto-filtering by empresaId, integration tests for cross-tenant access, URL-based client switching validated server-side), accountant session management (activeEmpresaId in JWT with membership validation on every switch).

### Phase Ordering Rationale

- **Phases 1-3 are the critical path.** Each has a hard dependency on the previous: schema enables seed data, seed data enables matching, matching enables dashboard. No parallelism is possible.
- **Phase 4 (profile edit + sanctions) can partially overlap with Phase 3.** The sanctions calculator is a pure function with no UI dependency. Profile edit depends on the matching engine (Phase 2) but not on the dashboard UI.
- **Phase 5 (notifications) can begin development in parallel with Phase 4.** It depends on Phases 1 and 2 (schema + obligations exist) but not on Phases 3 or 4.
- **Phase 6 (multi-client) is an enhancement layer.** The EmpresaUsuario table exists from Phase 1. The tenant context service exists from Phase 2. The UI and switching logic can be layered on without refactoring. A single-empresa owner never sees the client switcher.
- **This order matches the feature dependency graph** identified in FEATURES.md and the build order recommended in ARCHITECTURE.md, which both converge on the same sequence.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Seed Data):** The DIAN tax seed data (12 taxes, ~50 conditions, NIT-digit date tables) is the most domain-specific work. Requires careful extraction from DIAN Calendario Tributario 2026 PDF and Decreto 2229. The Colombian holiday list (18 holidays, Ley Emiliani rules, Easter-dependent dates) also needs validation against official sources. Recommend `/gsd:research-phase` before implementation.
- **Phase 2 (Matching Engine):** The condition evaluation logic and Regimen SIMPLE special rules need domain validation. What conditions determine Informacion Exogena applicability? How does the GMF 4x1000 exemption work? Which CIIU codes trigger specific obligations? Recommend `/gsd:research-phase` for the condition rule set.
- **Phase 5 (Notifications):** Vercel Cron on Hobby plan (2 jobs, daily only, 10s timeout) may be insufficient. Need to validate whether a single daily cron can process all users within timeout. Also need to validate Resend email deliverability setup (SPF/DKIM/DMARC configuration, domain verification). Light research recommended.

Phases with standard patterns (skip research-phase):
- **Phase 3 (Dashboard UI):** Well-documented patterns. shadcn/ui Calendar component, react-day-picker, Server Component + Client island pattern. Standard Next.js App Router development.
- **Phase 4 (Profile Edit + Sanctions):** Profile edit is standard CRUD with Zod validation. Sanctions calculator is a pure function with well-documented formulas (Art. 641/642 Estatuto Tributario).
- **Phase 6 (Multi-Client):** Membership model is well-established in SaaS (Prisma docs, MakerKit patterns). JWT session switching is documented in NextAuth/Better Auth guides.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against official docs and npm. Version compatibility confirmed. Better Auth recommendation supported by official NextAuth.js absorption announcement. |
| Features | MEDIUM-HIGH | Feature landscape validated against 8+ Colombian competitors (Tribualdia, Dataico, Alegra, Calendapp, Kontalid, DIAN official). MVP definition is grounded. Penalty calculator differentiation confirmed -- no free Colombian tool does this. |
| Architecture | HIGH | Next.js App Router patterns from official Vercel docs. Prisma data modeling from official guides. Tax matching engine derived from general rules-engine patterns + DIAN calendar rules. Build order validated by dependency analysis. |
| Pitfalls | HIGH | Penalty formulas from Estatuto Tributario Art. 641/642. NIT algorithm from DIAN Orden Administrativa 4/1989. Calendar rules from Decreto 2229/2023. Colombian holidays from Ley 51/1983. Two independent research passes converged on the same pitfalls. |

**Overall confidence:** HIGH

### Gaps to Address

- **DIAN tax seed data extraction:** The exact conditions for each of the 12 national taxes (Renta, IVA, Retencion en la Fuente, ICA, Impuesto al Patrimonio, Informacion Exogena, GMF 4x1000, Impuesto al Consumo, Regimen SIMPLE, Activos en el Exterior, Normalizacion Tributaria, Precios de Transferencia) need to be extracted from DIAN regulations. Research identified the taxes but the full condition rule sets per tax were not enumerated. Address during Phase 1 seed data planning.

- **Better Auth vs NextAuth decision validation:** STACK.md recommends Better Auth 1.4.x as the NextAuth.js successor, but PROJECT.md specifies NextAuth.js. This needs explicit team decision. The risk of staying on NextAuth.js v5 beta (deprecated-in-practice, no stable release) vs. switching to Better Auth (newer ecosystem, fewer tutorials) should be weighed. Recommendation: switch to Better Auth.

- **Vercel Hobby plan cron limitations:** Two cron jobs, once per day each, with 10-second timeout. The research assumes this is sufficient for v1, but if the user base exceeds ~100 users, the cron may not complete within the timeout. Need a contingency plan (batching, upgrading to Pro, or using Inngest/QStash).

- **Email deliverability setup:** Resend free tier is 100 emails/day. For an app promising deadline reminders, this becomes a hard limit with ~25+ active users (each receiving 4 threshold reminders per obligation). Need to plan for Resend Pro tier or email batching strategy.

- **ICA municipal tax data quality:** Research flagged ICA as 1,100 different municipal taxes. Even scoping to 4 cities (Bogota, Medellin, Cali, Barranquilla) requires per-city research into periodicity, CIIU-based tariff rates, and ReteICA rules. This data does not exist in a single source. Address during v1.1 planning (not v1 MVP).

## Sources

### Primary (HIGH confidence)
- DIAN Calendario Tributario 2026 (official): https://www.dian.gov.co/Paginas/CalendarioTributario.aspx
- DIAN Calendario Tributario 2026 PDF: https://www.dian.gov.co/Calendarios/Calendario_Tributario_2026.pdf
- Estatuto Tributario Art. 641 (penalty formulas): https://estatuto.co/641
- DIAN Orden Administrativa 4/1989 (NIT verification digit): https://www.colconectada.com/digito-de-verificacion-dian/
- Next.js official docs and blog (v15, v16.1): https://nextjs.org/blog/next-16-1
- Prisma 7 announcement: https://www.prisma.io/blog/announcing-prisma-orm-7-0-0
- Auth.js absorbed by Better Auth (Sep 2025): https://github.com/nextauthjs/next-auth/discussions/13252
- Better Auth Prisma adapter: https://www.better-auth.com/docs/adapters/prisma
- Vercel Cron docs: https://vercel.com/docs/cron-jobs
- shadcn/ui changelog: https://ui.shadcn.com/docs/changelog

### Secondary (MEDIUM confidence)
- Competitor analysis: Tribualdia, Dataico, Alegra, Calendapp, Kontalid, Ofiscol (feature validation)
- Siigo penalty methodology: https://www.siigo.com/blog/que-es-la-sancion-por-extemporaneidad/
- Colombian holidays and Ley Emiliani: https://www.buk.co/blog/calendario-2026-colombia-con-festivos
- UVT 2026 ($52,374): https://www.buk.co/blog/uvt-2026-colombia-valor-oficial
- Multi-tenant Prisma patterns: https://zenstack.dev/blog/multi-tenant
- Rules engine patterns: https://benjamin-ayangbola.medium.com/building-a-rule-engine-with-typescript-1732d891385c

### Tertiary (LOW confidence)
- ICA municipal variation data: fragmented across 1,100+ municipal portals; no single source of truth
- Moratory interest rate: varies monthly per Superfinanciera certification; recommend fixed approximate rate with disclaimer
- Emergency decree impacts on 2026 calendar: reports of 2 puentes festivos cancelled; needs verification against official DIAN updates

---
*Research completed: 2026-02-26*
*Ready for roadmap: yes*
