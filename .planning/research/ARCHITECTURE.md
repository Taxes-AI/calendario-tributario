# Architecture Research

**Domain:** Colombian Tax Calendar SaaS — fullstack Next.js App Router compliance tracker
**Researched:** 2026-02-26
**Confidence:** HIGH (Next.js App Router patterns from official docs; Prisma data modeling from official guides) / MEDIUM (tax-specific matching engine, derived from general compliance SaaS patterns + DIAN calendar rules)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │ Calendar UI   │  │ Obligaciones   │  │  Onboarding Wizard     │  │
│  │ (Client Comp) │  │ Table (Client) │  │  (Client multi-step)   │  │
│  └──────┬────────┘  └───────┬────────┘  └──────────┬─────────────┘  │
│         │                  │                       │                │
│  ┌──────┴──────────────────┴───────────────────────┴────────────┐   │
│  │                     Client Switcher                          │   │
│  │      (Accountant selects active empresa context)             │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                      │
├─────────────────────────────┴──────────────────────────────────────┤
│                    NEXT.JS APP ROUTER (Server)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ Page/Layout  │  │ Server       │  │  Route Handlers (API)   │   │
│  │ Server Comps │  │ Actions      │  │  /api/cron/daily        │   │
│  └──────┬───────┘  └──────┬───────┘  │  /api/auth/[...nextauth]│   │
│         │                 │          └──────────┬──────────────┘   │
│  ┌──────┴─────────────────┴──────────────────────┴──────────┐      │
│  │                    SERVICE LAYER                          │      │
│  │  ┌──────────────────┐  ┌─────────────────────┐           │      │
│  │  │ TaxMatchingEngine│  │ NotificationPipeline│           │      │
│  │  │  • RuleEvaluator │  │  • Scheduler (cron) │           │      │
│  │  │  • DateResolver  │  │  • ChannelRouter    │           │      │
│  │  │  • ConditionSet  │  │  • EmailSender      │           │      │
│  │  └──────────────────┘  │  • InAppWriter      │           │      │
│  │  ┌──────────────────┐  └─────────────────────┘           │      │
│  │  │ SanctionCalc     │  ┌─────────────────────┐           │      │
│  │  └──────────────────┘  │ TenantContext       │           │      │
│  │                        │  • EmpresaResolver  │           │      │
│  │                        │  • PermissionGuard  │           │      │
│  │                        └─────────────────────┘           │      │
│  └──────────────────────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    DATA ACCESS LAYER                       │     │
│  │              Prisma Client (Singleton)                     │     │
│  └────────────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│                     EXTERNAL SERVICES                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  PostgreSQL  │  │    Resend    │  │   Vercel Cron Scheduler  │   │
│  │   (Neon/     │  │   (Email)    │  │   (HTTP → /api/cron)    │   │
│  │   Supabase)  │  └──────────────┘  └──────────────────────────┘   │
│  └─────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Auth Middleware | Gate all `/dashboard/*` routes; redirect unauthenticated users | `middleware.ts` checking NextAuth.js session JWT |
| Auth Pages | Login form, session creation, session destruction | `app/(auth)/login/page.tsx` — Client Component with Server Action |
| Onboarding Wizard | 4-step guided profile capture after first login; gate dashboard until complete | `app/(onboarding)/onboarding/page.tsx` — Client Component managing step state locally; Server Action per-step save |
| Dashboard Page | Render calendar + summary cards with server-fetched obligation data, scoped to active empresa | `app/(dashboard)/dashboard/page.tsx` — Server Component, passes data to Client islands |
| Calendar UI | Interactive monthly view with color-coded obligation dots; navigation; click-to-detail | Client Component using `react-day-picker` or custom renderer over server-fetched events |
| Obligaciones Table | Filterable, paginated list of tax obligations; mark-paid action | Client Component with filter state; calls Server Action to mutate |
| Tax Matching Engine | Cross-reference `EmpresaProfile` fields against `ImpuestoCondicion` rows to produce `ObligacionTributaria` records | Pure TypeScript service in `lib/services/tax-matching.service.ts` |
| NIT Date Resolver | Lookup concrete due date from NIT last digit(s) + tax type + period year | Pure function in `lib/services/date-resolver.service.ts` |
| Sanctions Calculator | Stateless function: given `fechaVencimiento` + `fechaPago` + `baseAmount`, return `{ interes, sancion, uvtEquivalent }` | Pure function in `lib/services/sanctions.service.ts` |
| Notification Pipeline | Query obligations near/past due, route to email + in-app, track send history | Service in `lib/services/notification.service.ts` |
| Cron Route Handler | Receive scheduled HTTP GET from Vercel Cron; validate secret; sweep statuses; dispatch notifications | `app/api/cron/daily/route.ts` |
| Tenant Context | Resolve which empresa the current user is acting on; enforce ownership/membership | `lib/services/tenant-context.service.ts` |
| Client Switcher | Accountant UI to select active client empresa from their managed list | Client Component in `components/layout/ClientSwitcher.tsx` |
| Profile Edit Flow | Allow user to update tax-relevant empresa fields; trigger obligation recalculation on save | Client form + Server Action that calls `TaxMatchingService` after DB write |
| In-App Notification Bell | Show unread count badge; list recent notifications; mark read | Client Component polling count on mount; Server Action for mark-read |
| Admin UVT Config | Allow admin to update UVT value; used by sanctions calculator | Simple admin route with Server Action |

---

## Component Deep Dive 1: Tax Matching Engine

The matching engine is the core domain logic. It answers: "Given this business profile, which DIAN obligations apply, and when is each one due?"

### Architecture: Condition-Based Rule Evaluator

The engine follows a **declarative rule evaluation** pattern, not a hardcoded if/else tree. Tax rules are stored as data (rows in `ImpuestoCondicion`), not as code branches. This means adding a new tax or changing a condition requires a database seed update, not a code change.

```
┌────────────────────────────────────────────────────────────────┐
│                    TAX MATCHING ENGINE                          │
│                                                                │
│  Input: EmpresaProfile                                         │
│    { regimen, tamaño, ciiu, ciudad, ingresos, activos, nit }  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 1: Load Rules                                     │   │
│  │  SELECT * FROM Impuesto                                 │   │
│  │    JOIN ImpuestoCondicion ON impuestoId                 │   │
│  │  (~12 taxes, ~30-50 condition rows)                     │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 2: Evaluate Conditions per Tax                    │   │
│  │  For each Impuesto:                                     │   │
│  │    conditions = tax.condiciones                         │   │
│  │    match = conditions.every(c =>                        │   │
│  │      evaluateSingle(c.campo, c.operador, c.valor,       │   │
│  │                     empresa[c.campo])                   │   │
│  │    )                                                    │   │
│  │  Filter to only matched taxes                           │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 3: Resolve Due Dates (NIT Digit Lookup)           │   │
│  │  For each matched tax:                                  │   │
│  │    periods = getPeriods(tax.periodicidad, year)          │   │
│  │    For each period:                                     │   │
│  │      nitDigit = extractDigit(empresa.nit, tax.digitos)  │   │
│  │      dueDate = lookupDate(tax.id, period, nitDigit)     │   │
│  │                                                         │   │
│  │  NIT logic:                                             │   │
│  │    - Monthly taxes (Retención): last 1 digit            │   │
│  │    - Annual taxes (Renta):      last 2 digits           │   │
│  │    - Bimonthly (IVA bimestral): last 1 digit            │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Step 4: Build ObligacionTributaria Records             │   │
│  │  For each (tax, period, dueDate):                       │   │
│  │    { impuestoId, empresaId, periodo, fechaVencimiento,  │   │
│  │      estado: 'PENDIENTE', fechaPago: null }             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  Output: ObligacionTributaria[] (ready for createMany)         │
└────────────────────────────────────────────────────────────────┘
```

### Condition Data Model

Each `ImpuestoCondicion` row represents one rule clause:

| campo | operador | valor | Meaning |
|-------|----------|-------|---------|
| `regimen` | `EQUALS` | `ORDINARIO` | Only applies to ordinario regime |
| `tamaño` | `IN` | `GRANDE,MEDIANO` | Applies to grande or mediano |
| `ingresos` | `GREATER_THAN` | `1400` | Income > 1400 UVT |
| `ciudad` | `IN` | `BOGOTA,MEDELLIN,CALI` | Only these cities (for ICA) |

All conditions within one tax are AND-joined: every condition must match. This is a deliberate simplification — OR logic can be expressed by creating multiple `Impuesto` records for the same underlying tax with different condition sets.

### NIT Date Resolution

The DIAN publishes an annual calendar (Decreto 2229 of 2023 establishes the framework; specific dates published each December for the following year). The resolution logic:

```typescript
// lib/services/date-resolver.service.ts

interface NitDateTable {
  impuestoId: string;
  periodo: string;        // "2026-01" for monthly, "2026" for annual
  digitoNit: number;      // 0-9 for monthly, 01-00 for annual
  fechaVencimiento: Date;
}

// For Retención en la Fuente (monthly, last 1 digit):
//   NIT ending in 0 → 8th business day of following month
//   NIT ending in 1 → 9th business day ...
//   NIT ending in 9 → last business day

// For Renta Personas Jurídicas (annual, last 2 digits):
//   NIT ending 01-02 → April 14, 2026 (first installment)
//   NIT ending 03-04 → April 15, 2026
//   ... staggered through May
```

The date tables are **seeded data**, not computed at runtime. Each year, an admin imports the new DIAN calendar. The matching engine reads from these tables, never computes business days itself.

### When Matching Runs

The engine executes at exactly two points:
1. **Onboarding completion** — first generation of all obligations for the year
2. **Profile edit of tax-relevant fields** — regeneration (preserving PAGADO records)

It does NOT run on a schedule. The cron job only updates statuses and sends notifications.

---

## Component Deep Dive 2: Notification Pipeline

### Pipeline Stages

```
┌────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION PIPELINE                        │
│                                                                │
│  Trigger: Vercel Cron → GET /api/cron/daily (once per day)    │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Stage 1: STATUS SWEEP                                  │   │
│  │  Update obligation states based on current date:        │   │
│  │                                                         │   │
│  │  PENDIENTE → PROXIMO  (when fechaVencimiento ≤ 15 days) │   │
│  │  PROXIMO   → VENCIDO  (when fechaVencimiento < today)   │   │
│  │                                                         │   │
│  │  Bulk UPDATE via Prisma — no row-by-row processing.     │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Stage 2: NOTIFICATION QUERY                            │   │
│  │  Find obligations at threshold days that need alerts:   │   │
│  │                                                         │   │
│  │  Thresholds: 15d, 7d, 3d, 1d, 0d (day-of)             │   │
│  │                                                         │   │
│  │  WHERE daysUntilDue IN (15, 7, 3, 1, 0)               │   │
│  │    AND (ultimoEnvio IS NULL                            │   │
│  │         OR ultimoEnvio < thresholdDate)                 │   │
│  │    AND estado != 'PAGADO'                              │   │
│  │                                                         │   │
│  │  JOIN user + empresa for email addresses                │   │
│  │  Also fetch accountant users who manage the empresa     │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Stage 3: CHANNEL ROUTING                               │   │
│  │                                                         │   │
│  │  For each (obligation, recipient):                      │   │
│  │    → IN-APP: always (write Notificacion row)            │   │
│  │    → EMAIL:  if user.emailNotifications = true          │   │
│  │                                                         │   │
│  │  Batch email sends (Resend batch API) to stay           │   │
│  │  within rate limits (100/day free tier).                 │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       ↓                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Stage 4: DELIVERY + RECORD                             │   │
│  │                                                         │   │
│  │  Email: Resend.emails.send() with templated content     │   │
│  │  In-App: prisma.notificacion.create()                   │   │
│  │                                                         │   │
│  │  Update: obligacion.ultimoEnvio = now()                 │   │
│  │  Idempotency: ultimoEnvio timestamp prevents resends    │   │
│  │  within the same threshold window.                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  Total runtime target: < 10 seconds (Vercel function limit)   │
└────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Single daily cron, not per-threshold crons.** One invocation handles all thresholds. Simpler to debug, fewer Vercel Cron slots consumed.

2. **Idempotency via `ultimoEnvio` timestamp.** If the cron fires twice in one day (retry, manual trigger), the second run finds `ultimoEnvio` is already today and skips. No duplicate emails.

3. **Accountants receive notifications for all managed empresas.** The notification query joins through the `EmpresaUsuario` membership table to include accountant users, not just the empresa owner.

4. **In-app notifications are always created.** Email is opt-in. This means even users who disable email still see alerts in-app.

5. **Batch Resend calls.** Group emails per template type and send in batches to respect rate limits. On the free tier (100 emails/day), prioritize: day-of > 1d > 3d > 7d > 15d.

---

## Component Deep Dive 3: Multi-Tenant Data Model (Accountant + Clients)

### The Problem

Two user types access the system:
- **Business owner:** Manages their own single empresa. One user = one empresa.
- **Accountant:** Manages obligations for multiple client empresas. One user = many empresas.

This is NOT traditional multi-tenancy (separate organizations with isolated data). It is a **membership model** where one user can belong to multiple empresas with different roles, and all data lives in a shared database with `empresaId` scoping.

### Data Model

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   User      │       │  EmpresaUsuario  │       │    Empresa      │
│─────────────│       │──────────────────│       │─────────────────│
│ id          │──┐    │ id               │    ┌──│ id              │
│ email       │  │    │ userId      ─────│────┘  │ razonSocial     │
│ password    │  └────│ empresaId   ─────│───────│ nit             │
│ nombre      │       │ rol: OWNER |     │       │ regimen         │
│ onboarding  │       │      ACCOUNTANT |│       │ tamaño          │
│ Complete    │       │      VIEWER      │       │ ciiu            │
│             │       │ createdAt        │       │ ciudad          │
└─────────────┘       └──────────────────┘       │ ingresos        │
                                                 │ activos         │
                                                 │ onboarding      │
                                                 │ Complete        │
                                                 └────────┬────────┘
                                                          │
                                          ┌───────────────┤
                                          │               │
                              ┌───────────┴──┐  ┌────────┴───────────┐
                              │ Obligacion   │  │  Notificacion      │
                              │ Tributaria   │  │────────────────────│
                              │──────────────│  │ id                 │
                              │ id           │  │ empresaId          │
                              │ empresaId    │  │ userId (recipient) │
                              │ impuestoId   │  │ obligacionId       │
                              │ periodo      │  │ tipo               │
                              │ fechaVenc.   │  │ mensaje            │
                              │ estado       │  │ leida              │
                              │ fechaPago    │  │ createdAt          │
                              │ ultimoEnvio  │  └────────────────────┘
                              └──────────────┘
```

### How Roles Work

| Role | Can Do | Scoped To |
|------|--------|-----------|
| `OWNER` | Full CRUD on empresa profile, view/mark obligations, receive notifications | Their own empresa |
| `ACCOUNTANT` | View obligations, mark paid, receive notifications, view calendar — but NOT edit empresa profile (must be done by owner or via explicit grant) | All empresas they are linked to |
| `VIEWER` | Read-only dashboard and calendar | Future use (e.g., a business partner) |

### Accountant Flow

```
Accountant signs up → creates their User account
    ↓
Accountant adds a client:
    Option A: Creates a new Empresa on behalf of client (becomes OWNER temporarily,
              then invites client who becomes OWNER; accountant becomes ACCOUNTANT)
    Option B: Client shares an invite code/link → accountant joins as ACCOUNTANT
    ↓
Accountant dashboard shows a "Client Switcher" dropdown
    ↓
Selecting a client sets `activeEmpresaId` in:
    - Cookie/session (for server-side scoping)
    - React context (for client-side UI)
    ↓
All data queries filter by activeEmpresaId:
    WHERE empresaId = :activeEmpresaId
    AND EXISTS (SELECT 1 FROM EmpresaUsuario
                WHERE userId = :currentUserId
                AND empresaId = :activeEmpresaId)
```

### Session Management for Active Empresa

Store `activeEmpresaId` in the JWT session via NextAuth callbacks:

```typescript
// In NextAuth callbacks:
async jwt({ token, trigger, session }) {
  if (trigger === "update" && session?.activeEmpresaId) {
    // Verify user has access to this empresa
    const membership = await prisma.empresaUsuario.findFirst({
      where: { userId: token.sub, empresaId: session.activeEmpresaId }
    });
    if (membership) {
      token.activeEmpresaId = session.activeEmpresaId;
      token.activeRole = membership.rol;
    }
  }
  return token;
}
```

Client switches active empresa via `update()` from `next-auth/react`, which triggers a JWT refresh with the new `activeEmpresaId`.

### Why NOT Full Multi-Tenancy

Full multi-tenancy (schema-per-tenant or database-per-tenant) is overkill because:
- Data volume per empresa is tiny (~12 obligations/year, ~50 notifications/year)
- No cross-tenant data isolation concern (all data is tax deadlines, not proprietary)
- A shared database with `empresaId` foreign keys + row-level filtering is simple, performant, and sufficient
- The accountant does not need isolated infrastructure — they just need to see multiple empresas

**Confidence:** MEDIUM — This membership model pattern is well-established in SaaS (Prisma docs, MakerKit, and multiple production examples), but the specific accountant-client flow for Colombian tax software is this project's own design. Validate with accountant users during testing.

---

## Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login form (Client Component)
│   │   ├── registro/
│   │   │   └── page.tsx          # Registration form
│   │   └── layout.tsx            # Auth layout (no sidebar)
│   ├── (onboarding)/
│   │   ├── onboarding/
│   │   │   └── page.tsx          # 4-step wizard (Client Component)
│   │   └── layout.tsx            # Onboarding layout (no sidebar)
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main dashboard (Server Component)
│   │   ├── obligaciones/
│   │   │   └── page.tsx          # Obligations table
│   │   ├── clientes/
│   │   │   └── page.tsx          # Accountant's client list (conditional)
│   │   ├── perfil/
│   │   │   └── page.tsx          # Profile edit
│   │   ├── notificaciones/
│   │   │   └── page.tsx          # Notification list
│   │   └── layout.tsx            # Dashboard layout (sidebar, navbar, client switcher)
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth.js handler
│   │   └── cron/
│   │       └── daily/
│   │           └── route.ts      # Vercel Cron endpoint
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing / redirect to /dashboard
├── components/
│   ├── ui/                       # shadcn/ui primitives (Button, Card, etc.)
│   ├── calendar/
│   │   ├── TaxCalendar.tsx       # Calendar Client Component
│   │   └── CalendarDay.tsx       # Per-day obligation dots
│   ├── dashboard/
│   │   ├── SummaryCards.tsx      # Month total, next 7 days, overdue
│   │   └── ObligacionesTable.tsx # Filterable table
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx  # Step container
│   │   ├── StepEmpresa.tsx       # Step 1: company data
│   │   ├── StepRegimen.tsx       # Step 2: regime + size
│   │   ├── StepActividad.tsx     # Step 3: CIIU + city
│   │   └── StepMontos.tsx        # Step 4: income/asset thresholds
│   ├── notifications/
│   │   └── NotificationBell.tsx  # Bell icon + unread badge (Client)
│   ├── clientes/
│   │   ├── ClientesList.tsx      # Accountant's client management table
│   │   └── InviteClientForm.tsx  # Invite/add client flow
│   └── layout/
│       ├── Sidebar.tsx           # Collapsible sidebar
│       ├── Navbar.tsx            # Top navbar
│       └── ClientSwitcher.tsx    # Empresa context dropdown (accountants)
├── lib/
│   ├── auth.ts                   # NextAuth.js config (auth.ts)
│   ├── auth.config.ts            # Edge-compatible auth config (no adapter)
│   ├── db.ts                     # Prisma singleton
│   ├── services/
│   │   ├── tax-matching.service.ts    # Core matching engine
│   │   ├── date-resolver.service.ts   # NIT digit → due date lookup
│   │   ├── notification.service.ts    # Email + in-app notification dispatch
│   │   ├── sanctions.service.ts       # Sanction/interest calculator
│   │   ├── obligation-status.service.ts # PENDIENTE→PROXIMO→VENCIDO sweep
│   │   └── tenant-context.service.ts  # Resolve + validate activeEmpresaId
│   └── utils/
│       ├── date.ts               # Date helpers, Colombia TZ (UTC-5)
│       ├── uvt.ts                # UVT-based calculation helpers
│       └── formatting.ts         # Currency, percentage formatters
├── actions/
│   ├── auth.actions.ts           # login, logout, register server actions
│   ├── onboarding.actions.ts     # saveStep, completeOnboarding
│   ├── obligation.actions.ts     # markPaid, markPending
│   ├── profile.actions.ts        # updateProfile (triggers recalculation)
│   └── cliente.actions.ts        # inviteClient, removeClient, switchEmpresa
├── types/
│   └── index.ts                  # Shared TypeScript types (augment Prisma)
└── middleware.ts                 # Auth gate + onboarding redirect + empresa context
```

### Structure Rationale

- **Route groups `(auth)`, `(onboarding)`, `(dashboard)`:** Separate layouts per section (auth has no sidebar; onboarding has progress bar; dashboard has full chrome including client switcher) without URL pollution.
- **`lib/services/`:** Pure TypeScript functions with no React imports. Testable in isolation with Vitest. Callable from Server Actions, Route Handlers, and cron jobs without duplication.
- **`actions/`:** Server Actions are thin — validate input with Zod, call a service, revalidate cache. No business logic lives in actions.
- **`components/` by feature:** Calendar, dashboard, onboarding, notifications, clientes each have a subfolder.
- **`lib/db.ts` singleton:** Critical for Vercel serverless — prevents Prisma from opening a new DB connection per Lambda invocation.
- **`middleware.ts`:** Runs at edge before any page loads. Checks JWT for auth. Redirects unauthenticated to `/login`, authenticated-but-not-onboarded to `/onboarding`. Also reads `activeEmpresaId` from token for empresa scoping.
- **`clientes/` route and components:** Only visible to users who have `ACCOUNTANT` role on at least one EmpresaUsuario. Hidden from single-empresa owners.
- **`tenant-context.service.ts`:** Every data-fetching service call passes through this to resolve and validate the active empresa. Prevents one user from accessing another's data.

---

## Architectural Patterns

### Pattern 1: Server Component Shell + Client Island

**What:** Server Component fetches data (scoped to `activeEmpresaId`) and passes it as serializable props to a Client Component for interactivity.
**When to use:** Dashboard, obligaciones table, profile page — anywhere you need server-fetched data AND user interaction.
**Trade-offs:** Best performance (server-fetched, no client waterfall). Slightly more files (two components per page).

```typescript
// app/(dashboard)/dashboard/page.tsx — Server Component
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TaxCalendar } from '@/components/calendar/TaxCalendar';
import { resolveEmpresaId } from '@/lib/services/tenant-context.service';

export default async function DashboardPage() {
  const session = await auth();
  const empresaId = resolveEmpresaId(session); // reads activeEmpresaId from JWT
  const obligations = await prisma.obligacionTributaria.findMany({
    where: { empresaId },
    include: { impuesto: true },
  });

  return (
    <main>
      <SummaryCards obligations={obligations} />
      <TaxCalendar obligations={obligations} />
    </main>
  );
}
```

### Pattern 2: Thin Server Action + Service Function

**What:** Server Actions validate input with Zod and delegate all business logic to a service function.
**When to use:** All mutations.
**Trade-offs:** Services are testable and reusable (cron can call the same service). More files but much better testability.

```typescript
// actions/profile.actions.ts
'use server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { resolveEmpresaId } from '@/lib/services/tenant-context.service';
import { updateEmpresaProfile } from '@/lib/services/tax-matching.service';

const ProfileSchema = z.object({ /* ... */ });

export async function updateProfile(formData: FormData) {
  const session = await auth();
  const empresaId = resolveEmpresaId(session);
  const parsed = ProfileSchema.parse(Object.fromEntries(formData));
  await updateEmpresaProfile(empresaId, parsed);
  revalidatePath('/dashboard');
}
```

### Pattern 3: Declarative Rule Evaluation (Matching Engine)

**What:** Tax rules stored as database rows (`ImpuestoCondicion`), not code branches. A generic evaluator iterates conditions against the empresa profile and filters to matching taxes.
**When to use:** Determining which obligations apply to an empresa.
**Trade-offs:** Easy to add/change taxes without code changes. Slightly harder to debug than explicit if/else (add logging to condition evaluation). At ~12 taxes and ~50 conditions, performance is not a concern.

```typescript
// lib/services/tax-matching.service.ts
type Operator = 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN'
  | 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_EQUAL' | 'LESS_EQUAL';

function evaluateSingleCondition(
  condition: ImpuestoCondicion,
  empresa: EmpresaProfile
): boolean {
  const actual = empresa[condition.campo as keyof EmpresaProfile];
  const expected = condition.valor;

  switch (condition.operador as Operator) {
    case 'EQUALS':       return actual === expected;
    case 'IN':           return expected.split(',').includes(String(actual));
    case 'GREATER_THAN': return Number(actual) > Number(expected);
    // ... other operators
  }
}

export async function generateObligaciones(
  empresa: EmpresaProfile
): Promise<Omit<ObligacionTributaria, 'id'>[]> {
  const taxes = await prisma.impuesto.findMany({
    include: { condiciones: true, fechasVencimiento: true }
  });

  return taxes
    .filter(tax => tax.condiciones.every(c => evaluateSingleCondition(c, empresa)))
    .flatMap(tax => buildObligaciones(tax, empresa));
}
```

### Pattern 4: Empresa-Scoped Data Access

**What:** Every database query that touches tenant data includes `WHERE empresaId = :activeEmpresaId` plus a membership check. The `tenant-context.service.ts` centralizes this resolution.
**When to use:** Every Server Component, Server Action, and Route Handler that reads or writes empresa-scoped data.
**Trade-offs:** Adds one function call to every data path. Prevents accidental data leaks between empresas.

```typescript
// lib/services/tenant-context.service.ts
import { Session } from 'next-auth';
import { prisma } from '@/lib/db';

export function resolveEmpresaId(session: Session): string {
  const empresaId = session.user.activeEmpresaId;
  if (!empresaId) throw new Error('No active empresa in session');
  return empresaId;
}

export async function assertMembership(
  userId: string,
  empresaId: string,
  requiredRoles?: ('OWNER' | 'ACCOUNTANT' | 'VIEWER')[]
): Promise<void> {
  const membership = await prisma.empresaUsuario.findFirst({
    where: {
      userId,
      empresaId,
      ...(requiredRoles ? { rol: { in: requiredRoles } } : {}),
    },
  });
  if (!membership) throw new Error('Unauthorized: no membership');
}
```

### Pattern 5: Cron Route Handler with Secret Auth

**What:** `/api/cron/daily` receives scheduled HTTP GET from Vercel Cron. Validates Bearer token. Runs status sweep then notification dispatch.
**When to use:** Daily automated processing.
**Trade-offs:** Vercel Cron only runs in production. Test locally by calling the route with curl + secret header. Idempotent via `ultimoEnvio` timestamp.

```typescript
// app/api/cron/daily/route.ts
import { updateObligationStatuses } from '@/lib/services/obligation-status.service';
import { dispatchDueNotifications } from '@/lib/services/notification.service';

export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await updateObligationStatuses();  // Stage 1: sweep PENDIENTE → PROXIMO → VENCIDO
  await dispatchDueNotifications();  // Stages 2-4: query, route, deliver

  return Response.json({ ok: true, timestamp: new Date().toISOString() });
}
```

---

## Data Flow

### User Authentication Flow

```
Browser: POST /login (email + password)
    ↓
Server Action: auth.actions.ts
    ↓
NextAuth.js: CredentialsProvider.authorize()
    ↓ validates against DB
Prisma: User.findUnique({ where: { email } }) + bcrypt compare
    ↓ returns user object
NextAuth.js: JWT callback — set activeEmpresaId to user's first/default empresa
    ↓ creates JWT session, sets HttpOnly cookie
Middleware: reads JWT, checks onboardingComplete
    ↓ if false → redirect /onboarding
    ↓ if true  → allow /dashboard
```

### Onboarding → Tax Matching Flow

```
User: submits step 4 (montos)
    ↓
Client Component: calls Server Action completeOnboarding(data)
    ↓
Server Action: validates with Zod, writes EmpresaProfile to DB
    ↓ creates EmpresaUsuario { userId, empresaId, rol: OWNER }
    ↓ sets empresa.onboardingComplete = true
    ↓ sets user session activeEmpresaId to new empresa
    ↓ calls TaxMatchingService.generateObligaciones(empresa)
    ↓
TaxMatchingService:
    ↓ loads all Impuesto + ImpuestoCondicion from DB
    ↓ evaluates each tax's conditions vs empresa profile
    ↓ for matched taxes: loads FechaVencimiento rows for the empresa's NIT digit(s)
    ↓ builds ObligacionTributaria records with concrete due dates
    ↓
Prisma: prisma.obligacionTributaria.createMany(obligations)
    ↓
Server Action: revalidatePath('/dashboard')
    ↓
Browser: redirected to /dashboard with obligations populated
```

### Daily Cron Flow

```
Vercel Cron Scheduler: GET /api/cron/daily (with Bearer token)
    ↓
Route Handler: validates Authorization header
    ↓
Stage 1 — ObligationStatusService.updateStatuses():
    ↓ Bulk UPDATE: PENDIENTE where daysUntilDue ≤ 15 → PROXIMO
    ↓ Bulk UPDATE: PROXIMO where fechaVencimiento < today → VENCIDO
    ↓
Stage 2 — NotificationService.findDueNotifications():
    ↓ Query obligations at 15/7/3/1/0 day thresholds
    ↓ WHERE ultimoEnvio IS NULL OR ultimoEnvio < current threshold window
    ↓ JOIN EmpresaUsuario to get all recipients (owners + accountants)
    ↓
Stage 3 — NotificationService.routeAndDeliver():
    ↓ For each recipient × obligation:
    ↓   → Create Notificacion row (in-app, always)
    ↓   → If user.emailNotifications: queue email via Resend
    ↓ Batch Resend.emails.send() calls
    ↓ Update obligacion.ultimoEnvio = now()
    ↓
Route Handler: return 200 OK with summary
```

### Accountant Client-Switching Flow

```
Accountant: clicks Client Switcher dropdown → selects "Empresa ABC"
    ↓
Client Component: calls update() from next-auth/react
    { activeEmpresaId: "empresa-abc-id" }
    ↓
NextAuth JWT callback: validates membership via EmpresaUsuario lookup
    ↓ if valid: updates token.activeEmpresaId + token.activeRole
    ↓ if invalid: rejects (keeps previous activeEmpresaId)
    ↓
JWT refreshed: new cookie set with updated activeEmpresaId
    ↓
Router.refresh(): all Server Components re-fetch with new empresa scope
    ↓
Dashboard, calendar, obligaciones table: now show Empresa ABC's data
```

### Profile Edit → Recalculation Flow

```
User: updates tax-relevant field (e.g., changes regimen from ORDINARIO to SIMPLE)
    ↓
Client form: calls Server Action updateProfile(formData)
    ↓
Server Action: validates with Zod
    ↓ assertMembership(userId, empresaId, ['OWNER'])  ← accountants can't edit
    ↓ writes EmpresaProfile update to DB
    ↓ detects tax-relevant fields changed (diff check against previous)
    ↓ if changed: calls TaxMatchingService.regenerateObligaciones(empresaId)
    ↓
TaxMatchingService.regenerateObligaciones():
    ↓ deletes existing PENDIENTE and PROXIMO obligations (preserves PAGADO)
    ↓ re-runs matching engine with updated profile
    ↓ creates new ObligacionTributaria records
    ↓ deduplicates against preserved PAGADO records (same impuesto + periodo)
    ↓
Server Action: revalidatePath('/dashboard')
```

### State Management

```
Server State (Prisma / PostgreSQL):
    ObligacionTributaria → read by Server Components → passed to Client islands
    Empresa + EmpresaUsuario → membership graph
    Notificacion → in-app notification storage

Client State (React useState / context):
    OnboardingWizard.currentStep — local, ephemeral
    ObligacionesTable.filters    — local (filter state)
    NotificationBell.unreadCount — fetched on mount, invalidated on read
    ActiveEmpresaContext         — mirrors JWT activeEmpresaId for UI display

No global client store needed for v1.
React Context: theming (shadcn/ui ThemeProvider) + activeEmpresa display name.
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith is perfect. Single Vercel project, Neon free tier, no caching layer needed. Cron processes all users in one invocation. |
| 1k-10k users | Add Prisma Accelerate or PgBouncer for connection pooling. Cron job may need batching (process 500 empresas per batch). Consider Neon paid tier. |
| 10k+ users | Separate the cron/notification worker to Inngest or QStash for reliability + retry logic. Add DB read replica for dashboard queries. Consider Redis for notification counts. |

### Scaling Priorities

1. **First bottleneck:** Prisma connection pool exhausted by Vercel serverless cold starts. Fix with Prisma singleton + Accelerate connection pooler. Implement from day one.
2. **Second bottleneck:** Cron job timeout processing thousands of obligation updates in one Lambda invocation (Vercel has 10s limit on hobby, 60s on Pro). Fix by batching updates or migrating cron to Inngest.
3. **Third bottleneck:** Notification email volume exceeding Resend free tier (100/day). Fix by upgrading Resend plan or adding email batching with priority queue (imminent deadlines first).

---

## Anti-Patterns

### Anti-Pattern 1: Business Logic in Server Actions

**What people do:** Write matching engine logic directly inside `onboarding.actions.ts`.
**Why it's wrong:** Cron job can't reuse the matching logic. Actions become 200+ lines and untestable.
**Do this instead:** Keep Server Actions thin (validate → call service → revalidate). All logic in `lib/services/*.service.ts`.

### Anti-Pattern 2: New Prisma Client Per Request

**What people do:** `const prisma = new PrismaClient()` at the top of each file.
**Why it's wrong:** Vercel serverless creates a Lambda per request. Each Lambda opens a new DB connection. At moderate traffic this exhausts PostgreSQL's connection limit.
**Do this instead:** Singleton from `lib/db.ts` using the global pattern:

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Anti-Pattern 3: Filtering by userId Instead of empresaId

**What people do:** Query obligations `WHERE userId = currentUser` assuming one user = one empresa.
**Why it's wrong:** Breaks the moment an accountant manages multiple empresas. Also breaks if a business has multiple users (owner + accountant + viewer).
**Do this instead:** Always filter by `empresaId` from the session's `activeEmpresaId`. The `EmpresaUsuario` table is the source of truth for who can access what.

### Anti-Pattern 4: Single Auth Config for Edge + Node

**What people do:** Import `auth` (with Prisma adapter) into `middleware.ts`.
**Why it's wrong:** Vercel Edge runtime doesn't support `bcrypt` or `@auth/prisma-adapter`. Build fails or middleware crashes.
**Do this instead:** Two config files — `auth.config.ts` (edge-safe) for middleware, `auth.ts` (full Node.js) for everything else.

### Anti-Pattern 5: Rebuilding ALL Obligations on Profile Edit

**What people do:** Delete all `ObligacionTributaria` rows and re-run matching on every profile save.
**Why it's wrong:** Destroys `PAGADO` records (payment history).
**Do this instead:** Only delete `PENDIENTE` and `PROXIMO` obligations. Preserve `PAGADO`. Deduplicate new obligations against preserved ones by (impuesto + periodo).

### Anti-Pattern 6: Hardcoding NIT Date Tables in Code

**What people do:** Write a giant switch statement mapping NIT digits to dates.
**Why it's wrong:** Changes every year when DIAN publishes the new calendar. Requires a code deploy to update dates.
**Do this instead:** Store NIT-to-date mappings in the database (`FechaVencimiento` table). Admin can update via seed script or admin UI. No code change needed.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL (Neon/Supabase) | Prisma singleton via `DATABASE_URL` | Use singleton pattern from day one. Neon supports connection pooling natively. |
| Resend (email) | `resend.emails.send()` from `notification.service.ts` | Server-only. API key in `RESEND_API_KEY`. Rate limit: 100/day free tier. Batch sends. |
| Vercel Cron | HTTP GET to `/api/cron/daily` on schedule | Set in `vercel.json`. Validate with `CRON_SECRET`. Production-only — test locally with curl. |
| NextAuth.js | Credentials provider, JWT strategy, Prisma adapter | JWT stores `activeEmpresaId` for empresa scoping. Two config files for edge/node split. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Server Component → Client Component | Props (serializable only) | No functions, no Prisma objects — map to plain types first |
| Client Component → Server | Server Actions (`'use server'`) | Preferred over fetch() for mutations |
| Route Handler → Service Layer | Direct function call | Route Handlers own HTTP concerns; services own business logic |
| Cron Route → Services | Direct function call | Same services used in onboarding and profile edit |
| Middleware → Auth | `auth()` from NextAuth.js edge config | Edge-compatible — no adapter, no bcrypt |
| Actions → DB | Via service functions only | Actions never call Prisma directly |
| All data paths → Tenant Context | `resolveEmpresaId()` + `assertMembership()` | Every query must be scoped to validated empresaId |

### Key Dependency: Two NextAuth Config Files

Required for Next.js 14 + NextAuth.js v5 + Prisma + Vercel Edge middleware:

```
auth.config.ts  → Edge-compatible (no Prisma adapter, no bcrypt)
                   Used by: middleware.ts
                   Purpose: fast route protection at edge

auth.ts         → Node.js runtime (includes PrismaAdapter, bcrypt)
                   Used by: Server Components, Server Actions, Route Handlers
                   Purpose: full session + database integration + activeEmpresaId
```

---

## Suggested Build Order (Dependency Graph)

The following order respects hard dependencies between components. Each phase produces a working vertical slice.

```
Phase 1: Foundation
├── Database schema (Prisma models: User, Empresa, EmpresaUsuario,
│   Impuesto, ImpuestoCondicion, FechaVencimiento, ObligacionTributaria,
│   Notificacion, UvtConfig)
│   └── Required by: everything else
├── Prisma singleton (lib/db.ts)
│   └── Required by: all DB access
├── NextAuth.js setup (auth.ts + auth.config.ts + JWT with activeEmpresaId)
│   └── Required by: middleware, all authenticated pages
└── Middleware (route protection + onboarding gate)
    └── Required by: all protected routes

Phase 2: Tax Data (seed)
├── 12 Impuesto records + ~50 ImpuestoCondicion rows
│   └── Required by: tax matching engine
├── FechaVencimiento NIT-digit date tables for 2026
│   └── Required by: date resolution in matching engine
└── UVT config record ($52,374 for 2026)
    └── Required by: sanctions calculator, threshold evaluations

Phase 3: Onboarding + Matching Engine
├── EmpresaProfile creation flow (4-step wizard)
│   └── Required by: dashboard (creates empresa + membership)
├── Tax Matching Engine (called at wizard completion)
│   └── Required by: dashboard (generates obligations)
└── Tenant Context service (resolveEmpresaId + assertMembership)
    └── Required by: all dashboard queries

Phase 4: Dashboard Core
├── Calendar UI (reads obligations, scoped to activeEmpresaId)
│   └── Depends on: Phase 3 (obligations exist)
├── Summary cards (counts, next deadlines, overdue)
│   └── Depends on: Phase 3
└── Obligaciones table (filterable, paginated)
    └── Depends on: Phase 3

Phase 5: Actions + Sanctions
├── Mark paid / mark pending
│   └── Depends on: Phase 4 (UI exists)
├── Sanctions calculator (stateless, needs UVT from Phase 2)
│   └── Can be built any time after Phase 2
└── Profile edit + obligation recalculation
    └── Depends on: matching engine (Phase 3)

Phase 6: Notifications
├── In-app notification model + bell component
│   └── Depends on: Phase 1 (DB schema)
├── Notification service (Resend email integration)
│   └── Depends on: Phase 1, Phase 3 (obligations exist)
└── Cron route handler (status sweep + notification dispatch)
    └── Depends on: notification service, obligation status service

Phase 7: Multi-Client (Accountant Features)
├── Client management page (add/remove client empresas)
│   └── Depends on: Phase 1 (EmpresaUsuario model)
├── Client Switcher UI (dropdown in dashboard layout)
│   └── Depends on: Phase 3 (tenant context service)
├── Session switching (JWT activeEmpresaId update)
│   └── Depends on: Phase 1 (NextAuth callbacks)
└── Notification routing to accountants
    └── Depends on: Phase 6 (notification pipeline)
```

**Why this order:**

1. **Schema first** — every feature depends on the data model being stable. Changing the schema later cascades to all Prisma queries and service functions.
2. **Auth before any page** — middleware must protect routes from the start.
3. **Seed data before matching engine** — the engine reads from `Impuesto`, `ImpuestoCondicion`, and `FechaVencimiento` tables. Without seed data, nothing matches.
4. **Onboarding before dashboard** — the dashboard renders `ObligacionTributaria` rows which only exist after the matching engine runs at onboarding completion.
5. **Dashboard before actions** — "mark paid" needs the obligations table UI to exist first.
6. **Notifications after core flows** — least dependency on UI. Pure backend. Riskiest component (external service, production-only cron). Best validated after core flows are stable.
7. **Multi-client last** — the single-user experience must work before adding multi-empresa support. The `EmpresaUsuario` table exists from Phase 1, but the UI and switching logic can be layered on without refactoring. A single-empresa owner never sees the client switcher.

**Build order implications for roadmap:**
- Phases 1-4 are the **critical path** — they must be sequential because each depends on the previous.
- Phase 5 (actions/sanctions) can partially overlap with Phase 4 (sanctions calculator has no UI dependency).
- Phase 6 (notifications) can begin development in parallel with Phase 5 since it depends on Phases 1 and 3, not 4 or 5.
- Phase 7 (multi-client) is an **enhancement layer** that can ship as a v1.1 feature if timeline is tight. The core product works without it (single-empresa users).

---

## Sources

- [Next.js App Router Architecture 2026 (yogijs.tech)](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router) — MEDIUM confidence (community blog, current 2026)
- [SaaS Architecture Patterns with Next.js (vladimirsiedykh.com)](https://vladimirsiedykh.com/blog/saas-architecture-patterns-nextjs) — MEDIUM confidence (detailed production guide)
- [Next.js App Router Project Structure — Makerkit](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure) — HIGH confidence (production-validated SaaS boilerplate with multi-tenant support)
- [NextAuth.js v5 Migration Guide — authjs.dev](https://authjs.dev/getting-started/migrating-to-v5) — HIGH confidence (official documentation)
- [Vercel Cron Jobs Quickstart — vercel.com/docs](https://vercel.com/docs/cron-jobs/quickstart) — HIGH confidence (official Vercel documentation)
- [Prisma Singleton Pattern for Next.js — prisma.io/nextjs](https://www.prisma.io/nextjs) — HIGH confidence (official Prisma recommendation)
- [Multi-Tenancy Implementation Approaches with Prisma — ZenStack](https://zenstack.dev/blog/multi-tenant) — MEDIUM confidence (verified against Prisma docs)
- [Multi-Tenant SaaS with Next.js 14 — Dev Genius](https://blog.devgenius.io/building-a-multi-tenant-saas-app-with-next-js-14-3df64e5a4cc4) — MEDIUM confidence (community, aligns with official patterns)
- [Building a Rules Engine with TypeScript — Medium](https://benjamin-ayangbola.medium.com/building-a-rule-engine-with-typescript-1732d891385c) — LOW confidence (single source, pattern validated against multiple rule engine implementations)
- [Simple Rules Engine in TypeScript — wtjungle.com](https://wtjungle.com/blog/simple-rules-engine-ts/) — MEDIUM confidence (verified code patterns, generic approach confirmed by multiple TS rule engine repos)
- [Notification Service Design with Architectural Diagrams — Pingram](https://www.pingram.io/blog/notification-service-design-with-architectural-diagrams) — MEDIUM confidence (system design reference)
- [How to Design a Notification System — System Design Handbook](https://www.systemdesignhandbook.com/guides/design-a-notification-system/) — MEDIUM confidence (verified pipeline stages against multiple sources)
- [DIAN Calendario Tributario 2026 — Infobae](https://www.infobae.com/colombia/2025/12/25/calendario-tributario-dian-2026-fechas-clave-para-la-declaracion-y-pago-de-impuestos-nacionales-en-colombia-segun-el-nit/) — HIGH confidence (references official DIAN decreto)
- [Calendario Tributario 2026 — Buk Colombia](https://www.buk.co/blog/calendario-tributario-2026-en-colombia-) — MEDIUM confidence (cross-referenced with DIAN official)
- [DIAN Calendario Tributario Oficial](https://www.dian.gov.co/Paginas/CalendarioTributario.aspx) — HIGH confidence (official DIAN source)

---
*Architecture research for: Colombian Tax Calendar SaaS (Calendario Tributario)*
*Researched: 2026-02-26*
