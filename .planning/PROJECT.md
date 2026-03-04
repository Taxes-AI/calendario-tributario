# Calendario Tributario Colombia

## What This Is

A fullstack SaaS web application that serves as a Colombian Tax Calendar (Calendario Tributario). It helps accountants and Colombian businesses track their tax obligations, due dates, and potential penalties automatically based on their tax profile. The app matches a company's tax regime, size, location, and economic activity against real Colombian tax rules to generate a personalized obligation calendar with automated reminders.

## Core Value

Every Colombian business knows exactly what taxes they owe, when they're due, and what happens if they're late — automatically calculated from their tax profile and NIT.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User authentication (email/password with NextAuth.js credentials provider)
- [ ] Onboarding wizard to capture company tax profile (4 steps: empresa data, régimen/tamaño, actividad CIIU + ciudad, montos)
- [ ] Seed database with 12 real Colombian taxes (8 national DIAN + 4 district/municipal) with real conditions and 2025 due dates by NIT last digit
- [ ] Tax matching engine that cross-references empresa profile against ImpuestoCondicion to auto-generate ObligacionTributaria
- [ ] Dashboard with interactive monthly calendar showing color-coded due dates (green=paid, yellow=upcoming, red=overdue, blue=pending)
- [ ] Dashboard summary cards (month total, next 7 days, overdue alerts, paid count)
- [ ] Obligaciones table with filters (estado, impuesto, entidad, período) and actions (mark paid, view detail)
- [ ] Sanctions calculator (extemporaneidad 5%/month per Art. 641 ET, minimum 10 UVT, moratory interest)
- [ ] In-app notifications with unread badge + email notifications via Resend at 15/7/3/1 days before due
- [ ] Cron endpoint for automated status updates (PENDIENTE→PROXIMO→VENCIDO) and notification dispatch
- [ ] Profile editing with automatic obligation recalculation when tax-relevant fields change
- [ ] Configurable UVT value (admin-updateable yearly, currently $49,799 for 2025)
- [ ] Responsive mobile-first UI with dark mode, collapsible sidebar, loading skeletons, empty states
- [ ] All user-facing copy in Spanish

### Out of Scope

- Multi-empresa per user — complexity not needed for v1, deferred to v2
- Payment processing / monetization — free for now, no tier logic
- OAuth providers (Google, etc.) — email/password sufficient for v1
- Mobile native app — web responsive is enough
- Real-time Superfinanciera interest rate API — use approximate fixed value
- Automated DIAN filing integration — calendar/tracking only, no submission
- Multi-year historical data — v1 focuses on current year (2025)

## Context

**Domain:** Colombian tax compliance. Governed by the Estatuto Tributario (ET), DIAN regulations, and municipal tax codes. Tax deadlines vary by the last digit of the company's NIT (tax ID). The UVT (Unidad de Valor Tributario) is the base unit for thresholds and penalties — updated annually by DIAN.

**Target users:** Colombian accountants (contadores) and small/medium businesses who need to track multiple tax obligations across national (DIAN) and municipal (ICA, predial, bomberil) levels.

**Key complexity:** The tax matching logic — each tax has different applicability conditions based on regime, company size, city, economic activity (CIIU code), and income/asset thresholds. Due dates are further personalized by the last NIT digit.

**12 taxes to seed:**
1. Renta y complementarios (DIAN, annual)
2. IVA (DIAN, bimonthly/quarterly)
3. Retención en la fuente (DIAN, monthly)
4. ICA Retención (DIAN, varies by city)
5. Régimen Simple (DIAN, bimonthly + annual)
6. Impuesto al patrimonio (DIAN, annual, threshold-based)
7. GMF 4x1000 (DIAN, informational)
8. Información exógena (DIAN, annual, threshold-based)
9. ICA Industria y Comercio (municipal, varies by city)
10. Predial (municipal, annual, informational)
11. Sobretasa bomberil (district, annual, select cities)
12. Avisos y tableros (municipal, complementary to ICA)

## Constraints

- **Tech stack**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma ORM, NextAuth.js — non-negotiable per user spec
- **Deployment**: Vercel — cron jobs via Vercel Cron, email via Resend
- **Project location**: `./calendario-tributario/` subdirectory
- **Language**: All UI in Spanish, code in English
- **Data model**: 1:1 User↔EmpresaProfile for v1
- **State management**: React Context or Zustand for global user state

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 1:1 User-Empresa for v1 | Simplifies data model, multi-empresa deferred | — Pending |
| Configurable UVT via DB/admin | Future-proof, avoids code changes yearly | — Pending |
| Resend for email (nodemailer fallback) | Vercel-friendly, simple API | — Pending |
| Credentials provider only | Sufficient for v1, OAuth deferred | — Pending |
| Spanish-only UI | Target market is Colombian, no i18n overhead | — Pending |
| Sanctions as estimates with disclaimer | Legal liability protection, not a substitute for contador | — Pending |

---
*Last updated: 2026-02-26 after initialization*
