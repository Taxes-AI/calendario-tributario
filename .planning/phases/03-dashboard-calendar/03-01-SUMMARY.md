---
phase: 03-dashboard-calendar
plan: 01
subsystem: ui
tags: [calendar, dashboard, date-fns, shadcn, tailwind, server-components, colombia-timezone]

# Dependency graph
requires:
  - phase: 02-onboarding-matching
    provides: "ObligacionTributaria records, Empresa model, onboarding flow"
provides:
  - "ObligationStatus types and STATUS_CONFIG color map"
  - "computeDisplayStatus function for real-time status calculation"
  - "getDashboardData server query for obligation fetching"
  - "CalendarGrid component with month navigation and obligation dots"
  - "CalendarDayCell with popover showing obligation details and quick mark-paid button"
  - "SummaryCards with 4 key metrics (Este mes, Vencidas, Proxima fecha, Pagadas)"
  - "EmptyState component for zero-obligation scenarios"
  - "ObligationStatusBadge reusable colored badge"
  - "Toaster in (app) layout for toast feedback"
affects: [03-02-obligations-table, 04-mark-paid-actions, 05-cron-status-update]

# Tech tracking
tech-stack:
  added: [shadcn-table, shadcn-skeleton, shadcn-tooltip]
  patterns: [server-component-data-fetching, serialized-obligation-interface, client-side-status-computation, monday-start-calendar]

key-files:
  created:
    - src/lib/utils/obligation-helpers.ts
    - src/lib/queries/dashboard.ts
    - src/components/dashboard/obligation-status-badge.tsx
    - src/components/dashboard/calendar-day-cell.tsx
    - src/components/dashboard/calendar-grid.tsx
    - src/components/dashboard/summary-cards.tsx
    - src/components/dashboard/empty-state.tsx
  modified:
    - src/app/(app)/layout.tsx
    - src/app/(app)/dashboard/page.tsx

key-decisions:
  - "Client-side computeDisplayStatus ensures correct status colors even without Phase 5 cron"
  - "Obligations serialized to ISO strings at server boundary for safe client consumption"
  - "Calendar uses Monday-start weeks (Colombian/ISO standard) via weekStartsOn: 1"
  - "todayIso passed from server to avoid client timezone discrepancies"

patterns-established:
  - "SerializedObligation: interface for passing obligation data across server/client boundary"
  - "getDashboardData: server query pattern for fetching and serializing Prisma data"
  - "computeDisplayStatus: client-side real-time status computation from DB status + deadline"
  - "STATUS_CONFIG: centralized color/class configuration per obligation status"
  - "onMarkPaid callback: threaded from page through CalendarGrid to CalendarDayCell"

requirements-completed: [DASH-01, DASH-03]

# Metrics
duration: 4min
completed: 2026-03-03
---

# Phase 3 Plan 1: Dashboard Calendar & Summary Cards Summary

**Monthly calendar grid with colored obligation dots, day popovers with quick mark-paid, 4 summary metric cards, and Colombia timezone-aware data layer**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-03T05:00:16Z
- **Completed:** 2026-03-03T05:04:07Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Built obligation-helpers.ts with status types, STATUS_CONFIG color map, computeDisplayStatus, and getObligationsForDay utilities
- Created dashboard data layer (getDashboardData) that fetches and serializes obligations from Prisma
- Built interactive monthly calendar grid with Monday-start weeks, Spanish month labels, and month navigation (arrows + Hoy button)
- Calendar day cells show colored dots per obligation status (blue=PENDIENTE, amber=PROXIMO, red=VENCIDO, green=PAGADO)
- Day popovers display obligation details with status badges and quick "Marcar pagado" button for non-paid obligations
- Summary cards show 4 key metrics: Este mes count, Vencidas (overdue), Proxima fecha (next deadline), Pagadas este mes
- Empty states handle zero-obligation scenarios with friendly messaging
- Added Toaster to (app) layout and installed shadcn table, skeleton, tooltip components for Phase 3

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn components, create obligation helpers, dashboard queries, and add Toaster** - `82b51d7` (feat)
2. **Task 2: Build calendar grid with month navigation, colored dots, and day popovers** - `53d70e4` (feat)
3. **Task 3: Build summary cards, empty states, and assemble dashboard page** - `3d1b191` (feat)

## Files Created/Modified
- `src/lib/utils/obligation-helpers.ts` - ObligationStatus types, STATUS_CONFIG, computeDisplayStatus, getObligationsForDay, STATUS_ORDER
- `src/lib/queries/dashboard.ts` - getDashboardData server query for obligation fetching and serialization
- `src/components/dashboard/obligation-status-badge.tsx` - Reusable colored badge for obligation status
- `src/components/dashboard/calendar-day-cell.tsx` - Day cell with dots, popover, and quick mark-paid button
- `src/components/dashboard/calendar-grid.tsx` - Monthly calendar grid with Monday-start weeks and navigation
- `src/components/dashboard/summary-cards.tsx` - 4 summary metric cards with clickable filter support
- `src/components/dashboard/empty-state.tsx` - Empty state messages for month and no-obligations scenarios
- `src/app/(app)/layout.tsx` - Added Toaster component for toast feedback
- `src/app/(app)/dashboard/page.tsx` - Replaced placeholder with full dashboard Server Component
- `src/components/ui/table.tsx` - shadcn Table component (installed)
- `src/components/ui/skeleton.tsx` - shadcn Skeleton component (installed)
- `src/components/ui/tooltip.tsx` - shadcn Tooltip component (installed)

## Decisions Made
- Used client-side computeDisplayStatus instead of relying solely on DB status, ensuring accurate colors even before Phase 5 cron updates status fields
- Serialized all DateTime fields to ISO strings at the server boundary to avoid hydration mismatches
- Calendar uses Monday-start weeks (weekStartsOn: 1) per Colombian/ISO standard
- Server passes todayIso from nowColombia() to avoid client timezone discrepancies in "today" highlighting
- onMarkPaid callback threaded as prop through component tree (CalendarGrid -> CalendarDayCell) to be wired by Plan 03-02

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in matching-engine.test.ts (PrismaPromise type mismatch in mock) -- out of scope, does not affect new code

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Dashboard page fully functional with calendar and summary cards
- CalendarGrid accepts onMarkPaid callback ready for Plan 03-02 to wire mark-paid server action
- SummaryCards accepts onFilterChange callback ready for Plan 03-02 to wire table filtering
- Table, Skeleton, Tooltip shadcn components installed for Plan 03-02 obligations table
- Toaster available in (app) layout for toast feedback from mark-paid actions

## Self-Check: PASSED

All 12 created/modified files verified on disk. All 3 task commits (82b51d7, 53d70e4, 3d1b191) verified in git log.

---
*Phase: 03-dashboard-calendar*
*Completed: 2026-03-03*
