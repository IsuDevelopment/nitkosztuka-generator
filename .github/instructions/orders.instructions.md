---
description: "Orders module — the core business entity. Covers creation, status workflow, snapshots, share links, and the copy-message feature."
applyTo: "server/api/orders/**,pages/orders/**,components/order/**"
---

# Orders Module

## Architecture

### Data Flow
```
pages/orders/new.vue  →  POST /api/orders  →  prisma.order.create (with snapshots)
pages/orders/[id].vue →  GET /api/orders/[id] → prisma.order.findUnique
                      →  PUT /api/orders/[id] → status changes, notes
                      →  DELETE /api/orders/[id]
                      →  POST /api/orders/[id]/toggle-share
```

### Files
| File | Purpose |
|------|---------|
| `server/api/orders/index.get.ts` | List orders (paginated, filterable by status) |
| `server/api/orders/index.post.ts` | Create order — **snapshot logic lives here** |
| `server/api/orders/[id].get.ts` | Get order detail with brand, client, taxRate, items |
| `server/api/orders/[id].put.ts` | Update statuses, notes, delivery details |
| `server/api/orders/[id].delete.ts` | Soft-delete protection via audit then hard-delete |
| `server/api/orders/[id]/toggle-share.post.ts` | Toggle `shareEnabled` boolean |
| `pages/orders/index.vue` | Order list with status filter dropdowns |
| `pages/orders/new.vue` | Two-column layout: form + live A4 preview |
| `pages/orders/[id].vue` | Detail: status panel + paper preview + copy-message |
| `components/order/OrderPreview.vue` | Shared A4 preview (admin + public share) |
| `components/order/OrderStatusBadge.vue` | Tag component for status display |

## Critical Rules

### Snapshot on Create (IMMUTABLE)
At creation time, `index.post.ts` MUST:
1. Load `DeliveryMethod` by ID from DB → snapshot `name` into `deliveryMethodName`.
2. Copy `deliveryCost` from form (user may override `defaultCost`).
3. Copy `paymentText` from form (pre-filled from `Brand.defaultPaymentText`).
4. Copy `handmadeText` from form (pre-filled from `Brand.defaultHandmadeText`).
5. Copy `leadTime` from form (pre-filled from `Brand.defaultLeadTime`).

These fields are FROZEN for the life of the order. The order GET endpoint does NOT include the live `deliveryMethod` relation. Use `order.deliveryMethodName` for display.

### Order Number Format
Generated server-side by `buildOrderNumber(brandName, year, month, sequentialCount)`.
Format: `NS/01/05/2026` (brand initials / zero-padded sequence / zero-padded month / year).
Never accept order numbers from the client.

### Status Workflow
Three independent status tracks (all start at PENDING):
- **AcceptanceStatus**: PENDING → ACCEPTED
- **PaymentStatus**: PENDING → DEPOSIT_PAID → PAID
- **DeliveryStatus**: PENDING → IN_DELIVERY → DELIVERED → COMPLETED

Statuses are updated via PUT, individually. No business logic enforces order between tracks — all transitions are valid at any time.

### Share Links
- `shareHash`: 64-char hex string generated at creation, immutable.
- `shareEnabled`: boolean toggle (default true).
- Public endpoint: `GET /api/share/[hash]` — returns order data without `materialCost`, `notes`, `taxAmount`.
- If `shareEnabled=false` → redirect to brand `websiteUrl` or `/`.

### Tax Calculation
```
itemsTotal = sum(unitPrice * quantity)
revenue = itemsTotal - discount + deliveryCost
taxAmount = revenue * (taxRate.rate / 100)
```
Computed server-side at creation. Stored as snapshot (`taxAmount`).

### materialCost — Internal Only
`OrderItem.materialCost` is NEVER exposed in:
- `OrderPreview.vue`
- `/api/share/[hash]`
- Copy-message text

It is only visible in the stats/dashboard module.

## Adding Features to Orders

### Adding a new field to Order:
1. Add to `prisma/schema.prisma` Order model (with `@map`).
2. `npx prisma migrate dev --name add-order-field-name`
3. `npx prisma generate`
4. Add to `CreateOrderBody` interface in `index.post.ts`.
5. Add to the `prisma.order.create({ data: { ... } })` call.
6. If snapshot: read from source record in `index.post.ts`, not from request body.
7. Add form field in `pages/orders/new.vue`.
8. Add display in `OrderPreview.vue` if client-visible.
9. Add to `i18n/pl.json`.
10. Call `logAudit()` in affected endpoints.

### Adding a new status to an enum:
1. Add value to enum in `prisma/schema.prisma`.
2. Create migration.
3. Add to options array in `pages/orders/[id].vue` and `pages/orders/index.vue`.
4. Add label to `OrderStatusBadge.vue` severity map.
5. Add translation key in `i18n/pl.json`.
