# Phase 3: Dashboard & Calendar - Research

**Researched:** 2026-03-02
**Domain:** Dashboard UI (calendar grid, data table, server actions, optimistic updates)
**Confidence:** HIGH

## Summary

Phase 3 builds the primary user-facing screen: a single scrolling dashboard with summary cards, a monthly calendar grid with obligation dots, and a filterable/sortable obligations table. The user can mark obligations as paid via a confirmation dialog. All data is already in MongoDB via the matching engine (Phase 2) -- this phase is purely about querying, displaying, and updating `ObligacionTributaria` records.

The project already has date-fns v4, @date-fns/tz, shadcn/ui components (Card, Badge, Button, Dialog, Select, Popover, Separator), Sonner for toasts, next-safe-action for type-safe server actions, and a Colombia timezone utility layer. The calendar grid should be built custom using date-fns functions (not react-day-picker, which has React 19 / date-fns v4 compatibility issues). The table should use the shadcn Table primitive (not TanStack Table -- the dataset is small, ~50-150 obligations max). The "mark as paid" action should use next-safe-action with `useAction` + `revalidatePath` for immediate UI refresh.

**Primary recommendation:** Build a custom month-grid calendar with date-fns + Tailwind CSS grid, use shadcn Table for the obligations list, and use next-safe-action `useAction` hook with `revalidatePath("/dashboard")` for the mark-as-paid mutation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Traditional **month grid** layout (7-column, day cells)
- Obligations shown as **colored dots** inside day cells (one dot per obligation, color = status)
- Clicking a day with obligations opens a **popover** on the cell showing obligation list with status, tax name, and quick "mark paid" action
- Month navigation via **arrow buttons + month/year label** (< Marzo 2026 >) with a "Hoy" button to jump back to current month
- Single scrolling page: **summary cards on top -> calendar -> obligations table**
- **4 summary cards** in a row: Este mes (count), Vencidas (overdue count, red), Proxima fecha (next deadline date + tax name), Pagadas este mes (count)
- Cards are **clickable** -- clicking filters the obligations table below
- Mobile: cards display in a **2x2 grid**
- Table columns: **Impuesto, Periodo, Fecha, Estado, Accion**
- **Inline filter row** above table with dropdowns for Estado, Impuesto, and Periodo (shadcn Select components)
- Default sort: **fecha ascending** (soonest first). Sortable columns: Fecha and Estado (clickable headers toggle asc/desc)
- "Marcar pagado" button in each row -> **confirmation dialog** with date picker for payment date (shadcn Dialog)
- Status colors: **PENDIENTE** = blue, **PROXIMO** = yellow/amber, **VENCIDO** = red, **PAGADO** = green
- PROXIMO threshold: **7 days** before due date
- **Paid obligations remain visible** with green styling (filterable)
- Empty states: monthly "No tienes obligaciones para este mes", no obligations "Completa tu perfil para ver tus obligaciones" with link to profile
- Linear-inspired clean aesthetic -- generous whitespace, subtle borders, blue palette anchor

### Claude's Discretion
- Calendar grid component implementation approach (custom vs library)
- Exact dot sizing and spacing in calendar cells
- Popover positioning and animation
- Loading skeletons for calendar and table
- Table pagination approach (if needed for many obligations)
- Exact shadcn color shades for status badges
- Mobile calendar cell sizing and touch targets

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Monthly calendar view with color-coded obligations by status | Custom calendar grid using date-fns v4 (startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek) + Tailwind CSS grid. Status colors via Tailwind utility classes. Popover from shadcn for day detail. |
| DASH-02 | Obligations table with filters (status, tax type, period) and sorting | shadcn Table primitive + client-side filtering/sorting via React state. Select components for filters. No TanStack Table needed (small dataset). |
| DASH-03 | Dashboard summary cards (due this month, overdue, next deadline) | Server Component data fetching with Prisma aggregation queries. shadcn Card components with clickable behavior to filter table. |
| DASH-04 | User can mark obligation as paid with timestamp | Server action via next-safe-action with Zod schema validation. Dialog with date picker for payment date. revalidatePath("/dashboard") for immediate refresh. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | 4.1.0 | Calendar date math (startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, format, startOfWeek, endOfWeek) | Already installed; provides all calendar grid utilities |
| @date-fns/tz | 1.4.1 | Colombia timezone (TZDate) for accurate "today" calculation | Already installed; project has `nowColombia()` utility |
| next-safe-action | 8.1.4 | Type-safe server actions with Zod validation | Already installed; established pattern in onboarding actions |
| radix-ui | 1.4.3 | Underlying primitives for shadcn components (Popover, Dialog, Select) | Already installed |
| sonner | 2.0.7 | Toast notifications for action feedback | Already installed; used in onboarding wizard |
| zod | 4.3.6 | Schema validation for mark-as-paid action input | Already installed |
| lucide-react | 0.575.0 | Icons (ChevronLeft, ChevronRight, Check, Calendar, AlertTriangle, etc.) | Already installed |

### Supporting (need to install via shadcn CLI)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Table | (CLI) | Styled table components (Table, TableHeader, TableBody, TableRow, TableHead, TableCell) | For the obligations table; simpler than TanStack for small datasets |
| shadcn Skeleton | (CLI) | Loading placeholder UI | For calendar and table loading states |
| shadcn Tooltip | (CLI) | Optional: tooltips on calendar dots for quick status info | If hover behavior desired on desktop |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom calendar grid | react-day-picker (shadcn Calendar) | react-day-picker v8 incompatible with React 19; v9 breaks shadcn Calendar component. Custom grid with date-fns is simpler and avoids dependency issues. |
| shadcn Table (HTML) | TanStack Table (headless) | TanStack adds ~15KB for features (virtual scroll, column pinning) this project doesn't need. ~50-150 obligations total -- client-side sort/filter is trivial. |
| useAction hook | Direct server action call (current pattern) | Either works. useAction provides isExecuting state automatically; direct call with useTransition is the existing pattern. Either is fine -- recommend useAction for consistency with mark-as-paid UX. |

**Installation:**
```bash
npx shadcn@latest add table skeleton tooltip
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(app)/dashboard/
│   └── page.tsx                    # Server Component: fetches data, renders layout
├── components/dashboard/
│   ├── summary-cards.tsx           # Client: 4 cards with click-to-filter
│   ├── calendar-grid.tsx           # Client: month grid with dots + navigation
│   ├── calendar-day-cell.tsx       # Client: single day cell with dots + popover
│   ├── obligations-table.tsx       # Client: filterable/sortable table
│   ├── mark-paid-dialog.tsx        # Client: confirmation dialog with date picker
│   ├── obligation-status-badge.tsx # Shared: colored badge per status
│   └── empty-state.tsx             # Shared: empty state messages
├── lib/
│   ├── actions/
│   │   └── obligations.ts          # Server: markAsPaid action
│   ├── queries/
│   │   └── dashboard.ts            # Server: data fetching functions
│   └── utils/
│       └── obligation-helpers.ts   # Shared: status computation, color maps
```

### Pattern 1: Server Component Data Fetching + Client Component Display
**What:** Dashboard page.tsx is a Server Component that fetches all obligation data via Prisma, then passes serialized data as props to client components for interactivity.
**When to use:** Always for this dashboard -- data must be fresh on each load.
**Example:**
```typescript
// src/app/(app)/dashboard/page.tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CalendarGrid } from "@/components/dashboard/calendar-grid";
import { ObligationsTable } from "@/components/dashboard/obligations-table";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const empresa = await prisma.empresa.findUnique({
    where: { userId: session!.user.id },
    include: {
      obligaciones: {
        orderBy: { fechaVencimiento: "asc" },
      },
    },
  });

  // Serialize dates for client components
  const obligations = empresa!.obligaciones.map((o) => ({
    id: o.id,
    impuesto: o.impuesto,
    periodo: o.periodo,
    fechaVencimiento: o.fechaVencimiento.toISOString(),
    estado: o.estado,
    fechaPago: o.fechaPago?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-8">
      <SummaryCards obligations={obligations} />
      <CalendarGrid obligations={obligations} />
      <ObligationsTable obligations={obligations} />
    </div>
  );
}
```

### Pattern 2: Custom Calendar Grid with date-fns
**What:** Build a 7-column CSS grid for a month view using date-fns utilities. Each cell shows day number + colored dots for obligations on that day.
**When to use:** For the calendar visualization (DASH-01).
**Example:**
```typescript
// Calendar grid day generation
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format,
  addMonths, subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

function getCalendarDays(currentMonth: Date): Date[] {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  // Extend to full weeks (Monday start for Colombia)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: calStart, end: calEnd });
}

// Usage in component:
// <div className="grid grid-cols-7 gap-px bg-border">
//   {days.map(day => <DayCell key={day.toISOString()} ... />)}
// </div>
```

### Pattern 3: Client-Side Filtering with URL-Independent State
**What:** Summary card clicks and filter dropdowns update React state (not URL params) to filter the obligations table. This keeps the single-page scroll UX simple.
**When to use:** For DASH-02 and DASH-03 interaction.
**Example:**
```typescript
// In a parent client component wrapping both cards and table
const [filters, setFilters] = useState<{
  estado?: string;
  impuesto?: string;
  periodo?: string;
}>({});

// Card click handler
function handleCardClick(filterType: string) {
  if (filterType === "vencidas") {
    setFilters({ estado: "VENCIDO" });
  }
  // ... etc
}

// Apply filters to obligations
const filtered = obligations.filter((o) => {
  if (filters.estado && o.estado !== filters.estado) return false;
  if (filters.impuesto && o.impuesto !== filters.impuesto) return false;
  if (filters.periodo && o.periodo !== filters.periodo) return false;
  return true;
});
```

### Pattern 4: Mark as Paid Server Action with revalidatePath
**What:** Server action updates a single ObligacionTributaria record's estado to "PAGADO" and sets fechaPago, then calls revalidatePath to refresh the dashboard.
**When to use:** For DASH-04.
**Example:**
```typescript
// src/lib/actions/obligations.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const markPaidSchema = z.object({
  obligacionId: z.string().min(1),
  fechaPago: z.string().datetime(), // ISO string from date picker
});

export const markAsPaid = authedAction
  .schema(markPaidSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Verify ownership
    const obligacion = await prisma.obligacionTributaria.findFirst({
      where: {
        id: parsedInput.obligacionId,
        empresa: { userId: ctx.userId },
      },
    });
    if (!obligacion) throw new Error("Obligacion no encontrada");
    if (obligacion.estado === "PAGADO") throw new Error("Ya esta marcada como pagada");

    await prisma.obligacionTributaria.update({
      where: { id: obligacion.id },
      data: {
        estado: "PAGADO",
        fechaPago: new Date(parsedInput.fechaPago),
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  });
```

### Anti-Patterns to Avoid
- **Fetching obligations per-cell in the calendar:** Fetch ALL obligations once in the Server Component and pass them down. Do not make N queries for N calendar days.
- **Using react-day-picker / shadcn Calendar component:** Incompatible with React 19 + date-fns v4 combination. Build the grid custom.
- **Storing filter state in URL search params:** Overengineered for a single-page scroll layout. Use React state. URL params add complexity without benefit here.
- **Using TanStack Table for <200 rows:** Adds dependency weight and API complexity for zero performance benefit at this scale.
- **Calling `new Date()` directly for "today":** Must use `nowColombia()` from `src/lib/utils/dates.ts` to ensure Colombia timezone accuracy (UTC-5).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timezone-aware "today" | Custom timezone logic | `nowColombia()` from `src/lib/utils/dates.ts` | Already built; uses @date-fns/tz TZDate |
| Date formatting in Spanish | Custom locale code | `formatDateColombia()` from `src/lib/utils/dates.ts` | Already built; uses date-fns `es` locale |
| Days until deadline | Manual date math | `daysUntilDeadline()` from `src/lib/utils/dates.ts` | Already built; handles timezone correctly |
| Dialog with overlay/animation | Custom modal | shadcn Dialog component (already installed) | Handles focus trap, escape key, overlay, animations |
| Dropdown filters | Custom dropdown | shadcn Select component (already installed) | Handles keyboard nav, scroll, positioning |
| Popover on calendar cell | Custom positioning | shadcn Popover component (already installed) | Handles portal, positioning, click-outside, animations |
| Toast feedback | Custom notification | Sonner (already installed) | Used throughout project; `toast.success()` / `toast.error()` |
| Status color mapping | Inline conditionals everywhere | Centralized `STATUS_CONFIG` constant map | Single source of truth for colors, labels, dot colors |

**Key insight:** The project already has a rich utility layer (dates, shadcn components, next-safe-action). Phase 3 is an assembly phase -- the hard work is composing existing pieces into a cohesive dashboard, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Date Serialization Across Server/Client Boundary
**What goes wrong:** Prisma returns `Date` objects, but React Server Components cannot serialize `Date` directly to client components. The page crashes with "Only plain objects, and a few built-ins, can be passed to Client Components."
**Why it happens:** Next.js serializes props as JSON when passing from Server to Client components. `Date` is not a plain object.
**How to avoid:** Convert all dates to ISO strings (`toISOString()`) in the Server Component before passing as props. Parse back with `new Date(isoString)` in client components only when needed for date-fns operations.
**Warning signs:** Runtime error mentioning "cannot be serialized" or "only plain objects."

### Pitfall 2: Timezone Mismatch Between Server and Client
**What goes wrong:** Calendar shows "today" based on the server's timezone (UTC in production) or the user's browser timezone, not Colombia time. Obligations appear on wrong days.
**Why it happens:** `new Date()` uses local timezone. Server in Vercel runs UTC. User could be abroad.
**How to avoid:** Always use `nowColombia()` for "today" calculations. For calendar grid, use `TZDate` from @date-fns/tz when determining which day is "today." Pass the Colombia "today" ISO string from server to client as a prop if needed.
**Warning signs:** "Today" highlight on wrong day; status calculations show wrong day count.

### Pitfall 3: Status Not Matching Database Values
**What goes wrong:** Frontend uses "pendiente" (lowercase) or "Pendiente" but database stores "PENDIENTE" (uppercase). Filters and color coding break silently.
**Why it happens:** The `estado` field is a string (not a Prisma enum -- MongoDB limitation). Easy to introduce typos.
**How to avoid:** Define a single `OBLIGATION_STATUS` constant with all valid values and use it everywhere. Type the status as a union literal: `type ObligationStatus = "PENDIENTE" | "PROXIMO" | "VENCIDO" | "PAGADO"`.
**Warning signs:** Filters return zero results; badges show wrong color or default color.

### Pitfall 4: Popover Positioning on Calendar Edge Cells
**What goes wrong:** Popovers on the right-most calendar column overflow the viewport. Popovers on the first/last row clip at top/bottom.
**Why it happens:** Radix Popover positions relative to trigger; calendar cells at edges are near viewport boundary.
**How to avoid:** Use Radix Popover's `side="top"` or `side="bottom"` with `align="start"` / `align="end"` depending on cell position. Radix handles collision detection automatically via `avoidCollisions={true}` (default). Just ensure `collisionPadding` is set (e.g., `collisionPadding={8}`).
**Warning signs:** Popover content cut off or jumping position unexpectedly.

### Pitfall 5: Missing Toaster in App Layout
**What goes wrong:** `toast.success()` and `toast.error()` calls in dashboard components produce no visible toast.
**Why it happens:** The `<Toaster>` component from Sonner is only in the `(onboarding)` layout, NOT in the `(app)` layout. Toast calls fire silently with no render target.
**How to avoid:** Add `<Toaster richColors position="top-right" />` to the `(app)` layout (`src/app/(app)/layout.tsx`) or to the root layout (`src/app/layout.tsx`).
**Warning signs:** Server action completes but user sees no feedback; only discoverable via browser console.

### Pitfall 6: Calendar Week Start Day
**What goes wrong:** Calendar grid starts on Sunday (date-fns default) instead of Monday, confusing Colombian users who expect Monday-start weeks.
**Why it happens:** `startOfWeek()` defaults to `weekStartsOn: 0` (Sunday).
**How to avoid:** Always pass `{ weekStartsOn: 1 }` to `startOfWeek()` and `endOfWeek()`. Colombia uses Monday as first day of week (ISO standard).
**Warning signs:** Calendar header shows "Dom" first; days appear shifted by one column.

## Code Examples

### Status Configuration Map
```typescript
// src/lib/utils/obligation-helpers.ts
export type ObligationStatus = "PENDIENTE" | "PROXIMO" | "VENCIDO" | "PAGADO";

export const STATUS_CONFIG: Record<
  ObligationStatus,
  { label: string; dotColor: string; badgeClass: string; textClass: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    dotColor: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    textClass: "text-blue-600",
  },
  PROXIMO: {
    label: "Proximo",
    dotColor: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    textClass: "text-amber-600",
  },
  VENCIDO: {
    label: "Vencido",
    dotColor: "bg-red-500",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    textClass: "text-red-600",
  },
  PAGADO: {
    label: "Pagado",
    dotColor: "bg-green-500",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
    textClass: "text-green-600",
  },
};
```

### Dynamic Status Computation
```typescript
// Compute display status from DB status + due date
// DB stores PENDIENTE; we derive PROXIMO client-side based on 7-day threshold
import { daysUntilDeadline } from "@/lib/utils/dates";

export function computeDisplayStatus(
  dbStatus: string,
  fechaVencimiento: string, // ISO string
): ObligationStatus {
  if (dbStatus === "PAGADO") return "PAGADO";
  if (dbStatus === "VENCIDO") return "VENCIDO";

  const daysLeft = daysUntilDeadline(new Date(fechaVencimiento));
  if (daysLeft < 0) return "VENCIDO";
  if (daysLeft <= 7) return "PROXIMO";
  return "PENDIENTE";
}
```

### Calendar Grid Component Skeleton
```typescript
// src/components/dashboard/calendar-grid.tsx
"use client";

import { useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, format, isSameMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEK_DAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

interface CalendarGridProps {
  obligations: SerializedObligation[];
  todayIso: string; // Colombia "today" from server
}

export function CalendarGrid({ obligations, todayIso }: CalendarGridProps) {
  const today = new Date(todayIso);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="rounded-lg border bg-white">
      {/* Header: nav arrows + month label + Hoy button */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(startOfMonth(today))}>
            Hoy
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            isCurrentMonth={isSameMonth(day, currentMonth)}
            obligations={obligationsForDay(obligations, day)}
            isToday={isSameDay(day, today)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Obligations Table with Inline Filters
```typescript
// Pattern for sortable columns (client-side)
type SortField = "fechaVencimiento" | "estado";
type SortDir = "asc" | "desc";

const [sortField, setSortField] = useState<SortField>("fechaVencimiento");
const [sortDir, setSortDir] = useState<SortDir>("asc");

function toggleSort(field: SortField) {
  if (sortField === field) {
    setSortDir(sortDir === "asc" ? "desc" : "asc");
  } else {
    setSortField(field);
    setSortDir("asc");
  }
}

const sorted = [...filtered].sort((a, b) => {
  const mult = sortDir === "asc" ? 1 : -1;
  if (sortField === "fechaVencimiento") {
    return mult * (new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
  }
  // Status sort: VENCIDO > PROXIMO > PENDIENTE > PAGADO
  const statusOrder = { VENCIDO: 0, PROXIMO: 1, PENDIENTE: 2, PAGADO: 3 };
  return mult * ((statusOrder[a.displayStatus] ?? 99) - (statusOrder[b.displayStatus] ?? 99));
});
```

### Mark as Paid Dialog Integration
```typescript
// Client component using useAction from next-safe-action
"use client";

import { useAction } from "next-safe-action/hooks";
import { markAsPaid } from "@/lib/actions/obligations";
import { toast } from "sonner";

function MarkPaidDialog({ obligationId, onClose }) {
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0]);

  const { execute, isExecuting } = useAction(markAsPaid, {
    onSuccess: () => {
      toast.success("Obligacion marcada como pagada");
      onClose();
    },
    onError: (error) => {
      toast.error(error.serverError ?? "Error al marcar como pagada");
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como pagada</DialogTitle>
          <DialogDescription>Selecciona la fecha de pago</DialogDescription>
        </DialogHeader>
        {/* Date input */}
        <input
          type="date"
          value={fechaPago}
          onChange={(e) => setFechaPago(e.target.value)}
          className="..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => execute({ obligacionId, fechaPago: new Date(fechaPago).toISOString() })}
            disabled={isExecuting}
          >
            {isExecuting ? "Guardando..." : "Confirmar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-day-picker v8 + shadcn Calendar | Custom grid with date-fns OR react-day-picker v9 (manual integration) | Late 2024 / early 2025 | shadcn Calendar broken with React 19; custom grid avoids dependency |
| TanStack Table for all tables | shadcn Table for small datasets, TanStack for large/complex | Ongoing | Simpler code for < 200 rows |
| useOptimistic (React 19) | useAction/useOptimisticAction (next-safe-action) | 2025 | next-safe-action wraps React hooks with type safety and callbacks |
| revalidatePath (full route) | revalidatePath + revalidateTag (granular) | Next.js 15 | revalidatePath still invalidates full client Router Cache in v15 |

**Deprecated/outdated:**
- react-day-picker v8: Incompatible with React 19 peer dependencies. Use v9 or custom grid.
- date-fns v2/v3: Project uses v4 with ESM-only imports. Do not use v2-style `require`.

## Open Questions

1. **Status progression timing**
   - What we know: Phase 5 (NOTF-03) will handle automatic PENDIENTE -> PROXIMO -> VENCIDO progression via daily cron.
   - What's unclear: Should Phase 3 compute display status dynamically (client-side based on days until deadline) or rely solely on DB `estado` field?
   - Recommendation: Compute display status client-side using `computeDisplayStatus()` so the calendar shows accurate colors even if the cron hasn't run yet. This makes the UI self-correcting without waiting for Phase 5.

2. **Date picker for payment date**
   - What we know: User needs to select a payment date when marking as paid.
   - What's unclear: Should we use a native HTML `<input type="date">` or a custom date picker component?
   - Recommendation: Use native `<input type="date">` inside the Dialog. It works well on both desktop and mobile, requires no additional dependencies, and is the simplest approach. The shadcn Calendar component (react-day-picker) has compatibility issues with React 19.

3. **Obligation count per empresa**
   - What we know: Matching engine generates obligations for ~9 tax types x 1-12 periods = up to ~100-150 records.
   - What's unclear: Could this grow significantly?
   - Recommendation: No pagination needed for v1. If future phases add multi-year data, revisit. Current approach (fetch all, filter client-side) is appropriate.

## Sources

### Primary (HIGH confidence)
- Project codebase analysis: `prisma/schema.prisma`, `src/lib/actions/onboarding.ts`, `src/lib/services/matching-engine.ts`, `src/lib/utils/dates.ts`, `src/components/ui/*.tsx` -- all patterns verified directly
- [Next.js official docs - revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) -- revalidation pattern
- [Next.js official docs - Updating Data](https://nextjs.org/docs/app/getting-started/updating-data) -- server actions pattern
- [next-safe-action docs - useAction](https://next-safe-action.dev/docs/execute-actions/hooks/useaction) -- hook API
- [next-safe-action docs - useOptimisticAction](https://next-safe-action.dev/docs/execute-actions/hooks/useoptimisticaction) -- optimistic update API
- [date-fns official site](https://date-fns.org/) -- v4 function references

### Secondary (MEDIUM confidence)
- [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/radix/calendar) -- confirms react-day-picker dependency
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table) -- TanStack Table pattern reference
- [React DayPicker - Custom Components](https://daypicker.dev/guides/custom-components) -- DayButton/Day customization API
- [Building a calendar with Tailwind and date-fns](https://dev.to/vivekalhat/building-a-calendar-component-with-tailwind-and-date-fns-2c0i) -- custom grid pattern
- [shadcn-ui/ui Issue #7258](https://github.com/shadcn-ui/ui/issues/7258) -- React 19 / react-day-picker v8 incompatibility confirmed
- [shadcn-ui/ui Discussion #6452](https://github.com/shadcn-ui/ui/discussions/6452) -- Calendar update discussion

### Tertiary (LOW confidence)
- None -- all findings verified with official sources or codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and patterns established in codebase
- Architecture: HIGH -- follows existing project patterns (Server Components + Client Components, next-safe-action, Prisma queries)
- Pitfalls: HIGH -- verified through codebase analysis (Toaster missing, react-day-picker incompatibility confirmed via GitHub issues, date serialization is standard Next.js knowledge)

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable domain -- shadcn/date-fns/Next.js patterns unlikely to change in 30 days)
