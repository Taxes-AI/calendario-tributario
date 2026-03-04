# Contably

## What This Is

A fullstack SaaS accounting and tax platform for Colombian businesses. The Colombian tax calendar (calendario tributario) is one feature within the broader platform. It helps accountants and businesses track tax obligations, due dates, and potential penalties automatically based on their tax profile. More features will be added beyond the tax calendar.

## Core Value

Every Colombian business knows exactly what taxes they owe, when they're due, and what happens if they're late — automatically calculated from their tax profile and NIT.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User authentication (email/password with Better Auth, no email verification)
- [ ] Onboarding wizard to capture company tax profile (4 steps: empresa data, regimen/tamano, actividad CIIU + ciudad, montos)
- [ ] Seed database with 12 real Colombian taxes (8 national DIAN + 4 district/municipal) with real conditions and 2026 due dates by NIT last digit
- [ ] Tax matching engine that cross-references empresa profile against tax conditions to auto-generate ObligacionTributaria
- [ ] Dashboard with interactive monthly calendar showing color-coded due dates (green=paid, yellow=upcoming, red=overdue, blue=pending)
- [ ] Dashboard summary cards (month total, next 7 days, overdue alerts, paid count)
- [ ] Obligaciones table with filters (estado, impuesto, entidad, periodo) and actions (mark paid, view detail)
- [ ] Sanctions calculator (extemporaneidad 5%/month per Art. 641 ET, minimum 10 UVT, moratory interest)
- [ ] In-app notifications with unread badge + email notifications via Resend at 15/7/3/1 days before due
- [ ] Cron endpoint for automated status updates (PENDIENTE→PROXIMO→VENCIDO) and notification dispatch
- [ ] Profile editing with automatic obligation recalculation when tax-relevant fields change
- [ ] Configurable UVT value (admin-updateable yearly, currently $52,374 for 2026)
- [ ] Responsive mobile-first UI with blue primary theme, collapsible sidebar, loading skeletons, empty states
- [ ] All user-facing copy in Spanish
- [ ] Landing page with hero, feature highlights, and CTA

### Out of Scope

- Multi-empresa per user — complexity not needed for v1, deferred to v2
- Payment processing / monetization — free for now, no tier logic
- OAuth providers (Google, etc.) — email/password sufficient for v1
- Mobile native app — web responsive is enough
- Real-time Superfinanciera interest rate API — use approximate fixed value
- Automated DIAN filing integration — calendar/tracking only, no submission
- Multi-year historical data — v1 focuses on current year (2026)

## Context

**Domain:** Colombian tax compliance. Governed by the Estatuto Tributario (ET), DIAN regulations, and municipal tax codes. Tax deadlines vary by the last digit of the company's NIT (tax ID). The UVT (Unidad de Valor Tributario) is the base unit for thresholds and penalties — updated annually by DIAN.

**Target users:** Colombian accountants (contadores) and small/medium businesses who need to track multiple tax obligations across national (DIAN) and municipal (ICA, predial, bomberil) levels.

**Key complexity:** The tax matching logic — each tax has different applicability conditions based on regime, company size, city, economic activity (CIIU code), and income/asset thresholds. Due dates are further personalized by the last NIT digit.

**12 taxes seeded:**
1. Renta y complementarios (DIAN, annual)
2. IVA (DIAN, bimonthly/quarterly)
3. Retencion en la fuente (DIAN, monthly)
4. ICA Retencion (DIAN, varies by city)
5. Regimen Simple (DIAN, bimonthly + annual)
6. Impuesto al patrimonio (DIAN, annual, threshold-based)
7. GMF 4x1000 (DIAN, informational)
8. Informacion exogena (DIAN, annual, threshold-based)
9. ICA Industria y Comercio (municipal, varies by city)
10. Predial (municipal, annual, informational)
11. Sobretasa bomberil (district, annual, select cities)
12. Avisos y tableros (municipal, complementary to ICA)

## Constraints

- **Tech stack**: Next.js 15 App Router, TypeScript, Tailwind CSS 4, shadcn/ui (new-york style), MongoDB, Prisma 6, Better Auth
- **Deployment**: Vercel — cron jobs via Vercel Cron, email via Resend
- **Language**: All UI in Spanish, code in English
- **Data model**: 1:1 User↔Empresa for v1
- **Design**: Blue primary theme (oklch), Geist font family, neutral base palette

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| App name: Contably | Broader accounting platform, not just tax calendar | Done |
| No email verification on signup | Faster onboarding, redirect straight to /onboarding | Done |
| Better Auth (not NextAuth) | Better DX, built-in Prisma adapter, simpler config | Done |
| MongoDB (not PostgreSQL) | Flexible document model, Prisma 6 support | Done |
| Blue primary theme | Professional, trustworthy feel for financial app | Done |
| 1:1 User-Empresa for v1 | Simplifies data model, multi-empresa deferred | Done |
| Configurable UVT via DB/admin | Future-proof, avoids code changes yearly | Done |
| Resend for email | Vercel-friendly, simple API | Done |
| Spanish-only UI | Target market is Colombian, no i18n overhead | Done |
| Sanctions as estimates with disclaimer | Legal liability protection, not a substitute for contador | Done |

---
*Last updated: 2026-03-03*
