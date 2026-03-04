# Feature Research

**Domain:** Colombian tax obligation calendar (calendario tributario) -- SaaS for SMEs and accountants
**Researched:** 2026-02-26
**Confidence:** MEDIUM-HIGH (features validated against 8+ Colombian competitors and DIAN official tools; complexity estimates based on architecture research)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or untrustworthy. Every Colombian tax calendar tool -- from Dataico's free web tool to Alegra's integrated module to Tribualdia's mobile app -- has these.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **NIT-based deadline calculation** | Every tool (Dataico, DIAN, calendariotributario.org) lets you enter a NIT and see your personalized dates. Users won't manually cross-reference PDF tables. | MEDIUM | Must handle last 1 digit (monthly taxes: IVA, Retencion) AND last 2 digits (annual: Renta). Lookup table per tax per period, not hardcoded dates. See PITFALLS.md #1. |
| **Business profile onboarding** | Obligation matching requires knowing: persona natural/juridica, regimen (Ordinario/SIMPLE/Especial), tamaño (Gran Contribuyente or not), CIIU activity code, city, and income/asset thresholds. Without this, the calendar is generic (what DIAN PDF already provides). | MEDIUM | 4-step wizard: empresa data, regime/size, activity/city, income thresholds. Per-step server persistence so progress survives refresh. |
| **Obligation matching engine** | The core value proposition. Dataico shows ALL taxes; Alegra matches per-client. Users who just want a generic PDF calendar will use DIAN's free tool. Our product must answer "which taxes apply to ME specifically?" | HIGH | Rules engine evaluating ~12 national taxes x ~30 conditions against empresa profile. Pure function, deterministic, testable. Biggest development investment in v1. |
| **Monthly calendar view** | Every competitor has this. Tribualdia, Calendapp, Kontalid, Alegra -- all show a monthly grid with obligations on their due dates. | MEDIUM | shadcn Calendar + react-day-picker. Color-coded dots/badges per obligation status (pending, upcoming, overdue, paid). Click day to see detail. |
| **Obligation list/table view** | Calendar shows when; table shows what. Users need to filter, sort, search obligations. Alegra and Tribualdia both provide table + calendar views. | MEDIUM | Filterable by: status (pendiente/proximo/vencido/pagado), tax type, period. Sortable by due date. Paginated. |
| **Mark obligation as paid** | Users need to track what they have already filed/paid. Without this, the calendar is view-only and users resort to spreadsheets or sticky notes. Tribualdia has pending/in-progress/submitted statuses. | LOW | Simple status toggle: PENDIENTE -> PAGADO with timestamp. Optional: fechaPago input. |
| **Email reminders before deadlines** | Tribualdia sends email + WhatsApp. Kontalid sends email + push. Alegra sends email alerts. This is the #1 reason users adopt a tool over a static PDF -- they want to be reminded without checking manually. | HIGH | Cron job (Vercel Cron daily) querying obligations at 15/7/3/1 day thresholds. Resend for email delivery. Must be idempotent (track last notification sent per obligation). |
| **User authentication** | Any tool that stores personalized data requires login. Alegra, Siigo, Cuenti, Tribualdia -- all gated. | MEDIUM | Email/password credentials. Better Auth or NextAuth v5 with JWT sessions. |
| **Responsive web design** | Accountants use desktop; business owners check deadlines on mobile. Tribualdia and Calendapp are mobile-first apps. Alegra is responsive web. | LOW | Tailwind responsive utilities + shadcn/ui (already responsive). No native app needed -- responsive web covers both audiences. |
| **Spanish-language UI** | The audience is Colombian. Tribualdia, Calendapp, Kontalid, Alegra, Cuenti -- all 100% Spanish. English labels = distrust. | LOW | All UI text in Spanish from day one. Tax terminology must use Colombian terms: "Retencion en la fuente" not "Withholding tax", "IVA" not "VAT", "Renta" not "Income Tax". |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but create real value over the competition. These are where this product can win against generic PDF calendars and against full accounting suites where the calendar is a small add-on.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Penalty estimation calculator** | No free Colombian tool shows "if you miss this deadline, you'll owe ~$X in sanctions." Dataico mentions the minimum penalty ($524,000 COP) but doesn't calculate per-obligation. Accountants currently calculate this manually using Art. 641/642 ET formulas. This turns a passive calendar into an active motivator. | MEDIUM | Stateless function: base amount + days late + UVT + moratory interest rate = estimated sanction. MUST include legal disclaimer ("estimacion orientativa"). UVT must be DB-configurable. See PITFALLS.md #3 and #7. |
| **Multi-client management for accountants** | Tribualdia and Calendapp support this, but Alegra locks it behind their full accounting suite ($$$). Standalone multi-client obligation tracking is underserved. Colombian accountants manage 10-50+ clients. Toggling between client calendars in a single dashboard is high value. | HIGH | Empresa model per client, linked to accountant user. Dashboard with client selector/switcher. Requires role system (owner vs accountant vs assistant). Most complex v1 feature -- consider deferring to v1.1. |
| **Obligation status auto-progression** | The DIAN PDF is static. Most apps require manual tracking. Auto-transitioning obligations (PENDIENTE -> PROXIMO when <=15 days -> VENCIDO when past due) creates a living dashboard that reflects reality without user action. | MEDIUM | Daily cron job comparing fechaVencimiento to today. Three status transitions. Must never touch PAGADO obligations. |
| **Profile change triggers recalculation** | When a business changes regime (Ordinario to SIMPLE) or grows to Gran Contribuyente status, their obligations change fundamentally. Most tools require manual re-setup. Automatic recalculation on profile edit is a significant UX advantage. | MEDIUM | Detect tax-relevant field changes in profile update action. Re-run matching engine for PENDIENTE/PROXIMO only (preserve PAGADO). See PITFALLS.md #6. |
| **In-app notification center** | Email reminders can be missed (spam filters, overloaded inboxes). An in-app bell with unread count + notification history provides a reliable secondary channel. Tribualdia uses email + WhatsApp; this product uses email + in-app. | LOW | Notification model in DB + NotificationBell client component. Created by cron alongside emails. Simple unread badge + list. |
| **Google Calendar export** | Dataico already offers one-click Google Calendar export. Users who live in Google Calendar want deadlines synced there, not in a separate app. This bridges the gap between "I'll check the app" and "it's already in my calendar." | LOW | Generate .ics file or Google Calendar URL with obligation dates. One-time export or subscribe link. Low effort, high perceived value. |
| **Municipal tax support (ICA -- top 4 cities)** | No free tool covers municipal ICA deadlines accurately. Alegra and Siigo include some municipal taxes but buried in their full suite. Scoping to Bogota, Medellin, Cali, Barranquilla covers ~60% of Colombian business activity. | HIGH | Each city has different: periodicity (bimestral vs annual), CIIU-based tariff rates, ReteICA rules. Requires per-city seed data and condition rules. See PITFALLS.md #2. Recommend v1.1 scope. |
| **Dashboard summary cards** | "3 obligations due this month", "1 overdue", "next deadline: March 8". Quick glance without reading the calendar. Alegra has summary views; most free tools do not. | LOW | Aggregation queries over obligation data. 3-4 cards: due this month, overdue, next deadline, total paid this year. Server Component, no interactivity needed. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create complexity, liability, or maintenance burden disproportionate to their value. Deliberately NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Tax filing/submission integration** | "If you know my deadlines, why not file for me?" | DIAN electronic filing (Muisca) requires digital signatures, form-specific data, and changes yearly. Integration is a separate product (what Siigo/Alegra are). Liability for incorrect filings is enormous. This doubles the scope with entirely different compliance requirements. | Link to DIAN Muisca portal from each obligation detail page. "Presentar declaracion" opens DIAN in new tab. |
| **Real-time Superfinanciera moratory interest rate** | Sanctions calculator should use the real official rate, not an approximation. | The rate changes monthly, requires scraping or manual updates, and using "official" rate implies legal accuracy. Creates false precision and liability. | Use a fixed approximate rate (~20% EA) clearly labeled as estimate. Show a note: "Tasa de interes moratorio vigente: consulte la Superfinanciera." |
| **WhatsApp notifications** | Tribualdia offers WhatsApp alerts. High open rates (98%). | WhatsApp Business API requires Facebook Business verification, ongoing monthly costs (~$0.05/message), and template approval per message type. Massive infrastructure overhead for v1. Also subject to Meta's policy changes. | Email + in-app notifications for v1. WhatsApp integration as a v2 feature once user base justifies the cost. |
| **Full ICA coverage (all 1,100 municipalities)** | "I have clients in 15 different cities." | Each municipality has its own tariff schedule, periodicity, filing platform, and ReteICA rules. No single source of truth exists. Data quality would be unreliable for small municipalities. | Support top 4 cities (Bogota, Medellin, Cali, Barranquilla) in v1.1. Show clear "ICA para tu ciudad no esta disponible aun" for other cities. |
| **AI-powered tax advice/chatbot** | Trendy. "Ask the AI what taxes you owe." | Tax advice requires licensed professionals in Colombia (Contador Publico). AI hallucinations about tax obligations create legal liability. Trust erosion if wrong. | The matching engine IS the intelligence -- deterministic rules, not probabilistic AI. Add contextual help text explaining each obligation. |
| **Mobile native app (iOS/Android)** | Calendapp and Tribualdia are mobile apps. | Two codebases (or React Native/Flutter complexity), app store review cycles, push notification infrastructure. For a v1 with a small team, this splits focus. | Responsive web app that works well on mobile browsers. Add to Home Screen (PWA) as a lightweight alternative. |
| **Payment processing / subscription billing** | "Charge users a monthly fee." | Adds PCI compliance concerns, payment gateway integration (PayU/ePayco for Colombia), subscription management, dunning, invoicing. This is infrastructure, not product. | Free tier for v1 to validate product-market fit. If monetizing later, use Stripe or LemonSqueezy -- don't build billing. |
| **Multi-country support** | "Expand to Mexico, Peru, Ecuador." | Each country has entirely different tax authorities, obligation types, ID systems, deadline rules. The matching engine, seed data, and notification content are all Colombia-specific. | Colombia only for v1 (and likely v2). If expanding, fork the matching engine per country rather than generalizing prematurely. |
| **Offline mode** | Accountants working in areas with spotty internet. | Service Workers + offline DB sync adds major complexity. Obligation data changes daily (status transitions). Offline creates stale data and sync conflicts. | The app is lightweight enough to load quickly on slow connections. No heavy assets to cache. |

---

## Feature Dependencies

```
[Auth + User Model]
    |
    v
[Business Profile Onboarding]
    |
    +--requires--> [Tax Seed Data (12 impuestos + conditions)]
    |
    v
[Obligation Matching Engine]
    |
    +--produces--> [ObligacionTributaria records in DB]
    |
    v
[Calendar View] + [Obligations Table] + [Dashboard Summary Cards]
    |
    +--enhances--> [Mark as Paid]
    |
    v
[Obligation Status Auto-Progression (Cron)]
    |
    +--requires--> [Obligation records exist]
    +--enables---> [Email Reminders (Cron)]
    +--enables---> [In-App Notifications]
    |
    v
[Penalty Estimation Calculator]
    |
    +--requires--> [UVT config in DB]
    +--requires--> [Obligation records with due dates]

[Profile Edit + Recalculation]
    |
    +--requires--> [Matching Engine]
    +--requires--> [Obligations Table (to see changes)]

[Multi-Client Management]
    |
    +--requires--> [Auth (role system)]
    +--requires--> [Business Profile (per client)]
    +--requires--> [Matching Engine (per client)]
    +--enhances--> [All dashboard features (client switcher)]

[Google Calendar Export]
    |
    +--requires--> [Obligation records with dates]
    +--independent of other features
```

### Dependency Notes

- **Matching Engine requires Tax Seed Data:** The engine evaluates conditions from the `Impuesto` and `ImpuestoCondicion` tables. Without seed data, matching produces zero results. Seed data must be created before the engine is testable.
- **Calendar/Table require Matching Engine:** The dashboard is empty without `ObligacionTributaria` records. Matching engine must run (via onboarding completion) before dashboard has content to display.
- **Email Reminders require Cron + Obligations:** The cron job queries obligations near their due date. Both the obligation data and the cron infrastructure must exist first.
- **Penalty Calculator requires UVT config:** Sanctions are calculated in UVT units. The `ConfiguracionSistema` table with UVT value must exist before any sanction formula is coded.
- **Multi-Client Management requires Role System:** An accountant managing clients needs a different auth model (accountant creates empresa records for each client, switches between them). This adds a role/permission layer that touches auth, onboarding, and all dashboard queries. It is the most cross-cutting feature.
- **Google Calendar Export is independent:** Only needs obligation records with dates. Can be added at any point after the matching engine produces obligations.

---

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate "do Colombian SME owners and accountants actually want a standalone obligation calendar?"

- [ ] **Auth + account management** -- users must log in to see personalized data
- [ ] **Business profile onboarding (4-step wizard)** -- captures all data needed for obligation matching
- [ ] **Tax seed data (12 national DIAN taxes + conditions)** -- the knowledge base the matching engine evaluates
- [ ] **Obligation matching engine** -- the core: profile in, personalized obligations out
- [ ] **NIT-based deadline calculation** -- each obligation gets its specific due date based on NIT digit
- [ ] **Monthly calendar view** -- color-coded by obligation status
- [ ] **Obligations table with filters** -- sortable, filterable list view
- [ ] **Mark as paid** -- users track their filing progress
- [ ] **Dashboard summary cards** -- at-a-glance status (due this month, overdue, next deadline)
- [ ] **Obligation status auto-progression (daily cron)** -- PENDIENTE -> PROXIMO -> VENCIDO
- [ ] **Email reminders (15/7/3/1 day thresholds)** -- the #1 reason to use this over a PDF
- [ ] **In-app notification center** -- bell + unread count + notification list
- [ ] **Profile edit with recalculation** -- change regime/size/city and obligations update
- [ ] **Spanish-language UI throughout** -- non-negotiable for Colombian audience
- [ ] **Responsive design** -- works on desktop and mobile browsers

### Add After Validation (v1.x)

Features to add once core is working and real users confirm value.

- [ ] **Penalty estimation calculator** -- add when users report wanting to understand consequences of missed deadlines; low lift once UVT config exists
- [ ] **Google Calendar export** -- add when users request sync with external calendars; low effort, high satisfaction
- [ ] **Multi-client management for accountants** -- add when accountants sign up and report managing >1 business; requires role system
- [ ] **Municipal ICA support (Bogota, Medellin, Cali, Barranquilla)** -- add when users in those cities request municipal tax tracking; significant seed data work
- [ ] **Obligation history/archive** -- add when users want to review past years' obligations and payment history

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **WhatsApp notifications** -- defer until user base justifies WhatsApp Business API costs (~$0.05/message)
- [ ] **Advanced sanctions calculator with moratory interest tracking** -- defer until users request detailed penalty breakdowns
- [ ] **Accountant-to-client portal** -- defer until multi-client is validated; clients could log in to see their own obligations managed by their accountant
- [ ] **DIAN filing links per obligation** -- defer: contextual deep links to the correct DIAN Muisca form for each obligation type
- [ ] **PDF/Excel report export** -- defer until accountants need formal reports for clients
- [ ] **PWA (Add to Home Screen)** -- defer until mobile usage patterns are confirmed via analytics

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Obligation matching engine | HIGH | HIGH | P1 |
| NIT-based deadline calculation | HIGH | MEDIUM | P1 |
| Business profile onboarding | HIGH | MEDIUM | P1 |
| Monthly calendar view | HIGH | MEDIUM | P1 |
| Email reminders (15/7/3/1 day) | HIGH | HIGH | P1 |
| Auth + account management | HIGH | MEDIUM | P1 |
| Obligations table + filters | HIGH | MEDIUM | P1 |
| Mark as paid | MEDIUM | LOW | P1 |
| Dashboard summary cards | MEDIUM | LOW | P1 |
| Obligation status auto-progression | MEDIUM | MEDIUM | P1 |
| In-app notification center | MEDIUM | LOW | P1 |
| Spanish-language UI | HIGH | LOW | P1 |
| Profile edit + recalculation | MEDIUM | MEDIUM | P1 |
| Penalty estimation calculator | HIGH | MEDIUM | P2 |
| Google Calendar export | MEDIUM | LOW | P2 |
| Multi-client (accountants) | HIGH | HIGH | P2 |
| Municipal ICA (4 cities) | MEDIUM | HIGH | P2 |
| Obligation history/archive | LOW | LOW | P3 |
| WhatsApp notifications | MEDIUM | HIGH | P3 |
| PDF/Excel export | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (v1 MVP)
- P2: Should have, add post-validation (v1.x)
- P3: Nice to have, future consideration (v2+)

---

## Competitor Feature Analysis

| Feature | DIAN Official (PDF/Web) | Dataico (Free Tool) | Tribualdia (App) | Alegra (Accounting Suite) | Calendapp/Ofiscol (App) | **Our Approach** |
|---------|------------------------|--------------------|--------------------|--------------------------|------------------------|-----------------|
| NIT-based dates | PDF tables by digit | Enter NIT, see dates | Per-client NIT dates | Per-client NIT dates | Per-taxpayer dates | Enter NIT once in onboarding; dates auto-calculated |
| Obligation matching | None (shows all taxes) | None (shows all taxes) | Manual selection | Tied to accounting data | Manual selection | **Automatic matching from business profile** -- key differentiator over free tools |
| Calendar view | Static PDF | Web table (no calendar grid) | Mobile calendar | Web calendar (month/week/year) | Mobile calendar | Web calendar, color-coded, click-to-detail |
| Notifications | None | None | Email + WhatsApp (weekly/daily) | Email alerts (1-30 days before) | Push notifications | Email (15/7/3/1 day) + in-app bell |
| Penalty info | None | Shows minimum penalty ($524K COP) | None | None | None | **Penalty estimation calculator with disclaimer** -- no competitor does this |
| Multi-client | N/A | N/A | Unlimited clients (all plans) | Per-client in accounting suite | Unlimited clients | v1.x: accountant role with client switcher |
| Status tracking | None | None | Pending/in-progress/submitted | Pending/completed view | Status + overdue filter | Pending/upcoming/overdue/paid with auto-progression |
| Municipal taxes (ICA) | Not DIAN scope | No | ICA, RETEICA, PILA, payroll | Full municipal via accounting | Tax + labor indicators | v1.1: top 4 cities |
| Google Calendar sync | No | Yes (export) | No | No | No | v1.x: .ics export |
| Price | Free | Free | Free-$30K COP/month | $40K-$200K+ COP/month | Free-$21K COP/month | Free (v1) |
| Platform | Web (PDF) | Web | Mobile (iOS/Android/Huawei) + Web (Premium) | Web + Mobile | Mobile (iOS/Android/Huawei) | Web (responsive) |

### Competitive Positioning

**Against DIAN PDF / Dataico:** These are generic -- they show ALL taxes for ALL taxpayers. Our matching engine is the differentiator. Users get a personalized calendar, not a lookup table.

**Against Tribualdia / Calendapp:** These are mobile-first calendar apps with manual obligation selection. Our automatic matching engine and penalty calculator are differentiators. They have WhatsApp (we don't in v1) and mobile apps (we're web-only). We compete on intelligence, not on channel reach.

**Against Alegra / Siigo / Cuenti:** These are full accounting suites where the tax calendar is one module among many. We are purpose-built for obligation tracking. Advantage: simpler, focused, free. Disadvantage: no accounting integration. The play is to serve users who don't need (or can't afford) a full suite but want better obligation tracking than a PDF.

---

## Sources

- [DIAN Calendario Tributario 2026 (official)](https://www.dian.gov.co/Paginas/CalendarioTributario.aspx) -- baseline feature set of the official tool
- [DIAN Calendario de Obligaciones](https://www.dian.gov.co/Contribuyentes-Plus/Paginas/Calendario-de-obligaciones.aspx) -- PDF-centric, no filtering
- [Dataico Calendario Tributario (free tool)](https://herramientas.dataico.com/calendario-tributario/) -- NIT lookup, Google Calendar export, 20+ tax types
- [Tribualdia](https://tribualdia.com/) -- mobile calendar app, email + WhatsApp notifications, multi-client, municipal taxes
- [Kontalid](https://www.kontalid.com/app-kontalid/) -- accountant-focused calendar + productivity network
- [Calendapp by Ofiscol](https://ofiscol.com/calendapp/) -- mobile calendar + task management, labor + tax indicators
- [Alegra Calendario Tributario (help docs)](https://ayuda.alegra.com/col/calendario-tributario-alegra-contador) -- per-client calendar, 1-30 day reminder config, month/week/year views
- [Siigo Calendario Tributario](https://www.siigo.com/blog/obligaciones-fiscales/calendario-tributario-colombia-2026/) -- integrated in full accounting suite
- [Cuenti Calendario Tributario](https://cuenti.com/software-contable/calendario-tributario-2026-en-colombia/) -- integrated in accounting software
- [Dattos Tax Obligation Calendar Control](https://www.dattos.com.br/en/solutions/tax-obligations-calendar-control/) -- enterprise Brazilian tax calendar automation
- [calendariotributario.org](https://calendariotributario.org/) -- informational site with downloadable calendars
- [DIAN UVT 2026 ($52,374)](https://www.buk.co/blog/sancion-minima-2026-en-colombia) -- sanction minimum and UVT value
- [consultorcontable.com penalty calculator](https://www.consultorcontable.com/liquidador-de-la-sancion-por-extemporaneidad/) -- manual sanctions liquidator tool
- [FreshBooks accountant-client pain points](https://www.freshbooks.com/blog/accountant-client-pain-points) -- general multi-client management challenges
- [SMS/notification best practices for tax professionals](https://textellent.com/blog/benefits-of-sms-during-tax-season/) -- reminder timing and channel effectiveness

---
*Feature research for: Colombian Tax Calendar SaaS (Calendario Tributario)*
*Researched: 2026-02-26*
