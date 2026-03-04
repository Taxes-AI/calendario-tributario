---
phase: 05-notifications-automation
plan: 01
subsystem: api
tags: [cron, resend, email, notifications, prisma, vercel-cron]

# Dependency graph
requires:
  - phase: 02-onboarding-matching
    provides: ObligacionTributaria model with empresa relation and estado field
  - phase: 01-foundation
    provides: Better Auth with Resend email verification, Prisma schema, middleware
provides:
  - Notificacion Prisma model with compound unique constraint for idempotency
  - Daily cron endpoint at /api/cron/daily with CRON_SECRET Bearer auth
  - Status auto-transitions (PENDIENTE->PROXIMO->VENCIDO) based on deadline proximity
  - Idempotent notification creation at 15/7/3/1/0 day thresholds
  - Daily digest email per user via Resend batch API
  - 30-day notification retention cleanup
  - Shared Resend instance (extracted from auth.ts)
  - vercel.json with daily cron schedule at 6 AM Colombia time
affects: [05-02-PLAN, dashboard, notifications-ui]

# Tech tracking
tech-stack:
  added: [vercel-cron]
  patterns: [cron-pipeline, idempotent-notifications, p2002-catch, batch-email, shared-resend-instance]

key-files:
  created:
    - src/app/api/cron/daily/route.ts
    - src/lib/services/cron/status-transitions.ts
    - src/lib/services/cron/create-notifications.ts
    - src/lib/services/cron/send-digest-emails.ts
    - src/lib/services/cron/cleanup.ts
    - src/lib/services/email-templates/daily-digest.ts
    - src/lib/resend.ts
    - vercel.json
  modified:
    - prisma/schema.prisma
    - src/lib/auth.ts
    - src/middleware.ts

key-decisions:
  - "Shared Resend instance extracted to src/lib/resend.ts for reuse across auth and cron"
  - "P2002 unique constraint catch for idempotent notification creation (no duplicates on re-run)"
  - "Sequential cron pipeline: transitions -> notifications -> emails -> cleanup"
  - "Notifications use threshold 0 for overdue, thresholds 1/3/7/15 for pre-deadline reminders"

patterns-established:
  - "Cron pipeline pattern: sequential service modules orchestrated by API route"
  - "Idempotent writes via Prisma P2002 catch on compound unique constraint"
  - "Shared Resend instance pattern for all email sending"
  - "Batch email with per-user grouping and deduplication"

requirements-completed: [NOTF-01, NOTF-03]

# Metrics
duration: 3min
completed: 2026-03-03
---

# Phase 5 Plan 1: Cron Engine and Notification Pipeline Summary

**Daily cron pipeline with status auto-transitions, idempotent threshold notifications, Resend batch digest emails, and 30-day cleanup**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-03T21:41:26Z
- **Completed:** 2026-03-03T21:44:45Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Notificacion Prisma model with @@unique([obligacionTributariaId, threshold]) for idempotent notification creation
- Daily cron endpoint at /api/cron/daily with Bearer CRON_SECRET auth running at 6 AM Colombia time via vercel.json
- Four-step sequential pipeline: status transitions, notification creation, digest email dispatch, and 30-day cleanup
- Inline-styled HTML email template with obligation table, overdue highlighting, and dashboard CTA button
- Shared Resend instance extracted from auth.ts for consistent email sending across the application

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Notificacion model, shared Resend instance, middleware exclusion, and vercel.json** - `dbad0c1` (feat)
2. **Task 2: Build cron services and API route with email digest template** - `47eb63d` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added Notificacion model with compound unique, indexes, and relation fields on User/ObligacionTributaria
- `src/lib/resend.ts` - Shared Resend instance extracted for reuse
- `src/lib/auth.ts` - Updated to import shared Resend instance
- `src/middleware.ts` - Added /api/cron to public routes (exempt from auth redirect)
- `vercel.json` - Vercel cron configuration: daily at 11:00 UTC (6 AM Colombia)
- `src/lib/services/cron/status-transitions.ts` - PENDIENTE->PROXIMO (7 days), PROXIMO->VENCIDO (past deadline), PENDIENTE->VENCIDO (missed edge case)
- `src/lib/services/cron/create-notifications.ts` - Idempotent notification creation at 15/7/3/1/0 thresholds via P2002 catch
- `src/lib/services/cron/send-digest-emails.ts` - Per-user daily digest email via Resend batch API with deduplication
- `src/lib/services/cron/cleanup.ts` - 30-day notification retention cleanup
- `src/lib/services/email-templates/daily-digest.ts` - Inline-styled HTML email template with obligation table and CTA
- `src/app/api/cron/daily/route.ts` - Cron API route with CRON_SECRET Bearer auth and sequential 4-step pipeline

## Decisions Made
- Extracted shared Resend instance to `src/lib/resend.ts` to avoid duplication between auth.ts and cron email sending
- Used Prisma P2002 unique constraint violation catch for idempotent notification creation -- ensures re-running cron never creates duplicate notifications
- Sequential cron pipeline order matters: transitions first (correct statuses), then notifications (correct thresholds), then emails (include today's notifications), then cleanup last
- Threshold 0 represents overdue notifications (VENCIDA type), thresholds 1/3/7/15 are pre-deadline reminders (RECORDATORIO type)
- De-duplicate obligations per user in email digest when multiple thresholds hit for the same obligation on a single day

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `src/lib/services/__tests__/matching-engine.test.ts` (mock type mismatch with PrismaPromise) -- unrelated to this plan's changes, out of scope

## User Setup Required

The following environment variable must be configured for cron to work in production:
- `CRON_SECRET` - A random secret string for authenticating Vercel cron requests (set in Vercel project settings)
- `RESEND_API_KEY` - Already configured for email verification; reused for digest emails

## Next Phase Readiness
- Notification pipeline is complete and ready for Plan 05-02 (notification UI/bell icon)
- Notificacion model is populated by cron, ready to be queried for in-app notification display
- Dashboard link in digest email points to /dashboard which already exists

## Self-Check: PASSED

All 9 created files verified on disk. Both task commits (dbad0c1, 47eb63d) verified in git log.

---
*Phase: 05-notifications-automation*
*Completed: 2026-03-03*
