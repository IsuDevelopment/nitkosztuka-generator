import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.order.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Nie znaleziono zamówienia' })

  await logAudit(event, 'DELETED', 'order', id, { orderNumber: existing.orderNumber })
  await prisma.order.delete({ where: { id } })

  return { ok: true }
})
