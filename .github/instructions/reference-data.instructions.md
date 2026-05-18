---
description: "Brands, delivery methods, and tax rates — reference data modules that feed into orders."
applyTo: "server/api/brands/**,server/api/delivery-methods/**,server/api/tax-rates/**,pages/brands/**,pages/delivery-methods/**,pages/tax-rates/**"
---

# Reference Data Modules

## Brands

### Purpose
A brand represents a business identity (e.g. "Nitkowa Sztuka"). Orders belong to a brand. Brand provides default values for order creation.

### Fields
- `name` — brand display name
- `subtitle` — optional tagline
- `websiteUrl` — used as redirect target when share link is disabled
- `defaultPaymentText` — pre-fills order `paymentText` at creation
- `defaultHandmadeText` — pre-fills order `handmadeText` at creation
- `defaultLeadTime` — pre-fills order `leadTime` at creation

### API: `server/api/brands/`
- `index.get.ts` — list all brands
- `index.post.ts` — create brand (admin only)
- `[id].put.ts` — update brand (admin only)

### Critical Rule
Changing `defaultPaymentText`, `defaultHandmadeText`, or `defaultLeadTime` does NOT affect existing orders. These values are snapshotted into the Order at creation time.

---

## Delivery Methods

### Purpose
Delivery options scoped to a brand. When creating an order, user selects a method; its name and cost are snapshotted into the order.

### Fields
- `brandId` — scoped to a specific brand
- `name` — display name (e.g. "InPost Paczkomat", "Poczta Polska")
- `defaultCost` — default cost; user can override per order
- `description` — optional internal note
- `isActive` — soft-delete flag; inactive methods hidden from new orders

### API: `server/api/delivery-methods/`
- `index.get.ts` — list all; supports `?brandId=` and `?activeOnly=true` filters
- `index.post.ts` — create (admin only)
- `[id].put.ts` — update name/cost/active (admin only)

### Critical Rule
- `onDelete: SetNull` — deleting a method nullifies `Order.deliveryMethodId` but keeps `deliveryMethodName` and `deliveryCost` intact.
- On order creation: server reads `DeliveryMethod.name` from DB and writes to `Order.deliveryMethodName`. Never trust frontend-supplied name.

---

## Tax Rates

### Purpose
Tax rate records for profit calculation. Selected per order; tax amount is computed and stored.

### Fields
- `name` — display label (e.g. "Ryczałt 8.5%", "Brak")
- `rate` — percentage as Decimal (e.g. 8.50)
- `isDefault` — hint for UI pre-selection
- `isActive` — soft-delete flag

### API: `server/api/tax-rates/`
- `index.get.ts` — list all; supports `?activeOnly=true`
- `index.post.ts` — create (admin only)
- `[id].put.ts` — update (admin only)

### Critical Rule
- `onDelete: SetNull` — deleting a rate nullifies `Order.taxRateId` but keeps `Order.taxAmount` intact.
- Tax amount is computed at order creation: `revenue * (rate / 100)` and stored. Changing the rate later does NOT recalculate existing orders.

---

## Adding a New Reference Data Module
1. Add model to `prisma/schema.prisma` (follow existing patterns: uuid, createdBy, @@map).
2. Create migration + generate client.
3. Create `server/api/{module}/index.get.ts`, `index.post.ts`, `[id].put.ts`.
4. Create `pages/{module}/index.vue` with DataTable + inline Dialog.
5. Add nav link in `layouts/default.vue` sidebar.
6. Add translations to `i18n/pl.json`.
7. If it feeds into Orders: add FK to Order model, add snapshot fields, update `orders/index.post.ts`.
