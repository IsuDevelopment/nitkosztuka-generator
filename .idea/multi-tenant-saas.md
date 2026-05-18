# Multi-Tenant SaaS Architecture Plan

## Roles

| Role | Scope | Capabilities |
|------|-------|-------------|
| **Super Admin** | Global | All brands, all users, system settings, audit log |
| **Brand Admin** | Own brand(s) | Full CRUD on orders/clients within brand, manage Brand Users, brand settings |
| **Brand User** | Own brand(s) | View & create orders/clients within brand, no user management |

## Data Model Changes

### New: `UserBrand` (M:N join table)

```prisma
model UserBrand {
  id      String @id @default(uuid())
  userId  String
  brandId String
  role    BrandRole @default(USER)

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  brand Brand @relation(fields: [brandId], references: [id], onDelete: Cascade)

  @@unique([userId, brandId])
}

enum BrandRole {
  ADMIN
  USER
}
```

### Modified: `User`

```prisma
model User {
  // existing fields...
  isSuperAdmin Boolean     @default(false)
  brands       UserBrand[]
  // remove: role String @default("admin")
}
```

### Modified: `Brand`

```prisma
model Brand {
  // existing fields...
  primaryColor String?
  accentColor  String?
  logoUrl      String?
  users        UserBrand[]
}
```

## Auth Changes

### New utility functions (`server/utils/auth.ts`)

```ts
// Throws 403 if user is not Super Admin
function requireSuperAdmin(event: H3Event): User

// Throws 403 if user has no access to the given brandId
function requireBrandAccess(event: H3Event, brandId: string): User

// Returns array of brand IDs the user can access (all if Super Admin)
function getUserBrandIds(event: H3Event): string[]
```

### Endpoint scoping pattern

Every list/detail endpoint that touches brand-scoped data:
1. Call `getUserBrandIds(event)` to get allowed brand IDs
2. Add `WHERE brandId IN (...)` filter to Prisma query
3. For mutations: verify target entity's brandId is in allowed set

## Implementation Order

### Phase 1 — Foundation (non-breaking)
1. Prisma migration: add `UserBrand` table, `User.isSuperAdmin`, Brand color/logo fields
2. Seed script: assign existing admin as Super Admin + link to all brands
3. Auth utils: `requireSuperAdmin()`, `requireBrandAccess()`, `getUserBrandIds()`
4. Update all existing endpoints to use `getUserBrandIds()` for filtering

### Phase 2 — User Management
5. `POST /api/users` — Super Admin creates users + assigns brand roles
6. `PUT /api/users/[id]/brands` — manage user-brand assignments
7. Users page: show brand assignments, role selector per brand
8. Brand Admin: can invite/manage users for own brand only

### Phase 3 — Brand Settings
9. `PUT /api/brands/[id]/settings` — update colors, logo
10. Brand settings page (accessible to Brand Admin)
11. Apply brand colors dynamically (CSS variables from brand record)
12. Logo in sidebar/header per active brand

### Phase 4 — Frontend Scoping
13. Sidebar: show only brands user has access to
14. Brand switcher component (for users with multiple brands)
15. Hide admin-only actions from Brand User role
16. Dashboard: scope stats to user's brands

### Phase 5 — Polish
17. Invitation flow (email-based or link-based)
18. Activity log per brand (scoped audit)
19. Brand-specific notification settings
20. Landing/marketing page for SaaS signup (future)

## Migration Strategy

- Existing single-admin setup continues to work (isSuperAdmin = true, linked to all brands)
- No data loss — additive schema changes only
- Feature flags possible: `MULTI_TENANT_ENABLED` env var to gate new UI until ready

## Security Considerations

- Every API endpoint MUST check brand access — never trust client-provided brandId alone
- Super Admin bypass: only when `user.isSuperAdmin === true`
- Audit log entries include `actorId` + `brandId` for traceability
- Rate-limit user creation endpoints to prevent abuse
- Brand isolation: no cross-brand data leaks in queries (always filter)
