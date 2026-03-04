---
phase: 04-profile-sanctions
plan: 02
subsystem: ui
tags: [sanctions, art-641, penalty-calculator, obligations-table, colombian-tax]

# Dependency graph
requires:
  - phase: 03-dashboard-calendar
    provides: "Obligations table, dashboard data layer, obligation helpers"
provides:
  - "Pure Art. 641 penalty calculation utility (sanctions.ts)"
  - "Inline penalty warnings in obligations table for PROXIMO and VENCIDO rows"
  - "/sanciones page with obligation selector and step-by-step penalty calculator"
  - "Legal disclaimer component for penalty estimations"
affects: [05-notifications, 06-multi-client]

# Tech tracking
tech-stack:
  added: []
  patterns: [client-side-penalty-calculation, inline-table-warnings-with-links, step-by-step-formula-breakdown]

key-files:
  created:
    - src/lib/utils/sanctions.ts
    - src/components/sanciones/penalty-calculator.tsx
    - src/components/sanciones/sanciones-client.tsx
    - src/app/(app)/sanciones/page.tsx
  modified:
    - src/components/dashboard/obligations-table.tsx

key-decisions:
  - "Inline penalty warnings show minimum sanction (10 UVT) since impuesto a cargo is unknown at table level"
  - "Penalty calculation is client-side only -- no sensitive data stored"
  - "UVT_2026 imported from constants.ts for single source of truth"

patterns-established:
  - "Pure utility functions for domain calculations (sanctions.ts pattern)"
  - "Inline table cell with conditional Link to detail page using query params"
  - "Step-by-step formula breakdown UI pattern for complex calculations"

requirements-completed: [SANC-01, SANC-02]

# Metrics
duration: 3min
completed: 2026-03-03
---

# Phase 4 Plan 2: Sanctions Calculator Summary

**Art. 641 penalty calculator with inline table warnings linking to /sanciones step-by-step breakdown page**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-03T20:15:16Z
- **Completed:** 2026-03-03T20:18:58Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Pure penalty calculation utility implementing Art. 641 ET formula (5%/month, 100% cap, 10 UVT floor, moratory interest)
- Inline penalty warnings in obligations table: amber for PROXIMO, red for VENCIDO, with links to full calculator
- Dedicated /sanciones page with obligation selector, 9-step formula breakdown, real-time calculation, and legal disclaimer

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sanctions utility and add inline penalty warnings** - `b605d92` (feat)
2. **Task 2: Build /sanciones page with obligation selector and calculator** - `3430824` (feat)

## Files Created/Modified
- `src/lib/utils/sanctions.ts` - Pure Art. 641 penalty calculation functions and constants
- `src/components/sanciones/penalty-calculator.tsx` - Step-by-step penalty formula breakdown component
- `src/components/sanciones/sanciones-client.tsx` - Client wrapper with obligation selector, calculator, and legal disclaimer
- `src/app/(app)/sanciones/page.tsx` - Server component page with obligation data fetching
- `src/components/dashboard/obligations-table.tsx` - Added Sancion column with inline penalty warnings

## Decisions Made
- Inline penalty warnings show minimum sanction amount (10 UVT = $523,740) since impuesto a cargo is not known at table level -- full calculator lets users input that value
- Penalty calculation is purely client-side since the formula is public knowledge and avoids storing sensitive financial data
- UVT_2026 value sourced from constants.ts (single source of truth, already used across the app)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 (Profile & Sanctions) is now complete with both plans delivered
- Profile editing with recalculation (04-01) and sanctions calculator (04-02) are fully functional
- Ready to proceed to Phase 5 (Notifications) or Phase 6 (Multi-client)

## Self-Check: PASSED

All 5 files verified present. Both commit hashes (b605d92, 3430824) confirmed in git log.

---
*Phase: 04-profile-sanctions*
*Completed: 2026-03-03*
