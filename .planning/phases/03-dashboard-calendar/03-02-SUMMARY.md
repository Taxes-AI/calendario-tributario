---
phase: 03-dashboard-calendar
plan: 02
subsystem: ui
tags: [obligations-table, mark-as-paid, server-actions, shadcn, next-safe-action, prisma, revalidatePath, client-wrapper]

# Dependency graph
requires:
  - phase: 03-dashboard-calendar
    plan: 01
    provides: "CalendarGrid, SummaryCards, obligation-helpers, getDashboardData, ObligationStatusBadge"
provides:
  - "ObligationsTable with inline filters (estado, impuesto, periodo) and sortable columns (fecha, estado)"
  - "markAsPaid server action with ownership verification and revalidatePath"
  - "MarkPaidDialog confirmation dialog with native date input and toast feedback"
  - "DashboardClient wrapper managing shared filter state between summary cards, calendar, and table"
  - "Complete dashboard page assembly with server data fetching and client interactivity"
affects: [04-profile-recalculation, 05-cron-status-update]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-action-with-ownership-check, shared-client-filter-state, mark-paid-dialog-pattern]

key-files:
  created:
    - src/lib/actions/obligations.ts
    - src/components/dashboard/obligations-table.tsx
    - src/components/dashboard/mark-paid-dialog.tsx
    - src/components/dashboard/dashboard-client.tsx
  modified:
    - src/app/(app)/dashboard/page.tsx

key-decisions:
  - "Single MarkPaidDialog instance shared between table rows and calendar day popovers via DashboardClient state"
  - "DashboardClient wrapper lifts filter and mark-paid state to coordinate cards, calendar, and table"
  - "Native date input used instead of react-day-picker due to React 19 compatibility issues"
  - "markAsPaid server action validates ownership by joining through empresa.userId"

patterns-established:
  - "authedAction + ownership check: server action pattern for user-scoped Prisma mutations"
  - "DashboardClient: client wrapper pattern for coordinating multiple interactive dashboard components"
  - "activeFilter prop: pattern for external components driving table filter state"

requirements-completed: [DASH-02, DASH-04]

# Metrics
duration: 5min
completed: 2026-03-03
---

# Phase 3 Plan 2: Obligations Table & Mark-as-Paid Summary

**Filterable/sortable obligations table, markAsPaid server action with ownership verification, confirmation dialog with date picker, and DashboardClient wrapper coordinating shared filter state across cards, calendar, and table**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-03T05:04:07Z
- **Completed:** 2026-03-03T05:48:20Z
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files modified:** 5

## Accomplishments
- Built obligations table with 5 columns (Impuesto, Periodo, Fecha, Estado, Accion) and inline filter dropdowns for Estado, Impuesto, and Periodo
- Sortable column headers on Fecha (default ascending) and Estado with chevron indicators
- Created markAsPaid server action with Zod validation, ownership verification via empresa.userId, and revalidatePath for instant refresh
- Built MarkPaidDialog with native date input, loading state, and toast feedback on success/error
- Created DashboardClient wrapper that manages shared filter state (summary card clicks filter table) and shared mark-paid state (single dialog serves both table and calendar popover)
- Updated dashboard page.tsx to use DashboardClient as the main interactive wrapper while keeping data fetching in the Server Component
- Human verification confirmed complete dashboard experience works end-to-end

## Task Commits

Each task was committed atomically:

1. **Task 1: Create markAsPaid server action and obligations table with filters and sorting** - `1219b58` (feat)
2. **Task 2: Create dashboard client wrapper for shared filter state and update page assembly** - `c8b7bab` (feat)
3. **Task 3: Verify complete dashboard experience end-to-end** - checkpoint:human-verify (approved, no commit)

## Files Created/Modified
- `src/lib/actions/obligations.ts` - markAsPaid server action with authedAction pattern, Zod schema, ownership check, Prisma update, revalidatePath
- `src/components/dashboard/obligations-table.tsx` - Filterable/sortable table with 5 columns, inline filter dropdowns, sort indicators, empty state row
- `src/components/dashboard/mark-paid-dialog.tsx` - Confirmation dialog with native date picker, useAction hook for markAsPaid, toast feedback
- `src/components/dashboard/dashboard-client.tsx` - Client wrapper coordinating SummaryCards onFilterChange, CalendarGrid onMarkPaid, ObligationsTable activeFilter, and shared MarkPaidDialog
- `src/app/(app)/dashboard/page.tsx` - Updated to use DashboardClient wrapper instead of individual components

## Decisions Made
- Single MarkPaidDialog instance at DashboardClient level serves both calendar popover and table mark-paid buttons, avoiding duplicate dialog rendering
- DashboardClient lifts activeFilter and markPaidTarget state to coordinate all three interactive sections (cards, calendar, table)
- Used native `<input type="date">` instead of react-day-picker due to React 19 compatibility issues identified in research
- markAsPaid action validates ownership by joining `obligacionTributaria.empresa.userId` to prevent cross-user mutations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete dashboard experience operational: calendar with dots and day popovers, summary cards with metric counts, filterable/sortable obligations table, and mark-as-paid flow
- Phase 3 fully complete -- all 4 DASH requirements (DASH-01 through DASH-04) satisfied
- Profile editing (Phase 4) can build on markAsPaid pattern for server actions with ownership checks
- Obligation recalculation (Phase 4) will benefit from revalidatePath pattern established here

## Self-Check: PASSED

All 5 created/modified files verified on disk. Both task commits (1219b58, c8b7bab) verified in git log.

---
*Phase: 03-dashboard-calendar*
*Completed: 2026-03-03*
