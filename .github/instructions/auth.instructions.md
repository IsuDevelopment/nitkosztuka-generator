---
description: "Authentication, authorization, and session management rules."
applyTo: "server/middleware/**,server/api/auth/**,server/utils/auth.ts,middleware/**"
---

# Auth Module

## Architecture

### Session System
Uses `nuxt-auth-utils` — session stored in encrypted cookie (NUXT_SESSION_SECRET).
No JWT, no external provider. Password-based login only.

### Files
| File | Purpose |
|------|---------|
| `server/middleware/auth.ts` | Global API guard — validates session on all `/api/*` except public paths |
| `server/utils/auth.ts` | `requireAuth(event)` and `requireAdmin(event)` helpers |
| `server/api/auth/login.post.ts` | Validates login+password, creates session |
| `server/api/auth/logout.post.ts` | Clears session |
| `server/api/auth/me.get.ts` | Returns current user from session |
| `middleware/auth.global.ts` | Client-side: redirects to `/login` if no session |

### Public Routes (no auth required)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/share/*`
- All non-`/api/` routes (handled by Nuxt SSR)

## Rules

### Server-Side Auth
Every API endpoint (except auth + share) MUST start with:
```ts
const user = await requireAuth(event)
// or for admin-only:
const user = await requireAdmin(event)
```
The returned `user` object shape: `{ id: string; login: string; name: string; isAdmin: boolean }`.

### Client-Side Auth
`middleware/auth.global.ts` runs on every navigation. Uses `useUserSession()` from `nuxt-auth-utils`.
Pages that should bypass auth: `pages/login.vue` and `pages/share/[hash].vue`.

### Password Hashing
- Library: `bcryptjs` (cost factor 12).
- Hash stored in `User.passwordHash`.
- Login compares with `compareSync(input, hash)`.

### Adding a New Public API Route
1. Add path pattern to `publicPaths` array in `server/middleware/auth.ts`.
2. Do NOT call `requireAuth()` in the endpoint handler.

### User Roles
Currently flat: `isAdmin: boolean`.
- Admin can: manage users, view audit log, manage brands/delivery-methods/tax-rates.
- Non-admin can: manage clients, create/edit/view orders, view stats.
- Both roles authenticated equally; role check happens in individual endpoints via `requireAdmin(event)`.
