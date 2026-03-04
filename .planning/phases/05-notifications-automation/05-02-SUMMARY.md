---
phase: 05-notifications-automation
plan: 02
subsystem: ui
tags: [notifications, popover, bell-icon, optimistic-ui, server-actions, date-fns]

# Dependency graph
requires:
  - phase: 05-notifications-automation
    provides: Notificacion Prisma model with threshold-based notifications from cron pipeline
  - phase: 03-dashboard-calendar
    provides: NavBar, AppShell, markAsPaid action, dashboard layout
provides:
  - Notification server queries (getUnreadCount, getNotifications)
  - Notification server actions (markNotificationAsRead, markAllNotificationsAsRead)
  - NotificationBell component with unread count badge
  - NotificationDropdown popover with mark-as-read and optimistic UI
  - Auto-dismiss notifications on payment (markAsPaid integration)
  - SerializedNotification type for client component consumption
affects: [06-multi-client, dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [optimistic-ui-set, server-data-serialization, popover-dropdown, notification-center]

key-files:
  created:
    - src/lib/queries/notifications.ts
    - src/lib/actions/notifications.ts
    - src/components/notifications/notification-bell.tsx
    - src/components/notifications/notification-dropdown.tsx
  modified:
    - src/lib/actions/obligations.ts
    - src/components/layout/nav-bar.tsx
    - src/components/layout/app-shell.tsx

key-decisions:
  - "Optimistic UI via local Set<string> for instant read state feedback before server confirmation"
  - "Overflow scroll div (max-h-80) instead of ScrollArea component -- simpler, no extra dependency"
  - "Date serialization at AppShell boundary -- server fetches Date objects, serializes to ISO strings for client"

patterns-established:
  - "Optimistic UI pattern: local Set tracks pending server mutations for instant visual feedback"
  - "Notification data flow: AppShell (server) -> NavBar (client) -> NotificationDropdown (client)"
  - "Auto-dismiss pattern: related notifications marked as read when parent entity state changes"

requirements-completed: [NOTF-02]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 5 Plan 2: Notification Center UI Summary

**In-app notification center with bell icon, unread badge, popover dropdown, mark-as-read, and auto-dismiss on payment**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T21:48:17Z
- **Completed:** 2026-03-03T21:50:35Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Bell icon with red unread count badge in the NavBar between nav links and user info area
- Popover dropdown listing notifications newest-first with tipo-colored dots, message text, and relative timestamps in Spanish
- Optimistic mark-as-read (individual click) and mark-all-as-read (button with toast confirmation)
- Auto-dismiss of related notifications when an obligation is marked as paid
- Server-side data fetching in AppShell with parallel queries and date serialization

## Task Commits

Each task was committed atomically:

1. **Task 1: Create notification queries, actions, and update markAsPaid with auto-dismiss** - `cbc28cb` (feat)
2. **Task 2: Build notification bell, dropdown UI, and integrate into NavBar/AppShell** - `b9eaf01` (feat)

## Files Created/Modified
- `src/lib/queries/notifications.ts` - Server queries: getUnreadCount, getNotifications, SerializedNotification type
- `src/lib/actions/notifications.ts` - Server actions: markNotificationAsRead, markAllNotificationsAsRead with authedAction pattern
- `src/lib/actions/obligations.ts` - Added auto-dismiss of related notifications in markAsPaid action
- `src/components/notifications/notification-bell.tsx` - Bell icon with red badge (hides at 0, caps at 99+), accessible button
- `src/components/notifications/notification-dropdown.tsx` - Popover dropdown with notification list, optimistic UI, mark-all button, empty state
- `src/components/layout/nav-bar.tsx` - Updated props interface, added notification bell between links and user info, useState for popover
- `src/components/layout/app-shell.tsx` - Parallel fetch of unreadCount and notifications, date serialization, pass to NavBar

## Decisions Made
- Used optimistic UI via local `Set<string>` to instantly reflect read state before server confirmation -- provides responsive UX without waiting for round-trip
- Used overflow div with max-h-80 instead of ScrollArea component to avoid adding an unused shadcn component for a single use case
- Date serialization happens at the AppShell server component boundary -- Prisma returns Date objects, AppShell converts to ISO strings before passing to client components
- Used `updateMany` for ownership validation in notification actions (same pattern as obligations.ts) -- silently ignores non-matching rows instead of throwing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `src/lib/services/__tests__/matching-engine.test.ts` (PrismaPromise mock type mismatch) -- unrelated to this plan's changes, out of scope

## User Setup Required

None - no external service configuration required. Notification data is populated by the cron pipeline from Plan 05-01.

## Next Phase Readiness
- Phase 5 (Notifications & Automation) is fully complete
- Both NOTF-01 (cron pipeline + email digest) and NOTF-02 (in-app notification center) delivered
- Ready for Phase 6 (Multi-client support)
- Notification system will need multi-empresa awareness when Phase 6 adds per-empresa context

## Self-Check: PASSED

All 4 created files verified on disk. Both task commits (cbc28cb, b9eaf01) verified in git log.

---
*Phase: 05-notifications-automation*
*Completed: 2026-03-03*
