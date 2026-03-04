---
phase: 04-profile-sanctions
plan: 01
subsystem: ui, api, database
tags: [react-hook-form, zod, prisma, next-safe-action, profile-editing, obligation-recalculation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Better Auth, Prisma schema, app shell, nav bar
  - phase: 02-onboarding-matching
    provides: Onboarding schemas, matching engine, field option data, NIT validator
  - phase: 03-dashboard-calendar
    provides: Dashboard page, obligation helpers, markAsPaid pattern
provides:
  - Shared field options (TIPO_EMPRESA_OPTIONS, REGIMEN_OPTIONS, TAMANO_OPTIONS, CIUDAD_OPTIONS, INCOME_BRACKETS)
  - Unified profile edit Zod schema (profileSchema, ProfileFormData)
  - Updated recalculateObligaciones preserving VENCIDO + PAGADO
  - Profile server actions (getProfileData, updateProfile) in src/lib/actions/profile.ts
  - Profile editing page at /perfil with grouped card form
  - RecalculationDialog confirmation before obligation regeneration
  - Navigation links (Dashboard, Perfil, Sanciones) in nav bar with active state
affects: [04-02-sanctions-calculator, dashboard, onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared-field-options, profile-edit-with-recalculation, confirmation-dialog-before-side-effect]

key-files:
  created:
    - src/lib/data/field-options.ts
    - src/lib/schemas/profile.ts
    - src/lib/actions/profile.ts
    - src/components/profile/profile-form.tsx
    - src/components/profile/recalculation-dialog.tsx
    - src/app/(app)/perfil/page.tsx
  modified:
    - src/lib/services/matching-engine.ts
    - src/lib/actions/onboarding.ts
    - src/components/onboarding/step-empresa.tsx
    - src/components/onboarding/step-regimen.tsx
    - src/components/onboarding/step-actividad.tsx
    - src/components/layout/nav-bar.tsx

key-decisions:
  - "All 7 empresa fields are tax-relevant and trigger recalculation on change"
  - "Profile form uses all-required schema (not optional like onboarding updateProfile)"
  - "VENCIDO obligations preserved during recalculation alongside PAGADO"
  - "Navigation links added as simple text links with active state highlighting"

patterns-established:
  - "Shared field options: Extract reusable option arrays to src/lib/data/ for cross-feature consistency"
  - "Confirmation dialog before side effects: Show preview counts, require user confirmation for destructive operations"
  - "Profile edit with recalculation: Compare original vs updated values, conditionally trigger recalculation"

requirements-completed: [PROF-01, PROF-02]

# Metrics
duration: 5min
completed: 2026-03-03
---

# Phase 4 Plan 1: Profile Editing Summary

**Profile editing page with grouped card form, obligation recalculation preserving PAGADO/VENCIDO, confirmation dialog, and nav bar links**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-03T20:06:33Z
- **Completed:** 2026-03-03T20:12:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Extracted 5 shared field option arrays from onboarding components into reusable data file
- Created profile editing page at /perfil with 3-card grouped form (Datos Empresa, Regimen Tributario, Actividad Economica)
- Updated matching engine to preserve both PAGADO and VENCIDO obligations during recalculation
- Added confirmation dialog with deletion count preview before recalculating obligations
- Added Dashboard, Perfil, and Sanciones links to nav bar with active page highlighting

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract shared field options, create profile schema, update matching engine, create profile server action** - `5ee8136` (feat)
2. **Task 2: Build profile page with form, confirmation dialog, and navigation links** - `91b8756` (feat)

## Files Created/Modified
- `src/lib/data/field-options.ts` - Shared field option arrays (5 exports) for onboarding and profile forms
- `src/lib/schemas/profile.ts` - Unified flat Zod schema with all 7 empresa fields required
- `src/lib/services/matching-engine.ts` - Updated recalculateObligaciones to preserve VENCIDO alongside PAGADO
- `src/lib/actions/profile.ts` - getProfileData and updateProfile server actions with recalculation
- `src/lib/actions/onboarding.ts` - Removed old updateProfile action (replaced by profile.ts)
- `src/components/onboarding/step-empresa.tsx` - Imports TIPO_EMPRESA_OPTIONS from shared file
- `src/components/onboarding/step-regimen.tsx` - Imports REGIMEN_OPTIONS, TAMANO_OPTIONS from shared file
- `src/components/onboarding/step-actividad.tsx` - Imports CIUDAD_OPTIONS, INCOME_BRACKETS from shared file
- `src/components/profile/profile-form.tsx` - Profile edit form with 3 card sections, CIIU combobox, NIT warning
- `src/components/profile/recalculation-dialog.tsx` - Confirmation dialog before obligation recalculation
- `src/app/(app)/perfil/page.tsx` - Server component fetching empresa data and obligation stats
- `src/components/layout/nav-bar.tsx` - Added navigation links with active state

## Decisions Made
- All 7 empresa fields treated as tax-relevant (including tipoEmpresa) since all affect matching engine results
- Profile schema uses all-required fields (vs optional in old onboarding updateProfile) since form always submits complete data
- NIT DV always recomputed on save (not just when NIT changes) for consistency
- Deletion count for confirmation dialog uses client-side stats (pendientes + proximas) for instant preview

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Profile page fully functional with all 7 editable fields
- VENCIDO preservation implemented in matching engine
- Navigation links ready for /sanciones page (Plan 04-02)
- All existing tests pass (34/34)

---
*Phase: 04-profile-sanctions*
*Completed: 2026-03-03*
