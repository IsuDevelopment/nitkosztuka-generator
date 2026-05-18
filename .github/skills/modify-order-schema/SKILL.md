---
name: modify-order-schema
description: "Add or modify fields on the Order model — enforcing snapshot rules and propagation to all layers."
---

# Skill: Modify Order Schema

## When to Use
Any time you need to add a field, change a type, or add a relation to the Order model.

## Critical Context
Order uses a **snapshot-on-create** pattern. Any field that references mutable external data (brand defaults, delivery method info, tax rate) MUST be stored as a frozen copy.

## Steps

### Adding a Simple Field (no snapshot)
1. Add field to `Order` model in `prisma/schema.prisma`:
   - Use `@map("snake_case")` for the column name.
   - Make optional (`?`) or provide `@default()` for backward compat.
2. `npx prisma migrate dev --name add-order-fieldname`
3. `npx prisma generate`
4. Add to `CreateOrderBody` in `server/api/orders/index.post.ts`.
5. Add to `prisma.order.create({ data: { ... } })` in the same file.
6. If editable after creation: add to `[id].put.ts` update logic.
7. If visible to client: add to `OrderPreview.vue` template + `OrderData` interface.
8. If visible in API share: add to `server/api/share/[hash].get.ts` select.
9. Add form control in `pages/orders/new.vue`.
10. Add translation in `i18n/pl.json`.
11. `npx nuxi typecheck`

### Adding a Snapshot Field (from reference data)
Same as above PLUS:
- In `index.post.ts`: read the source value from DB, NOT from request body.
- Do NOT include the source relation in `[id].get.ts`.
- Do NOT display the live relation value in frontend — use the snapshot field.

### Adding a Foreign Key to Order
1. Add nullable FK field + relation to schema.
2. Set `onDelete: SetNull` on the relation.
3. Add snapshot fields for any data that must survive deletion of the referenced record.
4. In `index.post.ts`: validate the FK exists, read snapshot data, write both FK and snapshot.

## Dangerous Patterns (NEVER DO)
- Reading delivery/brand/tax data from live relations for display in existing orders.
- Accepting snapshot values from frontend without server-side verification.
- Using `onDelete: Cascade` or `onDelete: Restrict` on reference data FKs.
- Recalculating stored values (taxAmount, deliveryCost) based on current reference data.

## Checklist
- [ ] Schema field added with proper type and @map
- [ ] Migration created
- [ ] Prisma client regenerated
- [ ] Server POST creates with correct value (snapshot if needed)
- [ ] Server PUT allows edit only if field is mutable post-creation
- [ ] OrderPreview updated if client-visible
- [ ] OrderData interface updated in OrderPreview.vue
- [ ] Share endpoint updated if public-visible
- [ ] Form field added in orders/new.vue
- [ ] i18n key added
- [ ] TypeScript clean
