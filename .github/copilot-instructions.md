# Nitkowa Sztuka — Order Management App

## Overview
Full-stack admin panel for a handcraft business. Manages brands, clients, orders (with status workflow), delivery methods, tax rates, and financial statistics. Public share links let clients view their order summary.

## Stack
- **Runtime**: Nuxt 3 (SSR, file-based routing, server API routes)
- **UI**: PrimeVue 4 (Aura preset, custom warm palette `NitkoTheme`), Tailwind CSS v4
- **ORM**: Prisma 6 → PostgreSQL 17 (Neon)
- **Auth**: `nuxt-auth-utils` (session-based, cookie)
- **i18n**: `@nuxtjs/i18n` v9, default locale `pl`, translations in `i18n/pl.json`
- **Deploy**: Vercel (nitro preset `vercel`)
- **Language**: TypeScript strict

## Project Structure
```
├── prisma/schema.prisma          # Single source of truth for DB models
├── prisma/seed.ts                # Seeds admin user, brand, delivery methods, tax rates
├── server/
│   ├── middleware/auth.ts        # Global API auth guard (excludes public paths)
│   ├── utils/db.ts               # Prisma singleton
│   ├── utils/auth.ts             # requireAuth(), requireAdmin()
│   ├── utils/audit.ts            # logAudit(event, action, entityType, entityId, changes?)
│   ├── utils/helpers.ts          # generateShareHash(), formatMoney(), buildOrderNumber()
│   └── api/
│       ├── auth/                 # login.post, logout.post, me.get
│       ├── brands/               # index.get, index.post, [id].put
│       ├── clients/              # index.get, index.post, [id].get, [id].put
│       ├── delivery-methods/     # index.get, index.post, [id].put
│       ├── tax-rates/            # index.get, index.post, [id].put
│       ├── users/                # index.get, index.post
│       ├── orders/               # index.get, index.post, [id].get, [id].put, [id].delete, [id]/toggle-share.post
│       ├── stats/                # index.get (financial aggregation, date-range)
│       ├── share/                # [hash].get (public, no auth)
│       └── audit/                # index.get (admin-only audit log)
├── pages/                        # File-based routes (admin + public)
├── components/                   # Shared Vue components
├── layouts/default.vue           # Admin sidebar layout
├── layouts/public.vue            # Minimal public layout (share pages)
├── i18n/pl.json                  # All UI strings (Polish)
├── assets/css/main.css           # CSS vars, utility classes, print styles
└── nuxt.config.ts                # Module config, PrimeVue theme, i18n, nitro
```

## Critical Invariants
1. **Snapshot-on-create for orders** — `deliveryMethodName`, `deliveryCost`, `paymentText`, `handmadeText`, `leadTime` are copied into the Order row at creation. Changes to DeliveryMethod or Brand defaults MUST NOT retroactively affect existing orders.
2. **`materialCost` is internal** — never exposed in public share views or client-facing components.
3. **Audit trail** — every CRUD mutation on entities (brand, client, order, user, delivery-method, tax-rate) must call `logAudit()`.
4. **Auth guard** — all `/api/*` routes require session except `/api/auth/login`, `/api/auth/logout`, and `/api/share/*`.
5. **UUID primary keys** — all IDs are UUIDv4 strings.
6. **Decimal fields** — monetary values use `Decimal(10,2)` in Prisma. Cast with `Number()` in application code; never use float arithmetic for currency display.
7. **Polish-first UI** — all user-visible strings go through `$t()` / `useI18n()`. Add keys to `i18n/pl.json`.

## Conventions

### API Endpoints
- File naming: `server/api/{module}/index.{method}.ts` or `[id].{method}.ts`
- Always import `{ defineEventHandler, readBody, getQuery, getRouterParam, createError }` from `'h3'`
- Always call `requireAuth(event)` or `requireAdmin(event)` at the start
- Return plain objects (Nuxt auto-serializes); throw `createError({ statusCode, message })` for errors
- Validate required fields; throw 400 for missing data
- Import prisma from `~/server/utils/db`

### Pages & Components
- Use `<script setup lang="ts">` exclusively
- Always declare `const { t: $t } = useI18n()` at the top of script setup
- Use PrimeVue components: DataTable, Column, Button, Dialog, InputText, Select, Textarea, InputNumber, AutoComplete, Tag, ProgressSpinner, Divider, DatePicker, Chart
- CSS: scoped styles, use CSS custom properties from `assets/css/main.css`
- Responsive: mobile-first; admin sidebar collapses on <768px
- Print: use `.no-print` class to hide non-printable elements

### Type Safety
- Prefer typed `useFetch<T>()` when the return shape is known
- For untyped API responses, use `Record<string, unknown>` with explicit casts
- `@prisma/client` types are auto-generated; run `npx prisma generate` after schema changes

## Commands
```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npx nuxi typecheck      # TypeScript check (must pass with 0 errors)
npx prisma migrate dev  # Create + apply migration
npx prisma generate     # Regenerate Prisma client after schema changes
npm run db:seed          # Seed database (requires ADMIN_PASSWORD env var)
npx prisma studio       # Open Prisma Studio GUI
```

## Environment Variables (`.env`)
```
DATABASE_URL=postgresql://...       # Neon PostgreSQL connection string
NUXT_SESSION_SECRET=<random-64>    # Session encryption key
ADMIN_PASSWORD=<seed-password>     # Used only by seed script
```
