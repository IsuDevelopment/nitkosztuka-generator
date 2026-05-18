import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{
    name?: string
    defaultCost?: number
    description?: string
    isActive?: boolean
  }>(event)

  const existing = await prisma.deliveryMethod.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Nie znaleziono metody dostawy' })

  const method = await prisma.deliveryMethod.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.defaultCost !== undefined && { defaultCost: body.defaultCost }),
      ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })

  await logAudit(event, 'UPDATED', 'delivery_method', method.id, body as Record<string, unknown>)
  return method
})
