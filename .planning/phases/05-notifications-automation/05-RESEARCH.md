# Phase 5: Notifications & Automation - Research

**Researched:** 2026-03-03
**Domain:** Cron-driven notifications (in-app + email), status automation, Vercel Cron Jobs
**Confidence:** HIGH

## Summary

Phase 5 introduces a daily cron job that runs three sequential tasks: obligation status transitions, in-app notification creation, and daily digest email dispatch. The entire stack is already present in the project -- Prisma for data, Resend for email, shadcn Popover for UI, date-fns/tz for Colombia-time calculations. No new dependencies are required.

The cron endpoint is a standard Next.js API route handler (`GET` at `/api/cron/daily`) secured with `CRON_SECRET` Bearer auth. Vercel invokes it via `vercel.json` configuration. The notification model uses a `@@unique` compound constraint on `[obligacionTributariaId, threshold]` to enforce idempotency at the database level -- re-running the cron cannot create duplicate notifications. Email dispatch uses `resend.batch.send()` (already available in Resend SDK v6.9.2) to send one digest email per user in a single API call (max 100 per batch).

**Primary recommendation:** Use a dedicated `Notificacion` Prisma model with a compound unique on `[obligacionTributariaId, threshold]` for idempotency, a single `/api/cron/daily` route for all three tasks, and the existing Resend instance (extracted from `src/lib/auth.ts` into a shared `src/lib/resend.ts` module) for digest emails.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Notification Center UI**: Dropdown popover from bell icon in nav bar (not a separate page). Each item shows tax name + days left + deadline date. Mark-all-as-read button at top, clicking individual notification marks it as read. Exact unread count badge (red circle, hides when zero). Bell icon between nav links and user info area.
- **Email Reminder Format**: Daily digest -- one email per day listing all obligations hitting a threshold. No opt-out for v1. Contains obligation table + "Ver en dashboard" CTA button. Same sender as verification emails: `Calendario Tributario <noreply@resend.dev>`. Styled consistently with existing verification email.
- **Cron Job Design**: Single daily cron handles status transitions, in-app notification creation, and digest email dispatch in sequence. Runs at 6:00 AM Colombia time (11:00 UTC). Secured via CRON_SECRET header check. Idempotency via threshold tracking. Status transitions: PENDIENTE -> PROXIMO (7 days before), PROXIMO -> VENCIDO (day after due date passes).
- **Notification Lifecycle**: Auto-dismiss on payment (mark as read when PAGADO). 30-day retention cleanup during cron run. Separate entries per threshold (each threshold = its own notification item, newest on top). Overdue notification when status transitions to VENCIDO.

### Claude's Discretion
- Notification model schema design (fields, indexes)
- Dropdown panel styling and positioning (popover vs sheet)
- Email HTML template details beyond the agreed structure
- Cron error handling and logging approach
- How threshold tracking is stored (field on ObligacionTributaria, separate model, or embedded array)
- Loading state for notification dropdown
- Empty state when no notifications exist
- Mobile responsiveness of notification dropdown

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTF-01 | Email reminders sent at 15/7/3/1 day thresholds before deadlines | Resend `batch.send()` for digest emails; cron calculates thresholds using `daysUntilDeadline()`; idempotent via `@@unique` compound constraint on Notificacion model |
| NOTF-02 | In-app notification center with bell icon and unread count | New `Notificacion` Prisma model; shadcn Popover already installed; NavBar insertion point identified between nav links and user info |
| NOTF-03 | Obligation status auto-progression via daily cron (PENDIENTE -> PROXIMO -> VENCIDO) | Vercel Cron Job at `/api/cron/daily`; `vercel.json` with `"0 11 * * *"` schedule (11 UTC = 6 AM COT); CRON_SECRET Bearer auth |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Resend SDK | 6.9.2 | Email dispatch (single + batch) | Already installed and configured in project; `batch.send()` available |
| Prisma Client | 6.19.2 | Notification model, queries, idempotent constraints | Already the project ORM; MongoDB `@@unique` supports compound constraints |
| date-fns + @date-fns/tz | 4.1.0 / 1.4.1 | Threshold calculation, Colombia timezone | Already used throughout project via `daysUntilDeadline()`, `nowColombia()` |
| shadcn/ui Popover | (radix-ui 1.4.3) | Notification dropdown panel | Already installed; consistent with project UI pattern |
| lucide-react | 0.575.0 | Bell icon (`Bell` / `BellDot`) | Already the project icon library |
| Vercel Cron Jobs | N/A (platform) | Scheduled daily invocation | Built into Vercel; configured via `vercel.json` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast feedback for mark-as-read actions | Already in app layout; use for "Marcadas como leidas" confirmation |
| next-safe-action | 8.1.4 | Server actions for mark-as-read mutations | Already the project pattern for authed mutations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate `Notificacion` model | Embedded array on `ObligacionTributaria` | Separate model is cleaner for querying all user notifications, unread counts, and 30-day cleanup. Embedded arrays complicate aggregation queries in Prisma. |
| `resend.batch.send()` | Individual `resend.emails.send()` per user | Batch is more efficient (1 API call vs N). Max 100 per batch, which is sufficient for expected user base. |
| Vercel Cron Jobs | External scheduler (cron-job.org, Upstash QStash) | Vercel native is simplest -- no external dependency, built-in CRON_SECRET, logging in dashboard. |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── cron/
│           └── daily/
│               └── route.ts          # Cron endpoint (GET, CRON_SECRET auth)
├── components/
│   └── notifications/
│       ├── notification-bell.tsx      # Bell icon + unread badge (client)
│       └── notification-dropdown.tsx  # Popover panel with items (client)
├── lib/
│   ├── resend.ts                     # Shared Resend instance (extracted from auth.ts)
│   ├── actions/
│   │   └── notifications.ts          # Server actions: markAsRead, markAllAsRead
│   ├── queries/
│   │   └── notifications.ts          # Server queries: getUnreadCount, getNotifications
│   └── services/
│       ├── cron/
│       │   ├── status-transitions.ts # Step 1: PENDIENTE->PROXIMO->VENCIDO
│       │   ├── create-notifications.ts # Step 2: In-app notification creation
│       │   ├── send-digest-emails.ts # Step 3: Email digest dispatch
│       │   └── cleanup.ts           # Step 4: 30-day retention cleanup
│       └── email-templates/
│           └── daily-digest.ts       # HTML template for digest email
```

### Pattern 1: Cron Route with CRON_SECRET Auth
**What:** A Next.js API route handler that validates the Vercel-injected `Authorization: Bearer <CRON_SECRET>` header before executing cron logic.
**When to use:** Any Vercel cron endpoint.
**Example:**
```typescript
// Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs
// src/app/api/cron/daily/route.ts
import type { NextRequest } from "next/server";

export const maxDuration = 60; // seconds (Hobby plan max without Fluid Compute)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Step 1: Transition statuses
    const transitioned = await transitionStatuses();
    // Step 2: Create in-app notifications
    const created = await createNotifications();
    // Step 3: Send digest emails
    const emailed = await sendDigestEmails();
    // Step 4: Cleanup old notifications
    const cleaned = await cleanupOldNotifications();

    return Response.json({
      success: true,
      transitioned,
      created,
      emailed,
      cleaned,
    });
  } catch (error) {
    console.error("[CRON] Daily job failed:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

### Pattern 2: Idempotent Notification Creation via @@unique
**What:** Using a compound unique constraint on `[obligacionTributariaId, threshold]` ensures that re-running the cron never creates duplicate notifications. The create operation uses Prisma's try/catch on unique violation (P2002 error code).
**When to use:** Any idempotent upsert pattern in Prisma with MongoDB.
**Example:**
```typescript
// Create notification only if not already sent for this obligation+threshold
const THRESHOLDS = [15, 7, 3, 1] as const;
type Threshold = (typeof THRESHOLDS)[number];

async function createNotificationIfNew(
  obligacionId: string,
  userId: string,
  threshold: Threshold,
  message: string,
  type: "RECORDATORIO" | "VENCIDA"
) {
  try {
    await prisma.notificacion.create({
      data: {
        userId,
        obligacionTributariaId: obligacionId,
        threshold,
        tipo: type,
        mensaje: message,
        leida: false,
      },
    });
    return true; // New notification created
  } catch (error: unknown) {
    // P2002 = unique constraint violation (already exists)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return false; // Already notified -- idempotent skip
    }
    throw error; // Re-throw unexpected errors
  }
}
```

### Pattern 3: Batch Email Digest with Resend
**What:** Collect all users who have threshold-hitting obligations today, build one HTML digest per user, and send them all in a single `resend.batch.send()` call.
**When to use:** Sending personalized emails to multiple recipients efficiently.
**Example:**
```typescript
// Source: Resend SDK v6.9.2 batch API
import { resend } from "@/lib/resend";

// Build array of per-user digest emails
const emails = usersWithNotifications.map((user) => ({
  from: "Calendario Tributario <noreply@resend.dev>",
  to: [user.email],
  subject: `Recordatorio: ${user.obligations.length} obligaciones proximas`,
  html: buildDigestHtml(user.name, user.obligations),
}));

// Send all in one batch (max 100 per call)
if (emails.length > 0) {
  const { data, error } = await resend.batch.send(emails);
  if (error) {
    console.error("[CRON] Batch email failed:", error);
  }
}
```

### Pattern 4: Auto-Dismiss Notifications on Payment
**What:** When `markAsPaid` action fires, also mark all unread notifications for that obligation as read.
**When to use:** Extending the existing `markAsPaid` server action in `src/lib/actions/obligations.ts`.
**Example:**
```typescript
// After updating obligation to PAGADO:
await prisma.notificacion.updateMany({
  where: {
    obligacionTributariaId: obligacion.id,
    leida: false,
  },
  data: { leida: true },
});
```

### Anti-Patterns to Avoid
- **Storing thresholds as an array field on ObligacionTributaria:** Complicates querying ("which obligations still need a 7-day notification?") and breaks Prisma's compound unique constraint advantage. Use a separate `Notificacion` model.
- **Sending one email per obligation:** User decided on daily digest format. One email per user per day, not one email per obligation.
- **Using POST for the cron route:** Vercel cron jobs make `GET` requests. Using `POST` will result in a 405.
- **Ignoring the 100-email batch limit:** If user base grows beyond 100, chunk the batch into groups of 100 and send sequentially.
- **Hardcoding UTC offsets:** Always use `nowColombia()` and `toColombia()` from the existing date utilities. Colombia does not observe DST, so UTC-5 is constant, but use the library anyway for clarity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron scheduling | Custom setInterval or external scheduler | Vercel Cron Jobs (`vercel.json`) | Platform-native, auto-secured, observable in dashboard |
| Idempotent notification tracking | Manual "check then insert" logic | `@@unique` constraint + P2002 catch | Race-safe at database level; no TOCTOU bugs |
| Email templating | Complex React email pipeline | Inline HTML string template | Project already uses inline HTML for verification email; consistency matters more than elegance for 1 template |
| Timezone arithmetic | Manual UTC offset math | `nowColombia()` / `toColombia()` / `daysUntilDeadline()` from `src/lib/utils/dates.ts` | Already battle-tested in dashboard; Colombia has no DST |
| Batch email sending | Loop of individual `emails.send()` calls | `resend.batch.send()` | Single API call, atomic error handling, respects rate limits |

**Key insight:** This phase is a "plumbing" phase -- it wires together existing pieces (Prisma, Resend, date-fns, shadcn Popover) with a new cron endpoint and a new model. The only truly new code is the cron orchestration logic and the notification UI components.

## Common Pitfalls

### Pitfall 1: Vercel Hobby Plan Cron Timing Imprecision
**What goes wrong:** On Hobby plan, `0 11 * * *` (6 AM COT) can fire anytime between 11:00 and 11:59 UTC. Users might not see notifications at exactly 6 AM.
**Why it happens:** Vercel distributes Hobby cron invocations across the hour for load balancing.
**How to avoid:** Accept the imprecision for v1. Document it. Upgrading to Pro gives per-minute precision. The cron is idempotent, so timing drift has no data impact.
**Warning signs:** Users report notifications arriving at inconsistent times.

### Pitfall 2: Forgetting to Handle the "Day After" for VENCIDO
**What goes wrong:** `daysUntilDeadline()` returns 0 on the due date itself. Status should remain PROXIMO on the due date and only transition to VENCIDO the day after.
**Why it happens:** Off-by-one confusion between "days until" and "days past."
**How to avoid:** Transition to VENCIDO when `daysUntilDeadline(fechaVencimiento) < 0` (strictly negative). On the due date (days = 0), status stays PROXIMO.
**Warning signs:** Obligations showing VENCIDO on their actual due date.

### Pitfall 3: Cron Route Responding with Redirect
**What goes wrong:** If middleware or auth redirects the cron route, Vercel does not follow redirects. The cron silently "succeeds" with a 3xx but never executes.
**Why it happens:** The app has auth middleware that redirects unauthenticated requests. The cron endpoint is an API route, not a page, but middleware might still match it.
**How to avoid:** Ensure the cron route path (`/api/cron/daily`) is excluded from auth middleware matching. Check the existing middleware pattern.
**Warning signs:** Cron shows successful invocations in Vercel dashboard but no status transitions or notifications occur.

### Pitfall 4: Resend Rate Limiting (Free Tier)
**What goes wrong:** Resend free tier allows 100 emails/day and 3,000/month. If batch email exceeds this, some users get no email.
**Why it happens:** More users sign up than expected, or cron retries cause duplicate attempts.
**How to avoid:** Idempotent notification model prevents duplicate email sends. Log batch results. Monitor Resend dashboard. For v1 with <100 users, free tier is sufficient.
**Warning signs:** Resend API returns 429 (rate limit) errors in cron logs.

### Pitfall 5: MongoDB ObjectId in @@unique Compound Constraint
**What goes wrong:** Prisma's `@@unique` with MongoDB requires the fields to be properly typed with `@db.ObjectId` where referencing other models.
**Why it happens:** Forgetting to annotate `obligacionTributariaId` as `@db.ObjectId` in the new Notificacion model.
**How to avoid:** Follow the exact same pattern as existing models (e.g., `empresaId String @db.ObjectId` in ObligacionTributaria).
**Warning signs:** `prisma db push` fails or unique constraint doesn't enforce properly.

### Pitfall 6: NavBar Client Component Data Fetching
**What goes wrong:** NavBar is a `"use client"` component. It cannot directly fetch notification counts from the database.
**Why it happens:** Server components can fetch data, but NavBar needs interactivity (popover toggle, mark-as-read).
**How to avoid:** Fetch unread count in the parent `AppShell` server component and pass it as a prop to NavBar. The notification dropdown can use client-side fetch or server actions for mark-as-read operations. Alternatively, split into a server wrapper that fetches + a client bell component.
**Warning signs:** Attempting `prisma.notificacion.count()` inside a `"use client"` component causes build errors.

## Code Examples

Verified patterns from official sources and the existing codebase:

### Prisma Notificacion Model
```prisma
// Source: Project convention from existing ObligacionTributaria model + Prisma @@unique docs
model Notificacion {
  id                       String   @id @default(auto()) @map("_id") @db.ObjectId
  userId                   String   @db.ObjectId
  obligacionTributariaId   String   @db.ObjectId
  threshold                Int      // 15, 7, 3, 1, or 0 (0 = overdue/VENCIDA)
  tipo                     String   // RECORDATORIO, VENCIDA
  mensaje                  String   // "IVA Bimestral -- vence en 3 dias (6 de marzo)"
  leida                    Boolean  @default(false)
  createdAt                DateTime @default(now())

  user                     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  obligacionTributaria     ObligacionTributaria @relation(fields: [obligacionTributariaId], references: [id], onDelete: Cascade)

  @@unique([obligacionTributariaId, threshold])
  @@index([userId, leida])
  @@index([userId, createdAt])
}
```

### vercel.json Configuration
```json
// Source: https://vercel.com/docs/cron-jobs
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 11 * * *"
    }
  ]
}
```
Note: `0 11 * * *` = daily at 11:00 UTC = 6:00 AM Colombia time (UTC-5). Vercel cron timezone is always UTC.

### Shared Resend Instance
```typescript
// src/lib/resend.ts -- extracted from auth.ts pattern
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
```

### Status Transition Logic
```typescript
// Mirrors existing computeDisplayStatus() logic but applies to DB
import { prisma } from "@/lib/prisma";
import { daysUntilDeadline } from "@/lib/utils/dates";

export async function transitionStatuses(): Promise<{ toProximo: number; toVencido: number }> {
  // Find all non-PAGADO obligations
  const obligations = await prisma.obligacionTributaria.findMany({
    where: { estado: { in: ["PENDIENTE", "PROXIMO"] } },
  });

  let toProximo = 0;
  let toVencido = 0;

  for (const ob of obligations) {
    const days = daysUntilDeadline(ob.fechaVencimiento);
    let newEstado: string | null = null;

    if (days < 0 && ob.estado !== "VENCIDO") {
      newEstado = "VENCIDO";
      toVencido++;
    } else if (days >= 0 && days <= 7 && ob.estado === "PENDIENTE") {
      newEstado = "PROXIMO";
      toProximo++;
    }

    if (newEstado) {
      await prisma.obligacionTributaria.update({
        where: { id: ob.id },
        data: { estado: newEstado },
      });
    }
  }

  return { toProximo, toVencido };
}
```

### Notification Server Action (Mark as Read)
```typescript
// Follows existing authedAction pattern from src/lib/actions/obligations.ts
export const markNotificationAsRead = authedAction
  .schema(z.object({ notificationId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    await prisma.notificacion.updateMany({
      where: {
        id: parsedInput.notificationId,
        userId: ctx.userId,
      },
      data: { leida: true },
    });
    revalidatePath("/dashboard");
    return { success: true };
  });
```

### Email Digest HTML Template (Skeleton)
```typescript
// Follows the inline HTML pattern from src/lib/auth.ts emailVerification
export function buildDigestHtml(
  userName: string,
  obligations: { impuesto: string; fechaVencimiento: string; daysLeft: number }[]
): string {
  const rows = obligations
    .map(
      (ob) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${ob.impuesto}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${ob.fechaVencimiento}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${ob.daysLeft} dias</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111827;">Calendario Tributario</h2>
      <p>Hola ${userName},</p>
      <p>Tienes obligaciones tributarias proximas a vencer:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 8px 12px; text-align: left; font-size: 14px;">Impuesto</th>
            <th style="padding: 8px 12px; text-align: left; font-size: 14px;">Fecha limite</th>
            <th style="padding: 8px 12px; text-align: left; font-size: 14px;">Dias restantes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://calendario-tributario.vercel.app"}/dashboard"
         style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
        Ver en dashboard
      </a>
      <p style="color: #6b7280; font-size: 14px;">Este es un recordatorio automatico de Calendario Tributario.</p>
    </div>
  `;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External cron services (cron-job.org) | Vercel native Cron Jobs | 2023+ | No external dependency; CRON_SECRET auto-injected |
| SendGrid/Mailgun | Resend | 2023+ | Simpler API; batch.send() for bulk; already in project |
| Custom email templates (MJML, etc.) | Inline HTML strings | Project convention | Consistent with auth.ts pattern; avoid build-time template compilation |
| Polling for notifications | Server actions + revalidation | Next.js App Router pattern | No WebSocket complexity; revalidatePath on mutations |

**Deprecated/outdated:**
- `next/server` `NextResponse.json()`: For TypeScript 5.2+ (project uses TS 5.x), use `Response.json()` directly.

## Open Questions

1. **Middleware exclusion for cron route**
   - What we know: The project has auth middleware. Cron routes must not be redirected.
   - What's unclear: The exact middleware matcher pattern -- need to verify it excludes `/api/cron/*`.
   - Recommendation: Check existing middleware.ts and add `/api/cron/:path*` to the public routes matcher if needed.

2. **Hobby plan vs Pro plan for cron precision**
   - What we know: Hobby plan limits crons to once/day with up to 59-minute timing variance. Pro plan gives per-minute precision.
   - What's unclear: Which Vercel plan the project is on.
   - Recommendation: Design for Hobby plan constraints (once daily is sufficient). Accept timing variance. If on Pro, timing will be precise.

3. **Email batch size beyond 100 users**
   - What we know: `resend.batch.send()` accepts max 100 emails per call. Free tier allows 100 emails/day.
   - What's unclear: Expected user count at launch.
   - Recommendation: Implement chunking logic (split into groups of 100) as a defensive pattern, even if v1 has few users. Log batch results for monitoring.

4. **NEXT_PUBLIC_APP_URL for email CTA links**
   - What we know: Email digest needs a "Ver en dashboard" link. The app URL varies per environment.
   - What's unclear: Whether `NEXT_PUBLIC_APP_URL` env var is already set.
   - Recommendation: Use `NEXT_PUBLIC_APP_URL` env var with a fallback to the Vercel deployment URL. Add to `.env.example` if it doesn't exist.

## Sources

### Primary (HIGH confidence)
- [Vercel Cron Jobs docs](https://vercel.com/docs/cron-jobs) - Configuration format, cron expressions, UTC timezone
- [Vercel Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs) - CRON_SECRET auth pattern, duration limits, idempotency guidance, error handling (no retries)
- [Vercel Cron Jobs Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) - Hobby: 100 crons/project, once/day, hourly precision; Pro: once/minute, per-minute precision
- [Resend batch.send() API](https://resend.com/docs/api-reference/emails/send-batch-emails) - Up to 100 emails per batch call; SDK v6.9.2 confirmed `Batch.send()` method
- Resend SDK v6.9.2 installed - Verified `batch.send()` exists in `node_modules/resend/dist/index.d.cts`
- Project codebase analysis - NavBar, AppShell, auth.ts Resend instance, obligation-helpers.ts, dates.ts, markAsPaid action

### Secondary (MEDIUM confidence)
- [Resend Send with Next.js](https://resend.com/docs/send-with-nextjs) - Rate limit: 2 requests/second, free tier 100/day and 3,000/month
- [Prisma @@unique docs](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints) - Compound unique constraints supported on MongoDB

### Tertiary (LOW confidence)
- Vercel Hobby plan function maxDuration: sources indicate 60s default, up to 300s with Fluid Compute. Exact current limits should be verified against latest Vercel docs or dashboard settings.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use; no new dependencies
- Architecture: HIGH - Patterns directly derived from existing codebase (auth.ts, obligation actions, NavBar) and verified Vercel/Resend docs
- Pitfalls: HIGH - Based on official documentation (cron timing, redirects, no retries) and project-specific analysis (middleware, NavBar client component)

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days - stable platform, no fast-moving dependencies)
