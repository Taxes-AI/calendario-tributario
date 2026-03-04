# Phase 3: Dashboard & Calendar - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Display all tax obligations on a visual monthly calendar, browse and filter them in a table, show summary cards with key metrics, and allow users to mark obligations as paid. This phase delivers the core dashboard experience — the primary screen users interact with daily.

</domain>

<decisions>
## Implementation Decisions

### Calendar Visualization
- Traditional **month grid** layout (7-column, day cells)
- Obligations shown as **colored dots** inside day cells (one dot per obligation, color = status)
- Clicking a day with obligations opens a **popover** on the cell showing obligation list with status, tax name, and quick "mark paid" action
- Month navigation via **arrow buttons + month/year label** (< Marzo 2026 >) with a "Hoy" button to jump back to current month

### Page Layout & Summary Cards
- Single scrolling page: **summary cards on top → calendar → obligations table**
- **4 summary cards** in a row: Este mes (count), Vencidas (overdue count, red), Proxima fecha (next deadline date + tax name), Pagadas este mes (count)
- Cards are **clickable** — clicking filters the obligations table below (e.g., clicking "Vencidas" shows only overdue items)
- Mobile: cards display in a **2x2 grid**

### Obligations Table
- Columns: **Impuesto, Periodo, Fecha, Estado, Accion**
- **Inline filter row** above table with dropdowns for Estado, Impuesto, and Periodo (shadcn Select components)
- Default sort: **fecha ascending** (soonest first). Sortable columns: Fecha and Estado (clickable headers toggle asc/desc)
- "Marcar pagado" button in each row → **confirmation dialog** with date picker for payment date (shadcn Dialog)

### Status Colors & States
- **PENDIENTE** = blue (neutral/future)
- **PROXIMO** = yellow/amber (attention needed)
- **VENCIDO** = red (overdue/danger)
- **PAGADO** = green (done/safe)
- PROXIMO threshold: **7 days** before due date
- **Paid obligations remain visible** with green styling on both calendar and table (filterable if user wants to hide)

### Empty States
- Monthly empty: "No tienes obligaciones para este mes" with illustration
- No obligations at all: "Completa tu perfil para ver tus obligaciones" with link to profile
- Friendly, actionable messaging

### Claude's Discretion
- Calendar grid component implementation approach (custom vs library)
- Exact dot sizing and spacing in calendar cells
- Popover positioning and animation
- Loading skeletons for calendar and table
- Table pagination approach (if needed for many obligations)
- Exact shadcn color shades for status badges
- Mobile calendar cell sizing and touch targets

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui components**: Card, Badge, Button, Dialog, Select, Popover, Separator — all already installed
- **NavBar** (`src/components/layout/nav-bar.tsx`): existing top nav with app name and logout
- **AppShell** (`src/components/layout/app-shell.tsx`): authenticated layout wrapper
- **constants.ts**: `COLOMBIA_TZ`, `UVT_2026`, `APP_NAME` — timezone for date handling

### Established Patterns
- Server Components for data fetching (dashboard page is already async server component)
- Client components for interactivity (auth forms use "use client")
- Prisma queries via `@/lib/prisma` singleton
- Server actions in `@/lib/actions/` for mutations
- Better Auth session access via `auth.api.getSession({ headers: await headers() })`

### Integration Points
- **Dashboard route**: `src/app/(app)/dashboard/page.tsx` — currently a placeholder, will be replaced
- **ObligacionTributaria model**: has `empresaId`, `impuesto`, `periodo`, `fechaVencimiento`, `estado`, `fechaPago` — indexed on `[empresaId, estado]` and `[estado, fechaVencimiento]`
- **Empresa model**: linked to User via `userId`, has `obligaciones` relation
- **Status values**: "PENDIENTE", "PROXIMO", "VENCIDO", "PAGADO" (string field, not enum — MongoDB)

</code_context>

<specifics>
## Specific Ideas

- Maintain the Linear-inspired clean aesthetic from Phase 1 — generous whitespace, subtle borders
- Blue color palette anchors the design; status colors (yellow, red, green) are accents only
- Calendar should feel like a professional accounting tool, not a generic calendar widget
- "Hoy" button on calendar to quickly return to current month

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-dashboard-calendar*
*Context gathered: 2026-03-02*
