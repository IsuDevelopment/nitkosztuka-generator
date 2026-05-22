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

### Phase 0 — Feature Infrastructure (paywall-ready modularity)

#### Data Model

```prisma
model Plan {
  id        String        @id @default(uuid())
  name      String        @db.VarChar(100) // "Free", "Pro", "Enterprise"
  isDefault Boolean       @default(false) @map("is_default")
  createdAt DateTime      @default(now()) @map("created_at")
  features  PlanFeature[]
  brands    Brand[]

  @@map("plans")
}

model PlanFeature {
  id      String  @id @default(uuid())
  planId  String  @map("plan_id")
  feature Feature
  limit   Int?    // null = unlimited (e.g. max orders/month, max users)

  plan Plan @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@unique([planId, feature])
  @@map("plan_features")
}

enum Feature {
  BRAND_CUSTOMIZATION   // colors, logo
  MULTI_BRAND           // more than 1 brand
  TEAM_MANAGEMENT       // invite users
  ADVANCED_STATS        // extended analytics
  SHARE_LINKS           // public share links
  AUDIT_LOG             // change history
  CUSTOM_DELIVERY       // custom delivery methods (limit = max count)
  EXPORT_PDF            // PDF/print export
  API_ACCESS            // external API tokens
  NOTIFICATIONS         // email/push notifications
}
```

#### Modified: `Brand`

```prisma
model Brand {
  // existing fields...
  planId String @map("plan_id")
  plan   Plan   @relation(fields: [planId], references: [id])
}
```

#### Implementation Steps

1. Prisma migration: add `Plan`, `PlanFeature` tables, `Feature` enum, `Brand.planId`
2. Seed: create "Free" plan (default) with basic features + limits
3. `server/utils/features.ts`:
   - `checkFeature(brandId, feature)` → boolean
   - `requireFeature(event, brandId, feature)` → throws 403 with upgrade message
   - `getFeatureLimit(brandId, feature)` → number | null
4. `composables/useFeatures.ts`:
   - `hasFeature(feature)` → reactive boolean
   - `featureLimit(feature)` → reactive number | null
5. `<UpgradePrompt>` component — shown in place of gated UI
6. `GET /api/plans` — list available plans (public)
7. `GET /api/brands/[id]/features` — current brand's active features

#### Default "Free" Plan Features

| Feature | Included | Limit |
|---------|----------|-------|
| SHARE_LINKS | ✅ | — |
| CUSTOM_DELIVERY | ✅ | 3 |
| AUDIT_LOG | ✅ | 7 days |
| BRAND_CUSTOMIZATION | ❌ | — |
| MULTI_BRAND | ❌ | 1 |
| TEAM_MANAGEMENT | ❌ | 1 user |
| ADVANCED_STATS | ❌ | — |
| EXPORT_PDF | ❌ | — |
| API_ACCESS | ❌ | — |
| NOTIFICATIONS | ❌ | — |

---

### Phase 1 — Foundation (non-breaking)
1. Prisma migration: add `UserBrand` table, `User.isSuperAdmin`, Brand color/logo fields
2. Seed script: assign existing admin as Super Admin + link to all brands
3. Auth utils: `requireSuperAdmin()`, `requireBrandAccess()`, `getUserBrandIds()`
4. Update all existing endpoints to use `getUserBrandIds()` for filtering
5. Wrap brand-scoped mutations with `requireFeature()` where applicable

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
