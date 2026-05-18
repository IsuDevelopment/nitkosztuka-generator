---
name: add-module
description: "Scaffold a complete new CRUD module: model, migration, API endpoints, page, i18n."
---

# Skill: Add Module

## Inputs Required
- Module name (singular, e.g. `payment-method`, `category`)
- Fields with types
- Relations to other models
- Whether it feeds into Orders (requires snapshot pattern)

## Steps

### 1. Database
1. Add model to `prisma/schema.prisma`:
```prisma
model ModelName {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(200)
  // ... fields
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  createdById String   @map("created_by_id")

  createdBy User @relation(fields: [createdById], references: [id])

  @@map("table_name")
}
```
2. Add relation field to `User` model.
3. If Order-related: add FK + snapshot fields to `Order` model.
4. Run `npx prisma migrate dev --name add-module-name`.
5. Run `npx prisma generate`.

### 2. API Endpoints
Create in `server/api/{module}/`:
- `index.get.ts` — list (with optional filters: `?activeOnly=true`)
- `index.post.ts` — create (admin only, call `logAudit`)
- `[id].put.ts` — update (admin only, call `logAudit`)

Follow template from `add-api-endpoint` skill.

### 3. Frontend Page
Create `pages/{module}/index.vue`:
- DataTable with columns for key fields
- Inline Dialog for create/edit (single page CRUD pattern)
- Status toggle if `isActive` field exists

Follow template from `add-page` skill.

### 4. Navigation
Add to sidebar in `layouts/default.vue`:
```ts
{ label: $t('nav.moduleName'), icon: 'pi pi-icon', to: '/module-name' }
```

### 5. i18n
Add to `i18n/pl.json`:
```json
"nav.moduleName": "Nazwa modułu",
"field.fieldName": "Nazwa pola"
```

### 6. Seed (if needed)
Update `prisma/seed.ts` with initial records.

### 7. If Order-Related (Snapshot Pattern)
In `server/api/orders/index.post.ts`:
1. Look up the record by ID from request body.
2. Snapshot its name/value into Order fields.
3. Add `onDelete: SetNull` to the FK in schema.
4. Never include the live relation in order GET responses for snapshotted data.

## Checklist
- [ ] Model in schema with `@@map`, `@map`, uuid PK, createdBy
- [ ] Migration created and applied
- [ ] Prisma client regenerated
- [ ] API: GET list, POST create, PUT update — all with audit
- [ ] Page with DataTable + Dialog
- [ ] Sidebar nav link added
- [ ] i18n keys added
- [ ] `npx nuxi typecheck` passes
- [ ] If order-related: snapshot pattern implemented, onDelete:SetNull set
