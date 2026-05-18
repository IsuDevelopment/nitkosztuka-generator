---
description: "Database layer rules for Prisma schema, migrations, and data access patterns."
applyTo: "prisma/**,server/**"
---

# Database — Prisma + PostgreSQL

## Schema Location
`prisma/schema.prisma` — single source of truth. Never create raw SQL outside of migrations.

## Key Rules

### Snapshot-on-Create Pattern
Order stores SNAPSHOT copies of mutable reference data at creation time:
- `deliveryMethodName` — copied from `DeliveryMethod.name`
- `deliveryCost` — copied from `DeliveryMethod.defaultCost` (or overridden by user)
- `paymentText` — copied from `Brand.defaultPaymentText`
- `handmadeText` — copied from `Brand.defaultHandmadeText`
- `leadTime` — copied from `Brand.defaultLeadTime`

**NEVER** read these values from relations for display in existing orders.
**ALWAYS** snapshot from the source record at order creation time server-side (not from frontend input).

### Foreign Key Deletion Policy
- `Order.deliveryMethodId` → `onDelete: SetNull` — deleting a method nullifies the FK but leaves snapshot fields intact.
- `Order.taxRateId` → `onDelete: SetNull` — same pattern.
- `OrderItem.orderId` → `onDelete: Cascade` — deleting an order deletes its items.
- All other FKs use default RESTRICT — do not cascade delete brands, clients, or users.

### Adding a New Model
1. Add model to `prisma/schema.prisma` with `@@map("snake_case_table")` and `@map("snake_case")` on fields.
2. Use `@id @default(uuid())` for primary keys.
3. Add `createdAt DateTime @default(now()) @map("created_at")`.
4. Add `createdById String @map("created_by_id")` with `User` relation.
5. Run `npx prisma migrate dev --name describe-change`.
6. Run `npx prisma generate`.
7. Update `prisma/seed.ts` if needed.

### Adding Fields to Existing Models
1. Add field with `@default()` or make optional (`?`) for backward compatibility.
2. If the field is monetary, use `Decimal @db.Decimal(10, 2)`.
3. Run `npx prisma migrate dev --name add-field-name`.
4. Run `npx prisma generate`.
5. Update affected API endpoints and frontend.

### Monetary Values
- Schema: `Decimal @db.Decimal(10, 2)`
- Application code: always cast with `Number()` before arithmetic.
- Never use JavaScript floating-point for currency display; use `toLocaleString('pl-PL', { minimumFractionDigits: 2 })`.

### Enums
Defined in schema: `AcceptanceStatus`, `PaymentStatus`, `DeliveryStatus`, `AuditAction`.
To add a new enum value: add to schema, migrate, then update all frontend option arrays that reference it.

### Prisma Client Usage
```ts
import { prisma } from '~/server/utils/db'
```
- Singleton in `server/utils/db.ts` — hot-reload safe in dev.
- Never use `include` and `select` together in the same query level.
- Prefer `select` for list endpoints (performance).
- Use `include` for detail endpoints that need relations.

### Seed Script
`prisma/seed.ts` — run with `npm run db:seed` (requires `ADMIN_PASSWORD` env var).
Seeds: admin user (login: `admin`), brand "Nitkowa Sztuka", delivery methods, tax rates.
