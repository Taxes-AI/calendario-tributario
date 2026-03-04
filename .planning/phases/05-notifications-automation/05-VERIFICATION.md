---
phase: 05-notifications-automation
verified: 2026-03-03T22:00:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
---

# Phase 5: Notifications & Automation Verification Report

**Phase Goal:** Users receive timely reminders before deadlines through both in-app and email channels, and obligation statuses update automatically as dates pass
**Verified:** 2026-03-03T22:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths — Plan 05-01 (Backend Pipeline)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Daily cron endpoint exists at /api/cron/daily, accepts GET, rejects unauthorized requests with 401 | VERIFIED | `src/app/api/cron/daily/route.ts` exports `GET`; checks `authHeader !== \`Bearer ${process.env.CRON_SECRET}\`` and returns `new Response("Unauthorized", { status: 401 })` |
| 2 | Cron transitions PENDIENTE obligations to PROXIMO when 7 or fewer days remain before deadline | VERIFIED | `status-transitions.ts` lines 24-27: `if (days >= 0 && days <= 7 && ob.estado === "PENDIENTE") { newEstado = "PROXIMO"; }` |
| 3 | Cron transitions PROXIMO obligations to VENCIDO the day after the deadline passes (daysUntilDeadline < 0) | VERIFIED | `status-transitions.ts` lines 19-22: `if (days < 0 && ob.estado === "PROXIMO") { newEstado = "VENCIDO"; }`. Edge case (PENDIENTE->VENCIDO for missed runs) handled lines 29-32. |
| 4 | Cron creates idempotent in-app notifications at 15/7/3/1 day thresholds without duplicates on re-run | VERIFIED | `create-notifications.ts`: `THRESHOLDS = [15, 7, 3, 1]`, P2002 catch in `createNotificationIfNew()` returns `false` on duplicate; full idempotency enforced by `@@unique([obligacionTributariaId, threshold])` |
| 5 | Cron creates an overdue notification (threshold 0) when an obligation transitions to VENCIDO | VERIFIED | `create-notifications.ts` lines 77-88: checks `ob.estado === "VENCIDO" && days < 0`, calls `createNotificationIfNew(..., 0, ..., "VENCIDA")` |
| 6 | Cron sends one daily digest email per user listing all obligations hitting a threshold that day | VERIFIED | `send-digest-emails.ts`: groups notifications by userId, builds one email per user with de-duplicated obligations, sends via `resend.batch.send()` |
| 7 | Cron cleans up notifications older than 30 days | VERIFIED | `cleanup.ts`: `thirtyDaysAgo.setDate(getDate() - 30)`, `prisma.notificacion.deleteMany({ where: { createdAt: { lt: thirtyDaysAgo } } })` |
| 8 | Notificacion model has @@unique([obligacionTributariaId, threshold]) for idempotency | VERIFIED | `prisma/schema.prisma` line 191: `@@unique([obligacionTributariaId, threshold])` confirmed present |

### Observable Truths — Plan 05-02 (UI/Frontend)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 9 | Bell icon appears in the nav bar between nav links and user info area | VERIFIED | `nav-bar.tsx`: `NotificationDropdown` wrapping `NotificationBell` rendered inside the right-side `<div className="flex items-center gap-4">`, after nav links, before user name and logout button |
| 10 | Unread count badge shows on the bell icon and hides when zero | VERIFIED | `notification-bell.tsx` lines 28-31: `{unreadCount > 0 && (<span ...>{unreadCount > 99 ? "99+" : unreadCount}</span>)}` — badge conditionally rendered, hidden at 0 |
| 11 | Clicking the bell opens a dropdown popover listing all notifications, newest first | VERIFIED | `app-shell.tsx`: `getNotifications(userId)` uses `orderBy: { createdAt: "desc" }`; `notification-dropdown.tsx` uses `Popover`/`PopoverContent` with `open` prop wired to `notifOpen` state |
| 12 | Mark all as read button marks all unread notifications as read; clicking a notification marks it as read individually; empty state shown | VERIFIED | `notification-dropdown.tsx`: `handleMarkOne` calls `markNotificationAsRead`; `handleMarkAll` calls `markAllNotificationsAsRead` with toast; empty state renders `<Bell><p>No tienes notificaciones</p>` when `notifications.length === 0` |

**Score: 12/12 truths verified**

---

## Required Artifacts

### Plan 05-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | Notificacion model with compound unique and indexes | VERIFIED | `model Notificacion` with `@@unique([obligacionTributariaId, threshold])`, `@@index([userId, leida])`, `@@index([userId, createdAt])`; relation fields on User and ObligacionTributaria both confirmed |
| `vercel.json` | Vercel cron schedule at 0 11 * * * | VERIFIED | `"schedule": "0 11 * * *"`, path `/api/cron/daily` |
| `src/app/api/cron/daily/route.ts` | Cron endpoint with CRON_SECRET Bearer auth, exports GET | VERIFIED | Exports `GET`; CRON_SECRET check confirmed; 4-step sequential pipeline wired |
| `src/lib/services/cron/status-transitions.ts` | PENDIENTE->PROXIMO->VENCIDO transitions, exports transitionStatuses | VERIFIED | All three transition branches implemented; function exported |
| `src/lib/services/cron/create-notifications.ts` | Idempotent notification creation, exports createNotifications | VERIFIED | P2002 catch confirmed; all thresholds 15/7/3/1/0 handled; function exported |
| `src/lib/services/cron/send-digest-emails.ts` | Daily digest email via Resend batch, exports sendDigestEmails | VERIFIED | Per-user grouping, deduplication, `resend.batch.send()` in chunks of 100; function exported |
| `src/lib/services/cron/cleanup.ts` | 30-day retention cleanup, exports cleanupOldNotifications | VERIFIED | `setDate(getDate() - 30)` + `deleteMany`; function exported |
| `src/lib/services/email-templates/daily-digest.ts` | HTML template, exports buildDigestHtml | VERIFIED | Inline-styled table with Impuesto/Fecha limite/Dias restantes columns, CTA button, footer; function exported |
| `src/lib/resend.ts` | Shared Resend instance, exports resend | VERIFIED | `export const resend = new Resend(process.env.RESEND_API_KEY)` |
| `src/middleware.ts` | Updated to exclude /api/cron from auth redirect | VERIFIED | `"/api/cron"` in `publicRoutes` array; `isPublicRoute` uses `startsWith` so `/api/cron/daily` is matched |

### Plan 05-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/queries/notifications.ts` | Server queries, exports getUnreadCount and getNotifications | VERIFIED | Both functions exported; `SerializedNotification` type exported; `getNotifications` orders `desc` by `createdAt` |
| `src/lib/actions/notifications.ts` | Server actions, exports markNotificationAsRead and markAllNotificationsAsRead | VERIFIED | Both actions use `authedAction` pattern; `updateMany` with userId ownership check; `revalidatePath("/dashboard")` on both |
| `src/components/notifications/notification-bell.tsx` | Bell icon with unread count badge | VERIFIED | `Bell` icon from lucide-react; conditional badge; `aria-label` and `aria-haspopup` accessible attributes |
| `src/components/notifications/notification-dropdown.tsx` | Popover dropdown with notification list and mark-as-read | VERIFIED | `Popover`/`PopoverContent`; optimistic UI via `Set<string>`; `formatDistanceToNow` with Spanish locale; empty state; tipo-colored dots |
| `src/components/layout/nav-bar.tsx` | Updated NavBar with notification bell between nav links and user info | VERIFIED | `NavBarProps` updated with `unreadCount` and `notifications`; `NotificationDropdown` wrapping `NotificationBell` correctly positioned |
| `src/components/layout/app-shell.tsx` | Updated AppShell passing unread count to NavBar | VERIFIED | `Promise.all([getUnreadCount, getNotifications])`; `createdAt.toISOString()` serialization; passes `unreadCount` and `notifications` to `NavBar` |
| `src/lib/actions/obligations.ts` | Updated markAsPaid with auto-dismiss of related notifications | VERIFIED | `prisma.notificacion.updateMany({ where: { obligacionTributariaId: obligacion.id, leida: false }, data: { leida: true } })` added after obligation update, before `revalidatePath` |

---

## Key Link Verification

### Plan 05-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/cron/daily/route.ts` | `src/lib/services/cron/status-transitions.ts` | `transitionStatuses()` call | WIRED | Import line 2; called line 17: `await transitionStatuses()` |
| `src/app/api/cron/daily/route.ts` | `src/lib/services/cron/create-notifications.ts` | `createNotifications()` call | WIRED | Import line 3; called line 19: `await createNotifications()` |
| `src/app/api/cron/daily/route.ts` | `src/lib/services/cron/send-digest-emails.ts` | `sendDigestEmails()` call | WIRED | Import line 4; called line 21: `await sendDigestEmails()` |
| `src/lib/services/cron/send-digest-emails.ts` | `src/lib/resend.ts` | `resend.batch.send()` for digest emails | WIRED | Import line 1; `resend.batch.send(batch)` line 75 |
| `src/lib/services/cron/create-notifications.ts` | `prisma.notificacion` | Prisma create with P2002 catch | WIRED | `prisma.notificacion.create()` inside `createNotificationIfNew()`; `catch` checks `error.code === "P2002"` |
| `vercel.json` | `/api/cron/daily` | Vercel cron schedule invocation | WIRED | `"path": "/api/cron/daily"` in vercel.json crons array |
| `src/lib/auth.ts` | `src/lib/resend.ts` | Shared Resend import | WIRED | `import { resend } from "./resend"` confirmed; no local `new Resend()` in auth.ts |

### Plan 05-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/layout/app-shell.tsx` | `src/lib/queries/notifications.ts` | `getUnreadCount()` call in server component | WIRED | Import line 5; `Promise.all([getUnreadCount(session.user.id), getNotifications(session.user.id)])` line 28-31 |
| `src/components/layout/app-shell.tsx` | `src/components/layout/nav-bar.tsx` | Passes `unreadCount` and `notifications` as props | WIRED | `<NavBar ... unreadCount={unreadCount} notifications={serializedNotifications} />` |
| `src/components/notifications/notification-dropdown.tsx` | `src/lib/actions/notifications.ts` | `markNotificationAsRead` and `markAllNotificationsAsRead` action calls | WIRED | Both imported lines 17-19; `executeMarkOne({ notificationId: id })` and `executeMarkAll({})` called |
| `src/lib/actions/obligations.ts` | `prisma.notificacion.updateMany` | Auto-dismiss unread notifications when obligation marked as paid | WIRED | `prisma.notificacion.updateMany(...)` at line 67 inside `markAsPaid` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| NOTF-01 | 05-01-PLAN | Email reminders sent at 15/7/3/1 day thresholds before deadlines | SATISFIED | `create-notifications.ts` creates threshold-based notifications; `send-digest-emails.ts` sends one email per user per day for new notifications via `resend.batch.send()` |
| NOTF-02 | 05-02-PLAN | In-app notification center with bell icon and unread count | SATISFIED | `notification-bell.tsx` with badge; `notification-dropdown.tsx` with full list, mark-read, empty state; wired through AppShell->NavBar->Dropdown |
| NOTF-03 | 05-01-PLAN | Obligation status auto-progression via daily cron (PENDIENTE -> PROXIMO -> VENCIDO) | SATISFIED | `status-transitions.ts` implements all transitions; called from cron route; PENDIENTE->VENCIDO edge case for missed runs also handled |

**All 3 requirements covered. No orphaned requirements.**

REQUIREMENTS.md Traceability table maps NOTF-01, NOTF-02, NOTF-03 to Phase 5 with status "Complete" — consistent with implementation evidence.

---

## Anti-Patterns Found

No anti-patterns detected in phase 5 files. Scanned:
- `src/app/api/cron/daily/route.ts`
- `src/lib/services/cron/` (all 4 files)
- `src/lib/services/email-templates/daily-digest.ts`
- `src/lib/resend.ts`
- `src/lib/queries/notifications.ts`
- `src/lib/actions/notifications.ts`
- `src/components/notifications/` (both files)
- `src/components/layout/nav-bar.tsx`
- `src/components/layout/app-shell.tsx`
- `src/lib/actions/obligations.ts`

No TODO/FIXME/placeholder comments found. No empty implementations. No stub return values.

**Pre-existing TypeScript error** (not phase 5): `src/lib/services/__tests__/matching-engine.test.ts` has a PrismaPromise mock type mismatch (documented in both SUMMARYs as pre-existing and out of scope). All phase 5 files are TypeScript-clean.

---

## Human Verification Required

### 1. Email Delivery End-to-End

**Test:** Trigger the cron endpoint manually with the CRON_SECRET Bearer token in a staging environment where obligations are within threshold days. Check the receiving email inbox.
**Expected:** One email per user with a table listing due obligations, correct impuesto names, dates, and days remaining. "Ver en dashboard" CTA button links to the live dashboard.
**Why human:** Cannot programmatically verify Resend API delivery, email rendering in mail clients, or correct date formatting in email output without running the app against a real database.

### 2. Bell Badge Real-Time Update

**Test:** In the browser, mark a notification as read (individually) and then mark all as read.
**Expected:** Badge count decreases immediately (optimistic UI) on individual mark; drops to zero and badge hides when all marked as read. No page refresh needed.
**Why human:** Optimistic UI Set behavior requires visual confirmation in browser. Cannot verify React state transitions programmatically.

### 3. Auto-Dismiss on Payment

**Test:** Mark an obligation as paid that has unread notifications. Then open the bell dropdown.
**Expected:** Previously unread notifications for that obligation now appear as read (gray, not blue-tinted). Unread count badge reflects the reduction.
**Why human:** Requires a live database with seeded notification records and an active session to test the markAsPaid -> notificacion.updateMany -> revalidatePath cascade.

---

## Commits Verified

All 4 task commits from phase 5 confirmed in git log:

| Commit | Plan | Description |
|--------|------|-------------|
| `dbad0c1` | 05-01 Task 1 | Notificacion model, shared Resend, middleware exclusion, vercel.json |
| `47eb63d` | 05-01 Task 2 | Cron services, API route, email digest template |
| `cbc28cb` | 05-02 Task 1 | Notification queries, actions, markAsPaid auto-dismiss |
| `b9eaf01` | 05-02 Task 2 | Notification bell, dropdown UI, NavBar/AppShell integration |

---

## Summary

Phase 5 goal is fully achieved. All 12 must-have truths verified across both plans. Every artifact exists, is substantive (no stubs), and is wired to its consumers. All three requirements (NOTF-01, NOTF-02, NOTF-03) have implementation evidence. No blocking anti-patterns.

The backend pipeline (Plan 05-01) delivers a complete, idempotent cron system: status transitions run before notification creation (so thresholds reflect correct statuses), notifications are created before email dispatch (so today's hits are included), and cleanup runs last. The frontend (Plan 05-02) delivers a complete notification center wired end-to-end from AppShell server fetch through NavBar to the Popover dropdown with optimistic read tracking.

Three items require human verification in a live environment: email delivery confirmation, optimistic badge behavior, and auto-dismiss cascade on payment.

---

_Verified: 2026-03-03T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
