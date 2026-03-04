# Pitfalls Research

**Domain:** Colombian Tax Calendar SaaS (Next.js 14 + Prisma + NextAuth)
**Researched:** 2026-02-26
**Confidence:** MEDIUM (Colombian tax law edge cases from professional sources; tech pitfalls from official docs + community)

---

## Critical Pitfalls

### Pitfall 1: NIT-Based Due Dates Are Business Days, Not Calendar Days

**What goes wrong:**
The app stores or displays due dates as fixed calendar dates (e.g., "March 15"). In reality, DIAN's Decreto 2229 of 2023 defines deadlines in *días hábiles* (business days) counted from the start of the filing window. The published calendar dates already account for this, but they change every year. If you hardcode 2025 dates, 2026 will be wrong. The last two digits of the NIT matter for annual taxes (Renta), while the last one digit matters for monthly taxes (Retención en la fuente, IVA bimestral). Getting this wrong produces incorrect due dates for every user.

**Why it happens:**
Developers see a table of dates and model them as static data. The underlying rule — "Nth business day of the period, staggered by NIT digit" — is invisible in the published calendar.

**How to avoid:**
- Model due dates with a NIT-digit lookup table per tax and per period, not as hardcoded date strings.
- Seed 2025 data with the explicit rule logic documented in comments (e.g., "Retención: last digit 0 = 8th business day of following month").
- Add a yearly admin workflow to import the new DIAN PDF calendar and validate against rule logic before making it live.
- Use UTC-5 (Colombia's timezone, no DST) for all date comparisons — never rely on server timezone.

**Warning signs:**
- Due dates for different NIT digits map to the same day (indicates business-day staggering was ignored).
- A date falls on a Saturday or Sunday (confirms calendar days were used instead of business days).
- All obligations show the same due date regardless of NIT last digit.

**Phase to address:** Database seed phase (Phase 1). The data model must express NIT-digit staggering before any obligation matching is built.

---

### Pitfall 2: ICA Is Not One Tax — It Is 1,100 Different Municipal Taxes

**What goes wrong:**
The app models ICA (Industria y Comercio) as a single uniform obligation. In practice, each of Colombia's ~1,100 municipalities sets its own: tariff rate (per-thousand based on CIIU activity), filing periodicity (annual vs. bimestral — Bogotá, Barranquilla, Cali, Yopal, Sincelejo, Tunja file bimestral), ReteICA applicability, and payment platform. A business operating in Bogotá has radically different ICA obligations than one in a small municipality. Confusing ICA (the periodic tax) with ReteICA (withholding applied by buyers/payers) causes doubled obligations or missed ones.

**Why it happens:**
DIAN is the national authority and easy to research. Municipal tax codes are decentralized across 1,100 portals — there is no single source of truth. Developers scope for "ICA" as if it were a DIAN obligation.

**How to avoid:**
- For v1, explicitly scope to the most common cities in your seed data: Bogotá, Medellín, Cali, Barranquilla.
- Clearly document in the schema which `ImpuestoCondicion` rows apply to which municipios, with a `municipio` field on the condition.
- Treat ICA and ReteICA as separate tax records — the user's ciudad field must drive which one(s) apply.
- Display prominently in UI that ICA due dates and rates shown are for the user's registered city only, and may differ if activity occurred in other municipalities (territorialidad principle).
- Add disclaimer: ICA in other cities where the company operates is out of scope for v1.

**Warning signs:**
- ICA obligation appears for companies in cities not yet seeded.
- A user reports their ICA calendar shows annual when their city is bimestral (or vice versa).
- The ReteICA and ICA lines both show up as obligations for the same company without distinguishing contributor vs. agent roles.

**Phase to address:** Tax seed data and matching engine phases (Phases 1–2). ICA city-scoping must be explicit in the data model.

---

### Pitfall 3: UVT Value Is Annual — Hardcoding It Breaks Sanctions and Thresholds Every January

**What goes wrong:**
Sanction calculations (extemporaneidad, minimum 10 UVT), Información exógena thresholds (2,400 UVT for corporations, 11,800 UVT for natural persons), and patrimony tax thresholds all use UVT. UVT changes every year (2025: $49,799 COP; 2026: $52,374 COP). If UVT is hardcoded in the application logic, every sanction estimate and tax applicability check is wrong from January 1 onward. The UVT-based threshold also determines whether Información exógena applies at all — a misclassification means an obligation is silently omitted for affected companies.

**Why it happens:**
The initial seed uses the current year's UVT as a constant and nobody writes a migration or admin UI to update it.

**How to avoid:**
- Store UVT in the database (`ConfiguracionSistema` table with `clave: 'UVT_VIGENTE'`, `valor: '49799'`).
- All sanction calculations must read UVT from DB, not from env or code constants.
- Build the admin-updateable UVT UI in the same phase as sanctions calculator — never let them diverge.
- Add a yearly operational checklist item: "Update UVT value by January 15" (DIAN announces in December).
- Show the effective UVT year prominently near sanction estimates so users can sanity-check.

**Warning signs:**
- Sanction amounts are the same between December 31 and January 1 of a new year (should change with UVT).
- Información exógena does not appear for a company that clearly exceeds the 2,400 UVT threshold.
- Code contains a literal like `49799` anywhere outside the seed migration file.

**Phase to address:** Sanctions calculator phase. The configurable UVT must be the first thing built before any sanction formula is coded.

---

### Pitfall 4: NextAuth Credentials Provider Does Not Persist Sessions to Database by Default

**What goes wrong:**
When using NextAuth v4 with the Credentials provider and a Prisma database adapter, sessions are NOT automatically stored in the database. NextAuth considers the Credentials provider "too flexible" to auto-create session records. The default behavior is JWT sessions, but if the adapter is also configured (for another reason), there is a conflict where the session strategy silently falls back or produces errors. Users log in successfully but `getServerSession()` returns null in Server Components, or session data is missing the `user.id` field needed to look up their EmpresaProfile.

**Why it happens:**
The NextAuth docs treat OAuth and Credentials flows as equivalent, but they have fundamentally different session handling. Developers add the Prisma adapter expecting it to "just work" and are surprised when credentials sessions don't persist.

**How to avoid:**
- Explicitly set `session: { strategy: 'jwt' }` in NextAuth config when using Credentials — do not rely on the default.
- Do NOT add the Prisma adapter if Credentials is your only provider (it adds complexity without benefit for JWT sessions).
- Extend the JWT callback to embed `user.id` into the token and the session callback to forward it to `session.user.id`.
- Use `getServerSession(authOptions)` (not `getSession()`) in all Server Components and Route Handlers.
- In App Router: `SessionProvider` must wrap from a Client Component, not the root layout directly.

**Warning signs:**
- `session.user.id` is undefined even after login.
- The Prisma `Session` table exists but is always empty after logins via Credentials.
- `getServerSession()` returns null in a Server Component where the user is authenticated.
- You see `JWTSessionError` in NextAuth logs.

**Phase to address:** Authentication phase (Phase 1). Get session shape correct before building any feature that reads `session.user.id`.

---

### Pitfall 5: Prisma + Next.js Hot Reload = Connection Pool Exhaustion in Development

**What goes wrong:**
In development, Next.js hot-reloads modules on every file save. Without the globalThis singleton pattern, each reload instantiates a new `PrismaClient` with its own connection pool. After 10–20 saves, the PostgreSQL connection limit is exhausted and queries start failing with "too many connections." In production (Vercel serverless), each function invocation may create its own client, and with `connection_limit` at its default, a burst of traffic can exhaust the database.

**Why it happens:**
Developers copy basic Prisma setup without the singleton pattern. The issue only surfaces after extended development sessions or under load, making it appear intermittent.

**How to avoid:**
- Use the official singleton pattern from day one:
  ```typescript
  // lib/prisma.ts
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
  export const prisma = globalForPrisma.prisma ?? new PrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  ```
- For Vercel deployment, set `connection_limit=1` in the `DATABASE_URL` connection string to start, e.g.:
  `postgresql://...?connection_limit=1&pool_timeout=20`
- Consider Prisma Accelerate or PgBouncer for connection pooling if scaling beyond the hobby tier.
- Never use `migrate dev` or `db push` in production — only `prisma migrate deploy`.

**Warning signs:**
- "Too many connections" errors appearing after coding sessions.
- Database queries intermittently time out in development.
- Errors that disappear after restarting the dev server.

**Phase to address:** Project setup (Phase 0 / boilerplate). This must be in the initial Prisma setup before any schema is added.

---

### Pitfall 6: Régimen Changes Are Not Retroactive — But Your Matching Engine May Treat Them As If They Are

**What goes wrong:**
When a user changes their `regimenTributario` in the profile (e.g., from Ordinario to SIMPLE), the system recalculates all obligations. If recalculation replaces ALL obligations including past ones, historical records with `estado: PAGADO` get deleted and re-created. Users lose their payment history. More critically, Régimen SIMPLE has fundamentally different tax obligations: IVA is not filed separately (it's embedded in SIMPLE), Retención en la fuente obligations change, and ICA is integrated. If the matching engine doesn't model the regime switch correctly, it will either add obligations that don't apply or omit ones that do.

**Why it happens:**
The v1 design uses simple recalculation on profile change. It's clean but treats the empresa as if it always had the new regime, destroying historical accuracy.

**How to avoid:**
- On profile change that affects obligations, only update FUTURE obligations (estado: PENDIENTE, PROXIMO). Obligations already marked PAGADO must be preserved.
- Add a `fechaAplicacion` to obligations — future obligations generated after a regime change are tagged with the change date.
- In the matching engine, document SIMPLE-specific rules explicitly: under SIMPLE, IVA is NOT a standalone obligation, Retención en la fuente is NOT filed separately by the company (except for certain payments), and ICA is integrated as a SIMPLE component.
- At minimum, display a warning when regime changes are saved: "Se recalcularán las obligaciones pendientes. Las obligaciones pagadas se conservarán."

**Warning signs:**
- `PAGADO` obligations disappear after a profile edit.
- A company in SIMPLE shows a standalone IVA bimestral obligation.
- A company in SIMPLE shows standard Retención en la fuente obligations they legally don't file.

**Phase to address:** Tax matching engine phase and profile editing phase (Phases 2–3).

---

### Pitfall 7: Sanctions Estimates Without Legal Disclaimer = Liability Risk

**What goes wrong:**
The app calculates sanctions (extemporaneidad 5%/month, moratory interest) and presents the number authoritatively. Colombian sanctions are calculated with nuance: Art. 641 ET applies to late filing, moratory interest rate follows Superfinanciera's certified rate (updated monthly), the minimum sanction is 10 UVT, and reduced sanctions apply if the taxpayer voluntarily corrects (15% reduction through April 2026 for pre-2025 omissions, per emergency measures). If users rely on the app's number for actual payment to DIAN, a discrepancy creates legal exposure — for the user AND potentially for the app.

**Why it happens:**
Developers focus on formula implementation and forget the legal liability dimension. The number looks exact because it's computed, so users treat it as authoritative.

**How to avoid:**
- Display a mandatory disclaimer adjacent to every sanction estimate: "Este valor es una estimación orientativa. Consulte con su contador para la liquidación oficial. La tasa de interés moratorio está sujeta a la certificación mensual de la Superfinanciera."
- Use a hardcoded approximate fixed moratory rate (e.g., 20% EA) rather than claiming to use the real Superfinanciera rate.
- Label the sanctions section "Estimación de Sanciones" not "Liquidación de Sanciones."
- Add the PROJECT.md decision: "Sanctions as estimates with disclaimer — legal liability protection."

**Warning signs:**
- The sanctions UI shows a number with zero disclaimers.
- The interest rate shown claims to be the "official" Superfinanciera rate.
- Users are confused about why their actual DIAN bill differs from the app's calculation.

**Phase to address:** Sanctions calculator phase. Disclaimer must be designed in from the first prototype — not added afterward.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode 2025 DIAN due dates as date strings | Fast initial seed | Annual manual intervention; wrong dates Jan 1 if forgotten | Never — use NIT lookup table from the start |
| Hardcode UVT value in business logic | Zero config needed | Wrong sanction calculations every January | Never — must be DB-driven from Phase 1 |
| Skip Prisma singleton pattern | Simpler initial setup | Dev crashes after 10-20 hot reloads | Never — add singleton in project boilerplate |
| Omit `session: { strategy: 'jwt' }` from NextAuth config | Less config | Silent session strategy mismatch with Prisma adapter | Never — be explicit |
| Recalculate all obligations on profile change | Simple implementation | Destroys payment history | Never for PAGADO records — only update PENDIENTE/PROXIMO |
| Scope ICA to all Colombian cities | Looks comprehensive | Inaccurate data for unseeded cities misleads users | Never — explicitly cap to seeded cities with UI warning |
| Skip timezone handling (use server local time) | No extra code | Obligations appear due on wrong days for Colombian users | Never — use America/Bogota (UTC-5) consistently |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vercel Cron | Using node-cron inside serverless function | Use `vercel.json` cron config that calls a protected route handler; node-cron won't survive serverless teardown |
| Vercel Cron | Running cron on preview deployments | Cron only runs on Production deployments; test the endpoint manually in preview |
| Resend | Complex React Email templates with Tailwind slow down sends | Keep email templates simple; avoid Tailwind-based React Email in serverless (can exceed 10s timeout) |
| Resend | Sending from unverified domain in production | Verify domain in Resend dashboard before sending to real users; test mode only works to the account email |
| Prisma migrations | Running `prisma migrate dev` in production | Use only `prisma migrate deploy` in CI/CD; `migrate dev` can be destructive and is interactive-only |
| NextAuth `getSession()` | Using `getSession()` in Server Components | Use `getServerSession(authOptions)` — `getSession()` makes an unnecessary HTTP round-trip from the server |
| DIAN calendar PDF | Scraping current-year PDF for dates | PDF structure changes yearly; manual entry with validation is safer than fragile scraping |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all obligations then filtering in JS | Slow dashboard load as obligation count grows | Filter at the DB query level with Prisma `where` clauses | ~500+ obligations per company |
| N+1 queries in obligation list (fetch empresa, then loop obligations, then fetch impuesto per row) | Slow obligaciones table | Use Prisma `include` to join impuesto and empresa in single query | Any scale |
| Unindexed `userId` on ObligacionTributaria | Full table scan on every dashboard load | Add `@@index([userId])` in Prisma schema from the start | ~1,000+ total obligations in DB |
| Cron job processing all users synchronously | Cron timeout on Vercel (60s default Hobby, 300s Pro) | Batch users or use queue; for v1 limit to first N users per run | ~100+ users |
| React-Email with Tailwind in Vercel serverless | Email sends timeout (>10s) | Use inline styles or minimal template | Immediately on Vercel |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing cron endpoint without auth | Anyone can trigger obligation recalculation or bulk email sends | Validate `Authorization: Bearer <CRON_SECRET>` header; Vercel Cron sends this automatically when configured |
| Storing plaintext password | Account takeover if DB is breached | Use bcrypt with saltRounds ≥ 10; never store raw passwords |
| Trusting `userId` from request body | User A can modify User B's obligations | Always derive `userId` from `session.user.id`, never from request input |
| SQL injection via Prisma `$queryRaw` with string concat | DB compromise | Use tagged template literals: `` prisma.$queryRaw`SELECT...WHERE id = ${id}` `` |
| Exposing full EmpresaProfile (NIT, ingresos, activos) in API response | Tax information exposure | Use Prisma `select` to return only fields needed per endpoint |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing all 12 taxes to all users | Overwhelm; confusion about non-applicable obligations | Only show obligations the matching engine determined apply to the user's profile |
| Calendar shows "no obligations this month" with no explanation | User thinks app is broken | Distinguish: "No hay obligaciones este mes para tu perfil" vs loading states |
| Obligation status auto-updated to VENCIDO without notification | User discovers overdue obligations by surprise | Send email notification at 1 day before + mark VENCIDO only after cron runs; UI should show alert banner |
| Sanctions estimate shown without COP currency formatting | Misread numbers (49799 vs $49,799) | Always format Colombian COP with `$`, thousand separator (.), decimal separator (,) per Colombian convention |
| Onboarding wizard loses state if user navigates away mid-flow | Partially completed profile; wrong obligation set | Persist wizard progress to localStorage or DB; resume on return |
| Showing English tax terminology to Colombian users | Confusion and distrust | All labels must be in Spanish: "Retención en la fuente" not "Withholding Tax" |

---

## "Looks Done But Isn't" Checklist

- [ ] **NIT-digit lookup table:** The calendar shows different dates per NIT digit, not the same date for everyone — verify by creating two test users with different NIT endings.
- [ ] **UVT-driven sanctions:** Change the UVT value in DB admin and verify all sanction estimates update without a code deploy.
- [ ] **Régimen SIMPLE matching:** A company in SIMPLE has no standalone IVA bimestral obligation and no standard Retención en la fuente — verify matching engine excludes these.
- [ ] **ICA city-scoping:** A company registered in Bogotá shows bimestral ICA; a company in a non-seeded city shows no ICA (with a clear UI explanation, not silence).
- [ ] **Cron security:** The `/api/cron` endpoint returns 401 when called without the correct Authorization header.
- [ ] **Session user.id:** `session.user.id` is populated (not undefined) in Server Components after login — check via console.log in a Server Component.
- [ ] **PAGADO preservation:** Mark an obligation PAGADO, then change the company's CIIU code in profile editor — verify the PAGADO obligation is unchanged.
- [ ] **Colombia timezone:** Due date shown in dashboard matches Colombia time (UTC-5), not server UTC time.
- [ ] **Sanctions disclaimer:** The disclaimer is present and visible without scrolling in the sanctions estimate UI.
- [ ] **Email on Vercel:** Test email notification sends in a deployed Vercel environment (not just local) — Resend timeouts only appear in production.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Hardcoded due dates (wrong year) | HIGH | Migrate all date-type columns to NIT-lookup table structure; re-seed; notify all users of recalculated obligations |
| Hardcoded UVT | MEDIUM | Add `ConfiguracionSistema` table migration; update all formula references; one-time admin action to set value |
| Destroyed PAGADO history on regime change | HIGH | Restore from DB backup; re-implement recalculation to skip PAGADO records; apologize to affected users |
| Prisma connection exhaustion in production | MEDIUM | Add `connection_limit=1` to DATABASE_URL immediately; consider PgBouncer or Prisma Accelerate for longer term |
| NextAuth session missing user.id | LOW | Fix JWT + session callbacks; existing sessions expire and users re-login (acceptable for v1) |
| Cron endpoint exposed without auth | HIGH | Rotate CRON_SECRET; audit logs for unauthorized calls; patch and redeploy |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| NIT-digit due date modeling | Phase 1: Database seed | Create two users with NIT ending in 0 and 1; confirm different due dates for monthly obligations |
| ICA city-scoping | Phase 1: Database seed | Company in Bogotá shows bimestral ICA; company in unseeded city shows no ICA with explanation |
| UVT configurable in DB | Phase 2: Sanctions calculator | Update UVT via admin UI; verify sanction estimate changes without redeploy |
| Régimen SIMPLE matching rules | Phase 2: Tax matching engine | Company in SIMPLE has no standalone IVA and no standard Retención |
| Regime change preserves PAGADO | Phase 3: Profile editing | Mark obligation paid; change CIIU; verify paid obligation survived |
| Sanctions disclaimer visible | Phase 2: Sanctions calculator | UI review: disclaimer present and visible without scroll |
| NextAuth JWT strategy explicit | Phase 1: Authentication | `session.user.id` logged in Server Component — not undefined |
| Prisma singleton pattern | Phase 0: Boilerplate | Hot reload 20 times in dev; no "too many connections" errors |
| Cron endpoint secured | Phase 4: Cron + notifications | Direct curl to `/api/cron` without auth returns 401 |
| Colombia timezone | Phase 1: Database seed | Test user sees March 8 due date as March 8 at midnight Bogotá time |
| Resend timeout in serverless | Phase 4: Email notifications | Send email notification from Vercel production (not local); confirm <5s response |
| PAGADO status after cron | Phase 4: Cron | Cron only transitions PENDIENTE→PROXIMO→VENCIDO; never touches PAGADO |

---

## Sources

- DIAN Decreto 2229 de 2023 — business day deadline framework: https://www.dian.gov.co/Paginas/CalendarioTributario.aspx
- DIAN Calendario Tributario 2026: https://www.dian.gov.co/Calendarios/Calendario_Tributario_2026.pdf
- Colombia 2026 tax calendar (TPC Group): https://en.tpcgroup-int.com/news/2026-tax-calendar-in-colombia-transfer-pricing-and-key-obligations/
- ICA territorialidad and municipal variation: https://www.consultorcontable.com/territorialidad-ica/
- ICA Bogotá bimestral specifics: https://www.haciendabogota.gov.co/es/impuestos/impuesto-de-industria-y-comercio-ica
- UVT 2025 ($49,799) and 2026 ($52,374): https://uvt.com.co/ and https://www.siigo.com/blog/valor-de-uvt/
- Información exógena thresholds and sanctions: https://nexo.legal/exogena-errores-sanciones-2026/
- Régimen Simple vs Ordinario 2025: https://www.hklaw.com/en/insights/publications/2025/01/cambios-a-la-regulacion-del-regimen-simple-de-tributacion
- NextAuth credentials + database session pitfall (official GitHub discussion): https://github.com/nextauthjs/next-auth/discussions/4394
- NextAuth session strategy mismatch (issue #9636): https://github.com/nextauthjs/next-auth/issues/9636
- Next.js App Router common mistakes (Vercel official): https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them
- Prisma best practices (official docs): https://www.prisma.io/docs/orm/more/best-practices
- Prisma singleton pattern for Next.js: https://dev.to/_877737de2d34ff8c6265/optimizing-connection-pools-with-prismaclient-singleton-pattern-in-nextjs-3emf
- Vercel cron job limitations: https://vercel.com/docs/cron-jobs/manage-cron-jobs and https://vercel.com/kb/guide/troubleshooting-vercel-cron-jobs
- Resend + Vercel serverless timeout issue: https://medium.com/@tempmailwithpassword/problems-with-resend-and-react-in-next-email-delivery-js-41a705f6e0c5
- GMF 4x1000 exemption implementation problems 2024-2025: https://siemprealdia.co/colombia/impuestos/cambios-en-el-cobro-4x1000/

---
*Pitfalls research for: Colombian Tax Calendar SaaS (calendario-tributario)*
*Researched: 2026-02-26*
