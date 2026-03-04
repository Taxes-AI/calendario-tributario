# Requirements: Calendario Tributario

**Defined:** 2026-02-26
**Core Value:** Users know exactly which tax obligations apply to them and when each one is due — no missed deadlines, no surprise penalties.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across sessions
- [ ] **AUTH-03**: User can log out from any page

### Onboarding

- [ ] **ONBD-01**: User completes 4-step wizard capturing empresa type, regime, size, NIT, CIIU, city, income thresholds
- [ ] **ONBD-02**: Wizard progress persists per-step (survives page refresh)
- [ ] **ONBD-03**: Completing onboarding triggers obligation matching

### Matching Engine

- [ ] **MTCH-01**: Rules engine evaluates ~12 national DIAN taxes against empresa profile to determine applicable obligations
- [ ] **MTCH-02**: NIT-based deadline calculation (last 1 digit for monthly taxes, last 2 for annual Renta)
- [ ] **MTCH-03**: Tax seed data for 2026 (12 taxes, conditions, NIT date tables, Colombian holidays)

### Dashboard & Calendar

- [x] **DASH-01**: Monthly calendar view with color-coded obligations by status
- [x] **DASH-02**: Obligations table with filters (status, tax type, period) and sorting
- [x] **DASH-03**: Dashboard summary cards (due this month, overdue, next deadline)
- [x] **DASH-04**: User can mark obligation as paid with timestamp

### Notifications

- [x] **NOTF-01**: Email reminders sent at 15/7/3/1 day thresholds before deadlines
- [x] **NOTF-02**: In-app notification center with bell icon and unread count
- [x] **NOTF-03**: Obligation status auto-progression via daily cron (PENDIENTE -> PROXIMO -> VENCIDO)

### Sanctions / Penalties

- [x] **SANC-01**: Penalty warning displayed before approaching deadlines (what could happen)
- [x] **SANC-02**: Penalty calculator for missed deadlines using Art. 641/642 formulas with legal disclaimer

### Profile Management

- [x] **PROF-01**: User can edit business profile (regime, size, city, NIT)
- [x] **PROF-02**: Profile changes trigger obligation recalculation (preserving PAGADO records)

### ~~Multi-Client (Accountants)~~ — Deferred to v2

- [ ] ~~**MULT-01**: Accountant role can create and manage multiple client empresas~~
- [ ] ~~**MULT-02**: Client switcher in dashboard to toggle between empresas~~
- [ ] ~~**MULT-03**: Cross-client data isolation (accountant only sees their own clients)~~

### General

- [ ] **GENL-01**: Spanish-language UI throughout with Colombian tax terminology
- [ ] **GENL-02**: Responsive design (desktop + mobile browsers)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Multi-Client (Accountants)

- **MULT-01**: Accountant role can create and manage multiple client empresas
- **MULT-02**: Client switcher in dashboard to toggle between empresas
- **MULT-03**: Cross-client data isolation (accountant only sees their own clients)

### Authentication

- **AUTH-04**: User can reset password via email link
- **AUTH-05**: User can sign up/log in with Google OAuth

### Integrations

- **INTG-01**: User can export obligations to Google Calendar (.ics file)
- **INTG-02**: User receives WhatsApp notification reminders

### Municipal Taxes

- **MUNI-01**: ICA obligation tracking for Bogota, Medellin, Cali, Barranquilla
- **MUNI-02**: Per-city CIIU-based tariff rate display

### Reporting

- **REPT-01**: User can export obligation history as PDF/Excel
- **REPT-02**: User can view past years' obligation archive

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Tax filing/submission (DIAN Muisca) | Entirely different product scope, enormous liability for incorrect filings |
| Multi-country support | Each country has different tax authority, ID system, deadline rules |
| Mobile native app (iOS/Android) | Responsive web sufficient for v1; splits development focus |
| AI-powered tax advice/chatbot | Legal liability — requires licensed Contador Publico in Colombia |
| Payment processing / subscriptions | Validate product-market fit first; don't build billing infrastructure |
| Real-time Superfinanciera interest rate | Creates false precision and liability; use fixed approximate rate with disclaimer |
| Full ICA coverage (1,100 municipalities) | No single data source; scope to top 4 cities in v2 |
| Offline mode | Obligation data changes daily; sync conflicts outweigh benefit |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1: Foundation | Pending |
| AUTH-02 | Phase 1: Foundation | Pending |
| AUTH-03 | Phase 1: Foundation | Pending |
| MTCH-03 | Phase 1: Foundation | Pending |
| GENL-01 | Phase 1: Foundation | Pending |
| GENL-02 | Phase 1: Foundation | Pending |
| ONBD-01 | Phase 2: Onboarding & Matching Engine | Pending |
| ONBD-02 | Phase 2: Onboarding & Matching Engine | Pending |
| ONBD-03 | Phase 2: Onboarding & Matching Engine | Pending |
| MTCH-01 | Phase 2: Onboarding & Matching Engine | Pending |
| MTCH-02 | Phase 2: Onboarding & Matching Engine | Pending |
| DASH-01 | Phase 3: Dashboard & Calendar | Complete |
| DASH-02 | Phase 3: Dashboard & Calendar | Complete |
| DASH-03 | Phase 3: Dashboard & Calendar | Complete |
| DASH-04 | Phase 3: Dashboard & Calendar | Complete |
| PROF-01 | Phase 4: Profile Management & Sanctions | Complete |
| PROF-02 | Phase 4: Profile Management & Sanctions | Complete |
| SANC-01 | Phase 4: Profile Management & Sanctions | Complete |
| SANC-02 | Phase 4: Profile Management & Sanctions | Complete |
| NOTF-01 | Phase 5: Notifications & Automation | Complete |
| NOTF-02 | Phase 5: Notifications & Automation | Complete |
| NOTF-03 | Phase 5: Notifications & Automation | Complete |
| MULT-01 | Deferred to v2 | Deferred |
| MULT-02 | Deferred to v2 | Deferred |
| MULT-03 | Deferred to v2 | Deferred |

**Coverage:**
- v1 requirements: 22 total (3 deferred to v2)
- Mapped to phases: 22
- Deferred: 3 (MULT-01, MULT-02, MULT-03)
- Unmapped: 0

---
*Requirements defined: 2026-02-26*
*Last updated: 2026-02-26 after roadmap creation*
