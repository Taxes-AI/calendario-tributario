# Roadmap: Calendario Tributario

## Overview

This roadmap delivers a Colombian tax calendar SaaS from zero to a working multi-client application in 6 phases. The build order follows hard data dependencies: the database schema and auth must exist before seed data can be loaded, seed data must exist before the matching engine can evaluate obligations, obligations must exist before the dashboard can display them, and notifications and sanctions layer on top of working obligations. Multi-client support for accountants is the final phase because it cross-cuts every layer and the single-user experience must work correctly first.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Database schema, authentication, tax seed data, and base layout
- [x] **Phase 2: Onboarding & Matching Engine** - Company profile wizard and obligation generation from tax rules
- [x] **Phase 3: Dashboard & Calendar** - Calendar view, obligations table, summary cards, and mark-as-paid
- [x] **Phase 4: Profile Management & Sanctions** - Profile editing with recalculation and penalty calculator
- [ ] **Phase 5: Notifications & Automation** - Email reminders, in-app notifications, and daily cron status updates
- [ ] **Phase 6: Multi-Client for Accountants** - Multi-empresa management, client switching, and data isolation

## Phase Details

### Phase 1: Foundation

**Goal**: Users can create accounts, log in, and access a protected app shell with all tax reference data seeded and ready for the matching engine **Depends on**: Nothing (first phase) **Requirements**: AUTH-01, AUTH-02, AUTH-03, MTCH-03, GENL-01, GENL-02 **Success Criteria** (what must be TRUE):

1. User can sign up with email/password and is redirected to the app
2. User can log in, remain logged in across browser sessions, and log out from any page
3. Unauthenticated users are redirected to the login page when accessing protected routes
4. The app shell renders in Spanish with responsive layout on both desktop and mobile
5. Database contains all 12 tax definitions, their applicability conditions, NIT-digit date tables for 2026, UVT value, and Colombian holidays **Plans**: 3/3 complete

Plans:

- [x] 01-01: Scaffold Next.js 15, Prisma schema, utility layer, Spanish root layout
- [x] 01-02: Better Auth config, landing page, auth pages, app shell with navigation
- [x] 01-03: DIAN 2026 seed data files and seed script

### Phase 2: Onboarding & Matching Engine

**Goal**: New users complete a guided wizard to describe their business, and the system automatically generates their personalized tax obligations with correct due dates **Depends on**: Phase 1 **Requirements**: ONBD-01, ONBD-02, ONBD-03, MTCH-01, MTCH-02 **Success Criteria** (what must be TRUE):

1. User completes a 4-step onboarding wizard capturing empresa type, regime, size, NIT, CIIU code, city, and income thresholds
2. Wizard progress survives page refresh (per-step server persistence)
3. Upon completing onboarding, the system generates ObligacionTributaria records matching the empresa profile against seeded tax conditions
4. Generated obligations have correct due dates calculated from the empresa NIT last digit(s) and the seeded date tables
5. Users who have not completed onboarding are gated from accessing the dashboard **Plans**: 3/3 complete

Plans:

- [x] 02-01: Empresa/ObligacionTributaria Prisma models, NIT validator, Zod schemas, CIIU data
- [x] 02-02: Matching engine with condition evaluation and obligation generation (+ vitest tests)
- [x] 02-03: Onboarding wizard UI with shadcn, server actions, onboarding gate

### Phase 3: Dashboard & Calendar

**Goal**: Users can see all their tax obligations on a visual calendar, browse and filter them in a table, and mark obligations as paid **Depends on**: Phase 2 **Requirements**: DASH-01, DASH-02, DASH-03, DASH-04 **Success Criteria** (what must be TRUE):

1. Dashboard displays a monthly calendar with color-coded obligation markers (green=paid, yellow=upcoming, red=overdue, blue=pending)
2. Obligations table supports filtering by status, tax type, and period, with sortable columns
3. Dashboard summary cards show obligations due this month, overdue count, and next upcoming deadline
4. User can mark an obligation as paid, which records a timestamp and updates the calendar/table/cards immediately **Plans**: 2/2 complete

Plans:

- [x] 03-01: Data layer, obligation helpers, calendar grid with month navigation and colored dots, summary cards, dashboard page assembly
- [x] 03-02: Obligations table with inline filters and sorting, mark-as-paid server action with confirmation dialog, dashboard client wrapper for shared filter state

### Phase 4: Profile Management & Sanctions

**Goal**: Users can update their business profile and see obligations recalculated, and can estimate late-filing penalties for any obligation **Depends on**: Phase 2, Phase 3 **Requirements**: PROF-01, PROF-02, SANC-01, SANC-02 **Success Criteria** (what must be TRUE):

1. User can edit their business profile (regime, size, city, NIT, CIIU, income thresholds)
2. Saving profile changes triggers obligation recalculation -- new obligations appear, inapplicable ones are removed, but PAGADO records are preserved
3. Approaching deadlines display a penalty warning showing what the user would owe if they miss the date
4. User can open a penalty calculator for any overdue obligation showing the Art. 641/642 formula breakdown, UVT floor, and a legal disclaimer **Plans**: 2/2 complete

Plans:

- [x] 04-01-PLAN.md — Profile editing page with shared field options, profile schema, VENCIDO preservation, recalculation dialog, and nav links
- [x] 04-02-PLAN.md — Sanctions calculator utility, inline penalty warnings in obligations table, and /sanciones page with Art. 641 formula breakdown

### Phase 5: Notifications & Automation

**Goal**: Users receive timely reminders before deadlines through both in-app and email channels, and obligation statuses update automatically as dates pass **Depends on**: Phase 2, Phase 3 **Requirements**: NOTF-01, NOTF-02, NOTF-03 **Success Criteria** (what must be TRUE):

1. User receives email reminders at 15, 7, 3, and 1 day thresholds before each obligation deadline
2. In-app notification center (bell icon with unread count) shows all notifications, and user can mark them as read
3. Daily cron automatically transitions obligation statuses (PENDIENTE to PROXIMO to VENCIDO) based on current date relative to deadline
4. Notifications are idempotent -- re-running the cron does not send duplicate reminders for the same threshold **Plans**: TBD

Plans:

- [ ] 05-01: TBD
- [ ] 05-02: TBD /gsd:plan-phase 5

### Phase 6: Multi-Client for Accountants

**Goal**: Accountants can manage multiple client empresas fro a single account, switching between them while maintaining strict data isolation **Depends on**: Phase 1, Phase 2, Phase 3, Phase 4, Phase 5 **Requirements**: MULT-01, MULT-02, MULT-03 **Success Criteria** (what must be TRUE):

1. An accountant-role user can create and manage multiple client empresas, each with its own business profile and generated obligations
2. Dashboard includes a client switcher that toggles the active empresa, and all data (calendar, obligations, notifications) updates to reflect the selected client
3. An accountant cannot access empresas they do not own, and each client's data is fully isolated from other clients **Plans**: TBD

Plans:

- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase                             | Plans Complete | Status      | Completed  |
| --------------------------------- | -------------- | ----------- | ---------- |
| 1. Foundation                     | 3/3            | Done        | 2026-02-27 |
| 2. Onboarding & Matching Engine   | 3/3            | Done        | 2026-02-27 |
| 3. Dashboard & Calendar           | 2/2            | Done        | 2026-03-03 |
| 4. Profile Management & Sanctions | 2/2            | Done        | 2026-03-03 |
| 5. Notifications & Automation     | 0/2            | Not started | -          |
| 6. Multi-Client for Accountants   | 0/2            | Not started | -          |
