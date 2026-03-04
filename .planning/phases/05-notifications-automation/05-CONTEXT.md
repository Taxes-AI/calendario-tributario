# Phase 5: Notifications & Automation - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Users receive timely reminders before deadlines through both in-app and email channels, and obligation statuses update automatically as dates pass. This phase delivers: a notification bell with dropdown panel in the nav bar, daily digest emails at each threshold (15/7/3/1 days), a daily cron job that transitions statuses and dispatches notifications, and idempotent tracking to prevent duplicate reminders. No notification preferences/settings, no multi-client notification routing — those are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Notification Center UI
- **Dropdown popover** from bell icon in the nav bar (not a separate page)
- Each notification item shows: **tax name + days left + deadline date** (e.g., "IVA Bimestral — vence en 3 dias (6 de marzo)")
- **Mark all as read** button at top of dropdown, plus clicking a notification marks it as read individually
- **Exact unread count** badge on bell icon (red circle, hides when zero)
- Bell icon added to the NavBar between nav links and user info area

### Email Reminder Format
- **Daily digest** — one email per day listing all obligations hitting a threshold that day (not one email per obligation)
- **No opt-out for v1** — all users receive emails. Preferences deferred to a future iteration.
- Email contains: **obligation table (tax name, deadline, days left) + "Ver en dashboard" CTA button** linking to the app
- **Same sender address** as verification emails: `Calendario Tributario <noreply@resend.dev>`
- Email styled consistently with existing verification email (clean, sans-serif, blue CTA button)

### Cron Job Design
- **Single daily cron** handles all three tasks in sequence: 1) status transitions, 2) in-app notification creation, 3) digest email dispatch
- Runs at **6:00 AM Colombia time** (11:00 UTC) — users see updates when starting their day
- Secured via **CRON_SECRET header check** — Vercel sets env var, API route verifies Authorization header, rejects unauthorized calls with 401
- **Idempotency via threshold tracking** — store which thresholds (15/7/3/1) have been notified for each obligation. Cron checks before creating notifications. Prevents duplicates on re-runs.
- Status transitions: PENDIENTE -> PROXIMO (7 days before due), PROXIMO -> VENCIDO (day after due date passes)

### Notification Lifecycle
- **Auto-dismiss on payment** — when obligation is marked PAGADO, all its unread notifications are automatically marked as read
- **30-day retention** — notifications older than 30 days cleaned up during cron run
- **Separate entries per threshold** — each threshold creates its own notification item, newest on top. "IVA — vence en 7 dias" and "IVA — vence en 15 dias" are both visible as separate items
- **Overdue notification** — when status transitions to VENCIDO, a special notification is created (e.g., "IVA Bimestral esta vencida desde el 6 de marzo")

### Claude's Discretion
- Notification model schema design (fields, indexes)
- Dropdown panel styling and positioning (popover vs sheet)
- Email HTML template details beyond the agreed structure
- Cron error handling and logging approach
- How threshold tracking is stored (field on ObligacionTributaria, separate model, or embedded array)
- Loading state for notification dropdown
- Empty state when no notifications exist
- Mobile responsiveness of notification dropdown

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Resend SDK** (`src/lib/auth.ts`): Already configured with `RESEND_API_KEY` env var and HTML email pattern. Can extract Resend instance for reuse.
- **NavBar** (`src/components/layout/nav-bar.tsx`): Top nav with links (Dashboard, Perfil, Sanciones) + user info + logout. Bell icon needs to be added between nav links and user area.
- **computeDisplayStatus()** (`src/lib/utils/obligation-helpers.ts`): Client-side status bridge. Cron will formalize these transitions in the DB.
- **daysUntilDeadline()** / **nowColombia()** (`src/lib/utils/dates.ts`): Colombia-timezone date utilities for threshold calculations.
- **STATUS_CONFIG** (`src/lib/utils/obligation-helpers.ts`): Status color/label config reusable for notification styling.
- **markAsPaid server action** (`src/lib/actions/obligations.ts`): Ownership-validated mutation pattern. Needs hook to auto-dismiss notifications on payment.
- **shadcn/ui Popover** component: Already installed, ideal for notification dropdown.

### Established Patterns
- Server Components for data fetching, Client Components for interactivity
- Server actions in `src/lib/actions/` for mutations
- Prisma queries via `@/lib/prisma` singleton
- `auth.api.getSession({ headers: await headers() })` for auth in server components
- `revalidatePath("/dashboard")` after data mutations
- Toast notifications via sonner (already in app layout)
- Only one API route exists: `/api/auth/[...all]/route.ts` — cron will be the second

### Integration Points
- **NavBar**: Bell icon insertion point between nav links and user info
- **ObligacionTributaria model**: Has estado field for status transitions. Needs threshold tracking for idempotency.
- **Prisma schema**: Needs new Notification model (no notification model exists yet)
- **markAsPaid action**: Needs to auto-dismiss related notifications when obligation is paid
- **Vercel config**: No vercel.json exists — needs to be created for cron schedule

</code_context>

<specifics>
## Specific Ideas

- Maintain the Linear-inspired clean aesthetic — notification dropdown should feel professional, not cluttered
- Email digest should feel like a helpful daily summary, not spam
- The overdue notification is an important signal — make it visually distinct from pre-deadline reminders
- 6 AM Colombia time chosen so users see fresh data when they start their workday

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-notifications-automation*
*Context gathered: 2026-03-03*
