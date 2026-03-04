# Phase 1: Foundation - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema, authentication system, tax seed data, and base app shell layout. This phase delivers everything the matching engine and dashboard depend on: a working auth flow, a complete Prisma schema with seeded tax reference data, and a protected app shell with navigation. No feature logic — just the foundation.

</domain>

<decisions>
## Implementation Decisions

### Auth Library & Strategy
- Use **Better Auth 1.4.x** (official NextAuth successor) — not NextAuth v5
- Email/password credentials only for v1 (no OAuth, no magic links)
- **Email verification required** after signup before accessing the app
- JWT sessions (stateless) with 30-day expiry
- After signup: user verifies email → redirected to onboarding wizard

### Database
- **MongoDB** as the database (user preference)
- Prisma ORM with MongoDB connector
- Note: no Prisma migrations with MongoDB (uses `db push`), no native enums (use string unions)

### App Shell Layout
- **Always-visible sidebar** on desktop (Linear-style), collapses on mobile
- Sidebar navigation items: Dashboard (home), Obligaciones, Sanciones, Perfil/Configuracion
- **Header bar** contains: notification bell (unread count), user avatar with dropdown menu (settings, logout), active empresa name
- Empresa name in header prepares for multi-client switcher in Phase 6

### Visual Style
- **Clean & minimal** aesthetic inspired by Linear
- **Blue color palette** (navy/royal blue) — trust and finance association
- White background, subtle borders, generous whitespace
- shadcn/ui components as the design system

### Auth Pages
- **Separate pages** for login (/login) and register (/register)
- **Centered card** layout on plain/gradient background
- Link between login ↔ register pages

### Claude's Discretion
- Mobile navigation approach (hamburger menu vs bottom tab bar)
- Branding on auth pages (logo + name, with or without tagline)
- Register form fields (email + password only, or include name)
- Loading states and skeleton patterns
- Error message styling and placement
- Exact color shades within the blue palette

</decisions>

<specifics>
## Specific Ideas

- Linear is the reference for the overall app feel — clean, professional, not cluttered
- The app should feel trustworthy and serious (it's about taxes and money)
- All UI text in Spanish from day one with Colombian tax terminology

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-26*
