---
phase: 01-foundation
plan: 01
subsystem: database, infra, ui
tags: [next.js, prisma, mongodb, tailwind, shadcn-ui, date-fns, zod, better-auth, typescript]

# Dependency graph
requires:
  - phase: none
    provides: "First plan - no dependencies"
provides:
  - "Next.js 15 project scaffolding with all Phase 1 dependencies"
  - "Prisma 6.19.2 schema with 8 models (4 auth + 4 seed data)"
  - "Prisma singleton client for Next.js hot reload safety"
  - "COP currency formatting utility (formatCOP)"
  - "Colombia timezone utilities (nowColombia, toColombia, formatDateColombia, daysUntilDeadline)"
  - "Shared constants (COLOMBIA_TZ, UVT_2026, APP_NAME)"
  - "Root layout with lang=es and Spanish metadata"
  - "shadcn/ui components: button, card, input, label, separator"
affects: [01-02-PLAN, 01-03-PLAN, 02-onboarding, 03-dashboard]

# Tech tracking
tech-stack:
  added: [next.js 15.5.12, react 19.1.0, prisma 6.19.2, better-auth 1.4.19, resend, date-fns 4.1.0, "@date-fns/tz", zod 4.3.6, react-hook-form 7.71.2, "@hookform/resolvers 5.2.2", lucide-react, shadcn-ui, tailwind-css 4, tw-animate-css]
  patterns: [prisma-singleton, cop-currency-formatter, colombia-timezone-utilities, mongodb-objectid-schema]

key-files:
  created:
    - calendario-tributario/prisma/schema.prisma
    - calendario-tributario/src/lib/prisma.ts
    - calendario-tributario/src/lib/utils/constants.ts
    - calendario-tributario/src/lib/utils/currency.ts
    - calendario-tributario/src/lib/utils/dates.ts
    - calendario-tributario/.env.example
    - calendario-tributario/prisma.config.ts
    - calendario-tributario/components.json
  modified:
    - calendario-tributario/src/app/layout.tsx
    - calendario-tributario/next.config.ts
    - calendario-tributario/package.json

key-decisions:
  - "Prisma 6.19.2 pinned explicitly (Prisma 7 does NOT support MongoDB)"
  - "Prisma client output to src/generated/prisma/client (not default path)"
  - "prisma.config.ts loads from .env.local (Next.js convention) instead of .env"
  - "Turbopack root set to __dirname to resolve lockfile ambiguity warning"

patterns-established:
  - "Prisma singleton: globalThis pattern prevents connection pool exhaustion during hot reload"
  - "COP formatting: Intl.NumberFormat('es-CO') with 0 fraction digits"
  - "Colombia timezone: all dates use TZDate from @date-fns/tz with America/Bogota"
  - "MongoDB ObjectId: all models use @id @default(auto()) @map('_id') @db.ObjectId"

requirements-completed: [LOCL-01, LOCL-02, LOCL-03]

# Metrics
duration: 7min
completed: 2026-02-27
---

# Phase 1 Plan 01: Project Scaffolding, Prisma Schema, and Localization Utilities Summary

**Next.js 15 project with Prisma 6 MongoDB schema (8 models), COP currency formatter, Colombia timezone utilities, and Spanish root layout**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-27T05:24:12Z
- **Completed:** 2026-02-27T05:31:31Z
- **Tasks:** 2
- **Files modified:** 27 (Task 1) + 7 (Task 2) = 34

## Accomplishments
- Next.js 15.5.12 scaffolded with full dependency stack (Prisma 6, Better Auth, date-fns, Zod 4, shadcn/ui)
- Full Prisma schema with 8 models: 4 Better Auth models (User, Session, Account, Verification) + 4 seed data models (CalendarioTributario, FechaVencimiento, FestivoColombiano, ConfiguracionSistema)
- Localization utility layer: COP formatter (`$ 52.374`), Colombia timezone functions, Spanish date formatting (`15 de marzo, 2026`)
- Root layout with `lang="es"` and Spanish metadata, light theme only
- Production build passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with all dependencies** - `7e7f8a2` (feat)
2. **Task 2: Define Prisma schema, push to MongoDB, and create utility layer** - `20918c9` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Full MongoDB schema with 8 models, ObjectId annotations, indexes
- `prisma.config.ts` - Prisma config loading from .env.local
- `src/lib/prisma.ts` - Prisma singleton client for Next.js hot reload safety
- `src/lib/utils/constants.ts` - COLOMBIA_TZ, UVT_2026, APP_NAME constants
- `src/lib/utils/currency.ts` - COP currency formatting (formatCOP)
- `src/lib/utils/dates.ts` - Colombia timezone utilities (nowColombia, toColombia, formatDateColombia, daysUntilDeadline)
- `src/app/layout.tsx` - Root layout with lang="es", Spanish metadata
- `next.config.ts` - Turbopack root configured
- `package.json` - All dependencies with pinned Prisma 6
- `.env.example` - Environment variable documentation
- `.gitignore` - Excludes .env, .env.local, src/generated/
- `components.json` - shadcn/ui configuration
- `src/components/ui/` - button, card, input, label, separator components

## Decisions Made
- **Prisma 6 pinned explicitly:** Prisma 7 does NOT support MongoDB. Package.json uses `^6.19.2` to prevent accidental upgrade.
- **Import from `../generated/prisma/client`:** Prisma 6.19.x generates with `client.ts` as entry point (no `index.ts`), so import path includes `/client`.
- **prisma.config.ts loads .env.local:** Next.js convention uses `.env.local` for local development; removed Prisma-generated `.env` file.
- **Turbopack root:** Set to `__dirname` in `next.config.ts` to resolve lockfile ambiguity warning from parent directory.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffolded into temp directory due to non-empty target**
- **Found during:** Task 1
- **Issue:** `calendario-tributario/` already contained `.git` and `.planning` directories, which caused `create-next-app` to fail when targeting it directly
- **Fix:** Scaffolded into `/tmp/calendario-temp` then rsync'd files (excluding .git) to the target directory
- **Files modified:** All scaffolded files
- **Verification:** Dev server starts, all files in correct location
- **Committed in:** 7e7f8a2

**2. [Rule 1 - Bug] Fixed Prisma client import path**
- **Found during:** Task 2 (build verification)
- **Issue:** `import from "../generated/prisma"` failed because Prisma 6.19.x generates `client.ts` as entry point, not `index.ts`
- **Fix:** Changed import to `"../generated/prisma/client"`
- **Files modified:** src/lib/prisma.ts
- **Verification:** `npm run build` passes
- **Committed in:** 20918c9

**3. [Rule 3 - Blocking] Installed dotenv for prisma.config.ts**
- **Found during:** Task 1
- **Issue:** Prisma 6.19.x generates `prisma.config.ts` that requires `dotenv` package
- **Fix:** `npm install dotenv --save-dev`
- **Files modified:** package.json, package-lock.json
- **Verification:** `npx prisma validate` succeeds
- **Committed in:** 7e7f8a2

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- **MongoDB Atlas push deferred:** `prisma db push` failed because `.env.local` contains placeholder DATABASE_URL. This is expected -- the user must provide their real MongoDB Atlas connection string. Schema validates correctly and Prisma client generates without issues.
- **Package name:** Scaffolded project name was `calendario-temp` due to temp directory approach; fixed to `calendario-tributario`.

## User Setup Required

The user must configure their MongoDB Atlas connection string before `prisma db push` will succeed:

1. Create a MongoDB Atlas cluster (free tier) at https://cloud.mongodb.com
2. Get the connection string from Atlas dashboard
3. Update `calendario-tributario/.env.local` with the real `DATABASE_URL`
4. Run `cd calendario-tributario && npx prisma db push` to push the schema

## Next Phase Readiness
- Project structure ready for Plan 02 (authentication): Better Auth 1.4.19 installed, Prisma schema includes all auth models
- Utility layer ready for all subsequent plans: currency formatting, timezone handling, constants
- shadcn/ui components ready for auth UI: button, card, input, label, separator
- Plan 03 (seed data) schema models defined: CalendarioTributario, FechaVencimiento, FestivoColombiano, ConfiguracionSistema

## Self-Check: PASSED

All 9 key files verified present on disk. Both task commits (7e7f8a2, 20918c9) verified in git log. Production build passes.

---
*Phase: 01-foundation*
*Completed: 2026-02-27*
