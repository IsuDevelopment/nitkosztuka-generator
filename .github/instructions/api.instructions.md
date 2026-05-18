---
description: "Server API endpoint conventions, error handling, and audit logging."
applyTo: "server/api/**"
---

# Server API Endpoints

## File Naming Convention
```
server/api/{module}/index.get.ts      # List all
server/api/{module}/index.post.ts     # Create
server/api/{module}/[id].get.ts       # Get by ID
server/api/{module}/[id].put.ts       # Update by ID
server/api/{module}/[id].delete.ts    # Delete by ID
server/api/{module}/[id]/{action}.post.ts  # Custom action
```

## Endpoint Template
```ts
import { defineEventHandler, readBody, getRouterParam, getQuery, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  // ... validation, business logic, DB call
  // await logAudit(event, 'CREATED', 'entity-type', entity.id)
  return entity
})
```

## Mandatory Steps for Every Mutation Endpoint
1. Call `requireAuth(event)` or `requireAdmin(event)`.
2. Read and validate body/params.
3. Throw `createError({ statusCode: 400, message })` for invalid input.
4. Throw `createError({ statusCode: 404, message })` for not found.
5. Execute Prisma operation.
6. Call `logAudit(event, action, entityType, entityId, changes?)`.
7. Return the entity.

## Audit Logging
```ts
import { logAudit } from '~/server/utils/audit'

// After successful mutation:
await logAudit(event, 'CREATED', 'order', order.id)
await logAudit(event, 'UPDATED', 'client', client.id, { fieldChanged: newValue })
await logAudit(event, 'DELETED', 'order', id)
```
Actions: `CREATED`, `UPDATED`, `DELETED`.
Entity types: `user`, `brand`, `client`, `order`, `delivery-method`, `tax-rate`.
The `changes` parameter is optional JSON — pass a diff object for updates.

## Query Patterns

### List with Pagination
```ts
const { page = '1', limit = '50', search } = getQuery(event)
const skip = (Number(page) - 1) * Number(limit)
const where = search ? { name: { contains: String(search), mode: 'insensitive' } } : {}
const [items, total] = await Promise.all([
  prisma.model.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
  prisma.model.count({ where }),
])
return { items, total, page: Number(page), limit: Number(limit) }
```

### Include vs Select
- Never combine `include` and `select` in the same query level (Prisma throws).
- Use `select` on list endpoints for performance.
- Use `include` on detail endpoints for relations.

## Error Codes
| Code | When |
|------|------|
| 400 | Missing required fields, invalid format |
| 401 | No session (handled by global middleware) |
| 403 | Not admin (via `requireAdmin()`) |
| 404 | Entity not found |
| 409 | Unique constraint violation (e.g. duplicate login) |

## Module Dependencies
| Module | Depends On |
|--------|-----------|
| orders | brands, clients, delivery-methods, tax-rates, users |
| clients | users |
| brands | users |
| delivery-methods | brands, users |
| tax-rates | users |
| stats | orders (read-only aggregation) |
| share | orders (read-only, no auth) |
| audit | all modules write to it |
