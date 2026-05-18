---
name: add-api-endpoint
description: "Add a new server API endpoint to an existing or new module."
---

# Skill: Add API Endpoint

## Inputs Required
- Module name (e.g. `orders`, `clients`, `brands`)
- HTTP method (`get`, `post`, `put`, `delete`)
- Route type: collection (`index`) or resource (`[id]`) or custom action (`[id]/action`)
- Whether it requires admin auth

## Steps

1. **Create file** at `server/api/{module}/{route}.{method}.ts`.

2. **Use this template:**
```ts
import { defineEventHandler, readBody, getRouterParam, getQuery, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // For resource routes:
  // const id = getRouterParam(event, 'id')!

  // For POST/PUT:
  // const body = await readBody<BodyType>(event)

  // Validate
  // if (!body?.requiredField) throw createError({ statusCode: 400, message: 'Field required' })

  // Execute
  // const result = await prisma.model.create/update/delete(...)

  // Audit
  // await logAudit(event, 'CREATED', 'entity-type', result.id)

  // return result
})
```

3. **For admin-only endpoints**, replace `requireAuth` with `requireAdmin`:
```ts
import { requireAdmin } from '~/server/utils/auth'
const user = await requireAdmin(event)
```

4. **For public endpoints** (no auth):
   - Do NOT call `requireAuth()`.
   - Add path to `publicPaths` in `server/middleware/auth.ts`.

5. **Validation rules:**
   - Required fields: throw 400.
   - Not found: throw 404.
   - Unique violations: throw 409.
   - Use `String()` to sanitize query params.

6. **After creation:**
   - Add corresponding frontend (page or component action).
   - Add translations to `i18n/pl.json` if new user-visible strings.
   - Run `npx nuxi typecheck` to verify.

## Checklist
- [ ] File created at correct path with correct method suffix
- [ ] Auth check at top of handler
- [ ] Input validation with proper error codes
- [ ] Prisma query executed
- [ ] `logAudit()` called for mutations
- [ ] No `include` + `select` combined in same Prisma query
- [ ] Monetary values handled as `Decimal`, cast with `Number()`
- [ ] TypeScript compiles clean
