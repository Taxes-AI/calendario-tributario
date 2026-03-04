# Phase 4: Profile Management & Sanctions - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can edit their business profile and see obligations recalculated automatically, and can estimate late-filing penalties for any obligation. This phase delivers profile editing with smart recalculation (preserving paid/overdue history) and a penalty calculator using Art. 641/642 ET formulas. No notifications, no multi-client — those are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Profile Editing Flow
- Dedicated **/perfil** page under the existing sidebar nav item
- **Single form with grouped sections** (card-per-section): Datos Empresa, Regimen Tributario, Actividad Economica — one save button at bottom
- All onboarding fields editable: tipoEmpresa, regimen, tamano, NIT, ciiu, ciudad, rangoIngresos
- **NIT is editable** but shows a prominent warning: "Cambiar el NIT recalculará todas tus fechas de vencimiento"
- **VENCIDO obligations preserved** during recalculation (like PAGADO) — only PENDIENTE and PROXIMO are deleted and regenerated
- **Obligation stats summary** shown at top of profile page (e.g., "12 obligaciones activas, 2 pagadas") to give context before editing

### Recalculation Feedback
- **Confirmation dialog before recalculating** — only shown when tax-relevant fields change (regimen, tamano, nit, ciiu, ciudad, rangoIngresos)
- Dialog text: "Estos cambios recalcularán tus obligaciones. X obligaciones serán eliminadas, las pagadas y vencidas se conservan. ¿Continuar?"
- Non-tax-relevant field changes (if any exist) save directly without confirmation
- **Summary toast with counts** after recalculation: "Obligaciones actualizadas: 5 eliminadas, 8 creadas, 2 pagadas conservadas"
- Dashboard reflects changes immediately via revalidatePath

### Penalty Warnings
- **Inline on obligation table rows only** — not on calendar popovers (keeps calendar clean)
- Warnings shown for both **PROXIMO** (approaching) and **VENCIDO** (overdue) obligations
- **Estimated amount only** in the table row: "Sanción est.: $1,250,000" with a link to the full calculator
- PROXIMO warnings show what would happen if the deadline is missed
- VENCIDO warnings show the current accumulated penalty

### Sanctions Calculator
- **Dedicated /sanciones page** under the existing sidebar nav item
- **Obligation selector + calculator card** layout: dropdown at top to pick an obligation, calculator below
- Calculator pre-selects the obligation if navigated from the table row penalty link
- **Step-by-step formula breakdown** (educational/transparent):
  1. Base: impuesto a cargo (user-input field, not stored)
  2. Tasa: 5% × N meses de extemporaneidad (Art. 641 ET)
  3. Subtotal
  4. Mínimo: 10 UVT ($523,740 for 2026)
  5. Interés moratorio
  6. Total estimado
- **User inputs the base amount** (impuesto a cargo) per-calculation — avoids storing sensitive financial data
- **Legal disclaimer** prominently displayed: "Este cálculo es una estimación. Consulte con un contador público para valores oficiales."

### Claude's Discretion
- Exact form field components and validation UX
- Profile page responsive layout for mobile
- Penalty warning badge/text styling in table rows
- Sanctions page empty state (when no PROXIMO/VENCIDO obligations exist)
- Moratory interest rate approach (fixed approximation per Out of Scope constraint)
- Loading states and skeleton patterns
- How to link from table row penalty amount to /sanciones page with pre-selected obligation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- **recalculateObligaciones()** (`src/lib/services/matching-engine.ts`): Already handles delete-non-paid, preserve PAGADO, re-run matching. Returns `{ deleted, created, preserved }` counts. Needs update to also preserve VENCIDO.
- **Onboarding schemas** (`src/lib/schemas/onboarding.ts`): Zod schemas for all empresa fields — can be adapted for profile edit validation
- **Onboarding step components** (`src/components/onboarding/`): Reference for field options (regimen choices, tamano choices, CIIU selector, ciudad selector, rango ingresos) — patterns can be reused in profile form
- **UVT_2026 constant** (`src/lib/utils/constants.ts`): Already exported as 52374
- **shadcn/ui components**: Card, Dialog, Select, Button, Toast — all installed
- **markAsPaid server action** (`src/lib/actions/obligations.ts`): Pattern for ownership-validated mutations with revalidatePath

### Established Patterns
- Server Components for data fetching, Client Components for interactivity
- Server actions in `src/lib/actions/` for mutations
- Prisma queries via `@/lib/prisma` singleton
- `auth.api.getSession({ headers: await headers() })` for auth in server components
- `revalidatePath("/dashboard")` after data mutations
- Toast notifications via sonner (already in app layout)

### Integration Points
- **Sidebar nav**: Already has Perfil and Sanciones items — need to create `/perfil` and `/sanciones` routes
- **Empresa model**: Contains all profile fields, linked to User via userId
- **ObligacionTributaria model**: has empresaId, impuesto, periodo, fechaVencimiento, estado, fechaPago
- **Obligations table** (`src/components/dashboard/obligations-table.tsx`): Will need a new column or badge for penalty warnings
- **Dashboard page**: Will revalidate to show updated obligations after profile changes

</code_context>

<specifics>
## Specific Ideas

- Maintain the Linear-inspired clean aesthetic — profile page should feel like a settings page, not a complex form
- Penalty calculator should feel transparent and educational, not scary — users should understand exactly how the penalty is calculated
- Legal disclaimer is non-negotiable and must be prominent (not hidden in fine print)
- The inline penalty warnings on table rows should be subtle (small text, not alarm-style) — the full calculator page is where users go for details

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-profile-sanctions*
*Context gathered: 2026-03-03*
