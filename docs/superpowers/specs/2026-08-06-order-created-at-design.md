# Editable order creation date

## Goal
On `/orders/new` and `/orders/[id]/edit`, let the user pick the order's creation date instead of it being locked to "now". Default stays today's date.

## Scope decisions
- Order numbering (`server/api/orders/index.post.ts`, year/month count) keeps using the real current date — unaffected by the chosen creation date.
- Editable in both create and edit flows.
- No date range restriction (no future/past guard) — internal tool, back-dating is the point.

## Backend changes

### `server/api/orders/index.post.ts`
- `CreateOrderBody` gains `createdAt?: string`.
- `prisma.order.create` data gains: `createdAt: body.createdAt ? new Date(body.createdAt) : undefined` (omitted/undefined lets the Prisma `@default(now())` apply).

### `server/api/orders/[id].put.ts`
- Body type gains `createdAt?: string`.
- Update data gains: `...(body.createdAt !== undefined && { createdAt: new Date(body.createdAt) })`, following the existing conditional-spread pattern used for every other field.

## Frontend changes

### `pages/orders/new.vue`
- `form` reactive object gains `createdAt: new Date() as Date` (defaults to today).
- New template field before the Brand section: PrimeVue `DatePicker` bound to `form.createdAt`, `date-format="dd.mm.yy"`, `show-icon`, label "Data utworzenia".
- `previewOrder.createdAt` switches from hardcoded `new Date().toISOString()` to `form.createdAt.toISOString()`.
- `submitOrder` payload serializes `createdAt: form.createdAt.toISOString()`.

### `pages/orders/[id]/edit.vue`
- `form` reactive object gains `createdAt: new Date() as Date`.
- Pre-fill block sets `form.createdAt = new Date(o.createdAt as string)`.
- Same `DatePicker` field added in the same template position as `new.vue`.
- `previewOrder.createdAt` switches from `(order.value?.createdAt as string) ?? new Date().toISOString()` to `form.createdAt.toISOString()`.
- `submitOrder` payload serializes `createdAt: form.createdAt.toISOString()`.

## Out of scope
- Changing order-number generation to follow the picked date.
- Any historical backfill/migration of existing orders.
