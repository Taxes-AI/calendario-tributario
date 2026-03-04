# Phase 4: Profile Management & Sanctions - Research

**Researched:** 2026-03-03
**Domain:** Profile editing with obligation recalculation, Colombian tax penalty calculators (Art. 641/642 ET)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Profile Editing Flow
- Dedicated **/perfil** page under the existing sidebar nav item
- **Single form with grouped sections** (card-per-section): Datos Empresa, Regimen Tributario, Actividad Economica -- one save button at bottom
- All onboarding fields editable: tipoEmpresa, regimen, tamano, NIT, ciiu, ciudad, rangoIngresos
- **NIT is editable** but shows a prominent warning: "Cambiar el NIT recalculara todas tus fechas de vencimiento"
- **VENCIDO obligations preserved** during recalculation (like PAGADO) -- only PENDIENTE and PROXIMO are deleted and regenerated
- **Obligation stats summary** shown at top of profile page (e.g., "12 obligaciones activas, 2 pagadas") to give context before editing

#### Recalculation Feedback
- **Confirmation dialog before recalculating** -- only shown when tax-relevant fields change (regimen, tamano, nit, ciiu, ciudad, rangoIngresos)
- Dialog text: "Estos cambios recalcularan tus obligaciones. X obligaciones seran eliminadas, las pagadas y vencidas se conservan. Continuar?"
- Non-tax-relevant field changes (if any exist) save directly without confirmation
- **Summary toast with counts** after recalculation: "Obligaciones actualizadas: 5 eliminadas, 8 creadas, 2 pagadas conservadas"
- Dashboard reflects changes immediately via revalidatePath

#### Penalty Warnings
- **Inline on obligation table rows only** -- not on calendar popovers (keeps calendar clean)
- Warnings shown for both **PROXIMO** (approaching) and **VENCIDO** (overdue) obligations
- **Estimated amount only** in the table row: "Sancion est.: $1,250,000" with a link to the full calculator
- PROXIMO warnings show what would happen if the deadline is missed
- VENCIDO warnings show the current accumulated penalty

#### Sanctions Calculator
- **Dedicated /sanciones page** under the existing sidebar nav item
- **Obligation selector + calculator card** layout: dropdown at top to pick an obligation, calculator below
- Calculator pre-selects the obligation if navigated from the table row penalty link
- **Step-by-step formula breakdown** (educational/transparent):
  1. Base: impuesto a cargo (user-input field, not stored)
  2. Tasa: 5% x N meses de extemporaneidad (Art. 641 ET)
  3. Subtotal
  4. Minimo: 10 UVT ($523,740 for 2026)
  5. Interes moratorio
  6. Total estimado
- **User inputs the base amount** (impuesto a cargo) per-calculation -- avoids storing sensitive financial data
- **Legal disclaimer** prominently displayed: "Este calculo es una estimacion. Consulte con un contador publico para valores oficiales."

### Claude's Discretion
- Exact form field components and validation UX
- Profile page responsive layout for mobile
- Penalty warning badge/text styling in table rows
- Sanctions page empty state (when no PROXIMO/VENCIDO obligations exist)
- Moratory interest rate approach (fixed approximation per Out of Scope constraint)
- Loading states and skeleton patterns
- How to link from table row penalty amount to /sanciones page with pre-selected obligation

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | User can edit business profile (regime, size, city, NIT) | Profile form pattern, reuse of onboarding schemas/field options, updateProfile server action already exists |
| PROF-02 | Profile changes trigger obligation recalculation (preserving PAGADO records) | recalculateObligaciones() already exists; needs update to also preserve VENCIDO; confirmation dialog pattern; summary toast pattern |
| SANC-01 | Penalty warning displayed before approaching deadlines (what could happen) | Art. 641 ET formula research, computeDisplayStatus + daysUntilDeadline utilities, inline table penalty column pattern |
| SANC-02 | Penalty calculator for missed deadlines using Art. 641/642 formulas with legal disclaimer | Complete Art. 641/642 formula breakdown, UVT_2026 constant, formatCOP utility, dedicated /sanciones page pattern |
</phase_requirements>

## Summary

Phase 4 consists of two distinct feature areas that share the existing obligation data model: (1) a profile editing page that reuses the onboarding field definitions and triggers obligation recalculation, and (2) a sanctions/penalty system with inline table warnings and a dedicated calculator page.

The codebase is exceptionally well-prepared for this phase. The `recalculateObligaciones()` function in `matching-engine.ts` already handles delete-and-regenerate with PAGADO preservation -- it needs only a one-line change to also preserve VENCIDO. The `updateProfile` server action in `onboarding.ts` already exists with full Zod validation and calls `recalculateObligaciones()`. The onboarding step components contain all the field options (REGIMEN_OPTIONS, TAMANO_OPTIONS, CIUDAD_OPTIONS, INCOME_BRACKETS, CIIU_CODES) that need to be reused in the profile form. All UI primitives (Card, Dialog, Select, Command/Combobox, Toast via sonner) are already installed.

The sanctions calculator is a pure client-side computation based on Art. 641 of the Colombian Estatuto Tributario. The formula is straightforward: 5% of impuesto a cargo per month (or fraction) of lateness, with a floor of 10 UVT ($523,740 for 2026) and a cap of 100% of impuesto a cargo. Moratory interest uses a fixed approximate rate per the project's Out of Scope constraint (no real-time Superfinanciera rate). The calculator takes user-provided impuesto a cargo as input, avoiding storage of sensitive financial data.

**Primary recommendation:** Reuse existing updateProfile action and recalculateObligaciones function with minimal modifications (add VENCIDO preservation). Build the profile form by extracting field options from onboarding step components into shared constants. Build the penalty calculator as a pure client-side function with the Art. 641 formula.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.12 | App Router with Server/Client Components | Already in use; provides Server Components for data fetching, Client Components for forms |
| React | 19.1.0 | UI rendering | Already in use |
| Prisma | 6.19.2 | MongoDB ORM | Already in use; Empresa and ObligacionTributaria models ready |
| Zod | 4.3.6 | Schema validation | Already in use; existing onboarding schemas to extend |
| next-safe-action | 8.1.4 | Type-safe server actions | Already in use; updateProfile action exists |
| react-hook-form | 7.71.2 | Form state management | Already in use in onboarding steps |
| @hookform/resolvers | 5.2.2 | Zod resolver for react-hook-form | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast notifications | Recalculation success/error feedback |
| date-fns | 4.1.0 | Date calculations | Months-of-lateness computation for penalties |
| @date-fns/tz | 1.4.1 | Colombia timezone handling | All deadline calculations use Colombia time |
| lucide-react | 0.575.0 | Icons | Warning icons for penalty badges |
| shadcn/ui | Latest (CLI 3.8.5) | UI components | Card, Dialog, Select, Input, Command, Skeleton, Alert, Tooltip |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hook-form | Native form actions | RHF already used everywhere; switching would be inconsistent |
| Client-side penalty calc | Server action | No need -- formula is public knowledge, no secret data, avoids round-trip latency |

**Installation:**
```bash
# No new packages needed. All dependencies already installed.
# May need to add shadcn Alert component if not yet installed:
npx shadcn@latest add alert
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(app)/
│   ├── perfil/
│   │   └── page.tsx              # Server Component: fetch empresa, render ProfileClient
│   └── sanciones/
│       └── page.tsx              # Server Component: fetch obligations, render SancionesClient
├── components/
│   ├── profile/
│   │   ├── profile-client.tsx    # Client wrapper: form state, confirmation dialog
│   │   ├── profile-form.tsx      # Client: grouped form sections
│   │   └── obligation-stats.tsx  # Server or Client: stats summary at top
│   └── sanciones/
│       ├── sanciones-client.tsx  # Client wrapper: obligation selector + calculator
│       ├── penalty-calculator.tsx # Client: formula step-by-step breakdown
│       └── penalty-warning.tsx   # Client: inline badge for table rows
├── lib/
│   ├── actions/
│   │   └── onboarding.ts        # Already has updateProfile -- modify in place
│   ├── schemas/
│   │   └── profile.ts           # Profile edit schema (derived from onboarding schemas)
│   ├── services/
│   │   └── matching-engine.ts   # Modify recalculateObligaciones to preserve VENCIDO
│   └── utils/
│       ├── constants.ts          # UVT_2026 already exported
│       ├── currency.ts           # formatCOP already exported
│       └── sanctions.ts          # NEW: Pure penalty calculation functions
└── lib/data/
    └── field-options.ts          # NEW: Extracted shared field options from onboarding
```

### Pattern 1: Profile Form with Confirmation Dialog
**What:** Single form with grouped card sections. On submit, detect if tax-relevant fields changed. If so, show confirmation dialog with deletion count preview. If not, save directly.
**When to use:** Profile editing where changes have side effects (obligation recalculation).
**Example:**
```typescript
// Source: Established project pattern from mark-paid-dialog.tsx + onboarding actions
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/onboarding";
import { profileSchema, type ProfileFormData } from "@/lib/schemas/profile";

// Tax-relevant fields that trigger recalculation
const TAX_FIELDS: (keyof ProfileFormData)[] = [
  "regimen", "tamano", "nit", "ciiu", "ciudad", "rangoIngresos"
];

function hasTaxFieldChanged(
  original: ProfileFormData,
  updated: ProfileFormData
): boolean {
  return TAX_FIELDS.some((field) => original[field] !== updated[field]);
}

// In the component:
// 1. Compare form values vs original empresa data
// 2. If tax fields changed -> show confirmation dialog with preview counts
// 3. If only non-tax fields -> save directly
// 4. On confirm -> execute updateProfile action -> toast with counts
```

### Pattern 2: Pure Penalty Calculation Functions
**What:** Stateless utility functions that compute Art. 641 penalty amounts from inputs (impuesto a cargo, months overdue, UVT value). No DB calls, no side effects.
**When to use:** Both for inline table penalty estimates (using default impuesto amount = 0 to show minimum) and for the full calculator page (using user-provided impuesto a cargo).
**Example:**
```typescript
// Source: Art. 641 Estatuto Tributario Colombia
// File: src/lib/utils/sanctions.ts

import { UVT_2026 } from "./constants";

export interface PenaltyBreakdown {
  impuestoACargo: number;       // User-provided base
  mesesExtemporaneidad: number; // Months (or fraction) overdue
  tasaMensual: number;          // 0.05 (5%)
  subtotal: number;             // impuestoACargo * tasa * meses
  tope: number;                 // 100% of impuestoACargo
  minimoUVT: number;            // 10 * UVT_2026
  sancionBase: number;          // max(min(subtotal, tope), minimoUVT)
  interesMoratorio: number;     // Approximate moratory interest
  totalEstimado: number;        // sancionBase + interesMoratorio
}

export function calculatePenaltyArt641(
  impuestoACargo: number,
  diasExtemporaneidad: number,
): PenaltyBreakdown {
  const meses = Math.max(1, Math.ceil(diasExtemporaneidad / 30));
  const tasa = 0.05;
  const subtotal = impuestoACargo * tasa * meses;
  const tope = impuestoACargo; // 100% cap
  const minimoUVT = 10 * UVT_2026;

  // Art. 641: max of (calculated amount, 10 UVT minimum)
  // but capped at 100% of impuesto a cargo (when impuesto > 0)
  let sancionBase: number;
  if (impuestoACargo > 0) {
    sancionBase = Math.max(Math.min(subtotal, tope), minimoUVT);
  } else {
    sancionBase = minimoUVT; // When no impuesto a cargo, minimum applies
  }

  // Fixed approximate moratory interest (Out of Scope: no real-time rate)
  const TASA_MORATORIO_ANUAL_APROX = 0.27; // ~27% annual (conservative estimate)
  const interesMoratorio = impuestoACargo > 0
    ? impuestoACargo * (TASA_MORATORIO_ANUAL_APROX / 365) * diasExtemporaneidad
    : 0;

  return {
    impuestoACargo,
    mesesExtemporaneidad: meses,
    tasaMensual: tasa,
    subtotal,
    tope,
    minimoUVT,
    sancionBase,
    interesMoratorio: Math.round(interesMoratorio),
    totalEstimado: Math.round(sancionBase + interesMoratorio),
  };
}
```

### Pattern 3: URL-Based Obligation Pre-Selection
**What:** Use URL search params to link from the obligations table penalty badge to /sanciones with a pre-selected obligation.
**When to use:** Navigation from inline penalty warnings to the full calculator.
**Example:**
```typescript
// In obligations table row (penalty badge):
<Link href={`/sanciones?obligacion=${obligation.id}`}>
  Sancion est.: {formatCOP(estimatedPenalty)}
</Link>

// In /sanciones page (Server Component):
export default async function SancionesPage({
  searchParams,
}: {
  searchParams: Promise<{ obligacion?: string }>;
}) {
  const params = await searchParams;
  const preSelectedId = params.obligacion ?? null;
  // ... fetch obligations, pass preSelectedId to client
}
```

### Pattern 4: Shared Field Options (Extract from Onboarding)
**What:** Extract REGIMEN_OPTIONS, TAMANO_OPTIONS, CIUDAD_OPTIONS, INCOME_BRACKETS from onboarding step components into a shared data file that both onboarding and profile forms can import.
**When to use:** Whenever multiple components need the same option lists.
**Example:**
```typescript
// File: src/lib/data/field-options.ts
// Extracted from src/components/onboarding/step-regimen.tsx and step-actividad.tsx

export const REGIMEN_OPTIONS = [
  { value: "ORDINARIO", label: "Regimen Ordinario", description: "..." },
  { value: "SIMPLE", label: "Regimen Simple de Tributacion (RST)", description: "..." },
  { value: "ESPECIAL", label: "Regimen Tributario Especial (RTE)", description: "..." },
] as const;

export const TAMANO_OPTIONS = [...] as const;
export const CIUDAD_OPTIONS = [...] as const;
export const INCOME_BRACKETS = [...] as const;
export const TIPO_EMPRESA_OPTIONS = [...] as const;
// CIIU_CODES stay in their own file (large dataset)
```

### Anti-Patterns to Avoid
- **Duplicating field options:** Do NOT copy-paste REGIMEN_OPTIONS/TAMANO_OPTIONS into the profile component. Extract to shared file and import in both onboarding and profile.
- **Storing impuesto a cargo:** Do NOT add a field to the DB for the user's tax liability amount. This is sensitive financial data entered per-calculation only.
- **Server-side penalty calculation:** The formula is public knowledge with no secret data. Calculating server-side adds latency with zero security benefit. Keep it client-side for instant feedback.
- **Calendar popover penalties:** The user explicitly decided penalties appear only on the obligations table, not the calendar. Do not add penalty badges to calendar popovers.
- **Deleting VENCIDO obligations on recalculation:** The user decided VENCIDO must be preserved alongside PAGADO. The current `recalculateObligaciones()` only preserves PAGADO -- this must be updated.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management | Custom useState for each field | react-hook-form with zodResolver | Already used in onboarding; handles validation, dirty tracking, errors |
| Date difference calculation | Manual day/month math | date-fns differenceInCalendarMonths + differenceInDays | Handles edge cases (leap years, month boundaries, timezone) |
| Currency formatting | Template literals with toFixed | Intl.NumberFormat via formatCOP() | Already exists; handles Colombian peso format correctly |
| Toast notifications | Custom notification component | sonner (already in layout) | Already configured in (app) layout; richColors enabled |
| Confirmation dialogs | Custom modal | shadcn Dialog (already installed) | Established pattern from MarkPaidDialog |
| Combobox/search select | Custom dropdown | shadcn Command + Popover (already installed) | Used in onboarding for CIIU selector |

**Key insight:** This phase is primarily an assembly task. Nearly every piece -- server action, matching engine function, UI components, field options -- already exists and just needs to be wired together with a few modifications.

## Common Pitfalls

### Pitfall 1: VENCIDO Obligations Lost During Recalculation
**What goes wrong:** The current `recalculateObligaciones()` only preserves PAGADO. If deployed as-is, all VENCIDO obligations would be deleted when the user edits their profile.
**Why it happens:** The original function was written before the VENCIDO-preservation requirement was added in Phase 4 CONTEXT.md.
**How to avoid:** Update the `recalculateObligaciones()` function to query both PAGADO and VENCIDO records as the "preserve" set, and update the delete filter to only remove PENDIENTE and PROXIMO.
**Warning signs:** After profile edit, VENCIDO obligations disappear from dashboard.

### Pitfall 2: Months Calculation for Penalties
**What goes wrong:** Art. 641 counts "each month or fraction of month" -- so 1 day overdue = 1 month, 31 days overdue = 2 months. Using `Math.floor(days / 30)` would give 0 for 1-29 days.
**Why it happens:** Developers often divide by 30 and floor, but the tax code rounds UP (any fraction of a month counts as a full month).
**How to avoid:** Use `Math.ceil(diasExtemporaneidad / 30)` with a minimum of 1 month. Alternatively, use `differenceInCalendarMonths` from date-fns and add 1 if there are remaining days.
**Warning signs:** Penalty shows $0 for obligations that are 1-29 days overdue.

### Pitfall 3: Confirmation Dialog Preview Count Mismatch
**What goes wrong:** The confirmation dialog shows "X obligations will be deleted" but the actual recalculation deletes a different number, confusing the user.
**Why it happens:** The preview count is calculated before the save, but the actual delete count comes from the server action after save. Between these two moments, another tab could change data.
**How to avoid:** The preview count should be fetched from the server (count of PENDIENTE + PROXIMO) right before showing the dialog. The toast after recalculation shows the actual server-returned counts.
**Warning signs:** Dialog says "5 will be deleted" but toast says "3 deleted".

### Pitfall 4: NIT Change Without DV Recomputation
**What goes wrong:** User changes NIT in profile form but the digito de verificacion (DV) is not recomputed, leading to stale display values.
**Why it happens:** The existing `updateProfile` action already handles this (calls `validateNit` when NIT changes), but a custom implementation might forget.
**How to avoid:** Use the existing `updateProfile` server action which already computes DV on NIT change. Do not bypass it with a direct Prisma update.
**Warning signs:** NIT shows "900123456-3" but DV should be "7" after NIT change.

### Pitfall 5: Timezone Mismatch in Days-Overdue Calculation
**What goes wrong:** Penalty calculator shows wrong number of overdue days because it compares UTC dates instead of Colombia timezone dates.
**Why it happens:** `new Date()` in the browser uses local timezone, but deadline dates stored in DB are in UTC.
**How to avoid:** Use the existing `daysUntilDeadline()` from `@/lib/utils/dates.ts` which uses `nowColombia()` and `toColombia()` for correct timezone handling.
**Warning signs:** Penalty amounts change depending on user's browser timezone.

### Pitfall 6: Moratory Interest False Precision
**What goes wrong:** Calculator shows a precise moratory interest amount that implies it's the exact legal figure, when it's actually an approximation.
**Why it happens:** The project explicitly excludes real-time Superfinanciera interest rates (Out of Scope).
**How to avoid:** Use a clearly labeled fixed approximate rate (~27% annual, conservative). Show the rate used and note it's approximate. The legal disclaimer covers this.
**Warning signs:** Users citing the calculator amount to their accountant as an exact figure.

## Code Examples

Verified patterns from the existing codebase:

### Server Action with Authenticated Client (existing pattern)
```typescript
// Source: src/lib/actions/obligations.ts (existing)
const actionClient = createSafeActionClient();

const authedAction = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("No autenticado");
  return next({ ctx: { userId: session.user.id } });
});
```

### Calling Server Action from Client Component (existing pattern)
```typescript
// Source: src/components/dashboard/mark-paid-dialog.tsx (existing)
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

const { execute, isExecuting } = useAction(updateProfile, {
  onSuccess: (result) => {
    toast.success(
      `Obligaciones actualizadas: ${result.data?.deleted} eliminadas, ${result.data?.created} creadas, ${result.data?.preserved} conservadas`
    );
  },
  onError: (error) => {
    toast.error(error.error.serverError ?? "Error al actualizar perfil");
  },
});
```

### Server Component Data Fetching (existing pattern)
```typescript
// Source: src/app/(app)/dashboard/page.tsx (existing)
export default async function PerfilPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const empresa = await prisma.empresa.findUnique({
    where: { userId: session!.user.id },
  });
  // Pass to client component
  return <ProfileClient empresa={serializedEmpresa} />;
}
```

### Updated recalculateObligaciones with VENCIDO Preservation
```typescript
// Modified from: src/lib/services/matching-engine.ts
export async function recalculateObligaciones(empresa: Empresa) {
  // 1. Find existing PAGADO AND VENCIDO records to preserve
  const preserved = await prisma.obligacionTributaria.findMany({
    where: {
      empresaId: empresa.id,
      estado: { in: ["PAGADO", "VENCIDO"] }, // <-- ADD VENCIDO
    },
    select: { impuesto: true, periodo: true },
  });
  const preserveKeys = new Set(
    preserved.map((p) => `${p.impuesto}:${p.periodo}`),
  );

  // 2. Delete only PENDIENTE and PROXIMO (unchanged)
  const deleteResult = await prisma.obligacionTributaria.deleteMany({
    where: {
      empresaId: empresa.id,
      estado: { in: ["PENDIENTE", "PROXIMO"] },
    },
  });

  // 3. Re-run matching engine, skipping PAGADO+VENCIDO duplicates
  const { obligations, preserved: preservedCount } = await buildObligaciones(
    empresa,
    preserveKeys,  // <-- Now includes both PAGADO and VENCIDO keys
  );

  if (obligations.length > 0) {
    await prisma.obligacionTributaria.createMany({ data: obligations });
  }

  return {
    deleted: deleteResult.count,
    created: obligations.length,
    preserved: preservedCount,
  };
}
```

### Penalty Estimation for Table Row Inline Badge
```typescript
// For inline table display, estimate using minimum UVT floor
// (since we don't know impuesto a cargo for each obligation)
import { daysUntilDeadline } from "@/lib/utils/dates";
import { UVT_2026 } from "@/lib/utils/constants";
import { formatCOP } from "@/lib/utils/currency";

function getInlinePenaltyEstimate(fechaVencimiento: string): string | null {
  const days = daysUntilDeadline(new Date(fechaVencimiento));

  if (days > 7) return null; // PENDIENTE, no warning needed

  if (days > 0) {
    // PROXIMO: show what WOULD happen if missed
    return `Sancion min. si vence: ${formatCOP(10 * UVT_2026)}`;
  }

  // VENCIDO: show estimated penalty based on minimum
  const daysOverdue = Math.abs(days);
  const meses = Math.max(1, Math.ceil(daysOverdue / 30));
  // Minimum penalty is always 10 UVT regardless of months
  // (actual penalty depends on impuesto a cargo which we don't know)
  return `Sancion est. min.: ${formatCOP(10 * UVT_2026)}`;
}
```

## Colombian Tax Sanctions Reference (Art. 641/642 ET)

### Art. 641: Before Emplazamiento (DIAN Notice)

| Scenario | Rate | Per | Cap | Floor |
|----------|------|-----|-----|-------|
| With impuesto a cargo | 5% of impuesto a cargo | Month or fraction | 100% of impuesto a cargo | 10 UVT ($523,740) |
| No impuesto a cargo (with income) | 0.5% of gross income | Month or fraction | min(5% income, 2x saldo a favor, 2,500 UVT) | 10 UVT |
| No income (with patrimony) | 1% of prior-year net equity | Month or fraction | min(10% equity, 2x saldo a favor, 2,500 UVT) | 10 UVT |

### Art. 642: After Emplazamiento

| Scenario | Rate | Per | Cap | Floor |
|----------|------|-----|-----|-------|
| With impuesto a cargo | 10% of impuesto a cargo | Month or fraction | 200% of impuesto a cargo | 10 UVT |
| No impuesto a cargo (with income) | 1% of gross income | Month or fraction | min(10% income, 4x saldo a favor, 5,000 UVT) | 10 UVT |

### Calculator Scope for This Phase

Per the CONTEXT.md decisions, the calculator focuses on the **Art. 641 formula** (before emplazamiento), which is the most common scenario for self-filing taxpayers. Art. 642 (after emplazamiento) is an escalated scenario that requires DIAN action and is less relevant for proactive users.

**For this phase, implement only Art. 641:**
- Rate: 5% per month or fraction
- Cap: 100% of impuesto a cargo
- Floor: 10 UVT ($523,740 for 2026)
- Month counting: `Math.ceil(days_overdue / 30)`, minimum 1

### Moratory Interest Approximation

Per Out of Scope constraint ("Real-time Superfinanciera interest rate creates false precision and liability; use fixed approximate rate with disclaimer"):

- Art. 634/635 ET: moratory interest = usury rate - 2 points
- Usury rate fluctuates (set by Superintendencia Financiera monthly)
- **Fixed approximation for v1:** ~27% annual effective rate (conservative high estimate)
- Formula: `impuestoACargo * (0.27 / 365) * diasExtemporaneidad`
- Must be clearly labeled as approximate in the UI

### Key Constants
```typescript
export const UVT_2026 = 52374;  // Already in constants.ts
export const SANCION_MINIMA_UVT = 10;
export const SANCION_MINIMA_2026 = 10 * 52374; // $523,740
export const TASA_EXTEMPORANEIDAD_641 = 0.05;   // 5% per month
export const TOPE_EXTEMPORANEIDAD_641 = 1.0;    // 100% cap
export const TASA_MORATORIO_APROX = 0.27;       // ~27% annual (approximate)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| recalculate preserves only PAGADO | Must also preserve VENCIDO | Phase 4 decision | One-line change in matching-engine.ts |
| No penalty visibility | Inline penalty warnings + calculator | Phase 4 (new) | New UI components + pure calculation functions |
| Profile editing not available | /perfil page with recalculation | Phase 4 (new) | Reuses existing updateProfile action + onboarding fields |

**Already current (no changes needed):**
- UVT_2026 = 52374 (matches DIAN Resolution 000238 of 2025-12-15)
- next-safe-action v8 with useAction hook pattern
- react-hook-form v7 with zodResolver
- date-fns v4 with @date-fns/tz for Colombia timezone

## Open Questions

1. **Inline penalty for PROXIMO obligations: what amount to show?**
   - What we know: For VENCIDO, we can compute months overdue and show minimum (10 UVT). For PROXIMO, the obligation hasn't expired yet.
   - What's unclear: Should PROXIMO show "Sancion min. si vence: $523,740" (the 10 UVT floor) or try to estimate based on days until deadline?
   - Recommendation: Show the 10 UVT minimum for PROXIMO as a "what would happen" warning. The full calculator allows entering impuesto a cargo for a precise estimate.

2. **Confirmation dialog preview count: client or server?**
   - What we know: The dialog should show "X obligations will be deleted" before the user confirms.
   - What's unclear: Should this count come from a dedicated server query (accurate but adds latency) or from the client's current obligation data (fast but potentially stale)?
   - Recommendation: Use client-side count from the obligations already loaded on the profile page. Count obligations with status PENDIENTE or PROXIMO. This is fast and accurate enough since the user is looking at their own data.

3. **Profile form: single schema or composed from onboarding steps?**
   - What we know: Onboarding uses 4 separate step schemas. Profile needs all fields in one form.
   - What's unclear: Whether to create a new unified schema or compose existing step schemas.
   - Recommendation: Create a new `profileSchema` that imports the same enum/regex validators but defines a single flat object. The step schemas are optimized for wizard UX (separate submit per step), not for a single-form edit page.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis -- `src/lib/services/matching-engine.ts`, `src/lib/actions/onboarding.ts`, `src/lib/schemas/onboarding.ts`, `src/components/onboarding/`, `src/components/dashboard/`
- DIAN Resolution 000238 (2025-12-15) -- UVT 2026 = $52,374 (verified against `constants.ts`)
- [Art. 641 Estatuto Tributario](https://estatuto.co/641) -- Extemporaneidad formula (5% per month, 100% cap, 10 UVT min)
- [Art. 642 Estatuto Tributario](https://www.contadia.com/estatuto-tributario/articulo-642-extemporaneidad-en-la-presentacion-de-las-declaraciones-con-posterioridad-al-emplazamiento) -- Post-emplazamiento rates (10% per month, 200% cap)

### Secondary (MEDIUM confidence)
- [Gerencie.com - Sancion por Extemporaneidad](https://www.gerencie.com/sancion-por-extemporaneidad.html) -- Formula breakdown verified against official statute text
- [Siigo - Sancion por Extemporaneidad](https://www.siigo.com/blog/que-es-la-sancion-por-extemporaneidad/) -- Example calculations corroborating 5% formula
- [Gerencie.com - Interes Moratorio](https://www.gerencie.com/interes-moratorio-tributario.html) -- Art. 634/635 moratory interest formula

### Tertiary (LOW confidence)
- Moratory interest rate approximation (~27% annual) -- Based on historical usury rates; actual rate varies monthly. Explicitly marked as approximate per project Out of Scope constraint.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and in active use
- Architecture: HIGH -- Patterns directly observed from existing codebase; minimal new patterns
- Pitfalls: HIGH -- VENCIDO preservation gap directly visible in code; penalty formula verified against multiple sources
- Sanctions formula: HIGH -- Art. 641 verified across 3 independent Colombian tax sources
- Moratory interest rate: LOW -- Approximate fixed value; actual rate changes monthly

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days -- stable stack, UVT fixed for 2026, penalty formulas codified in statute)
