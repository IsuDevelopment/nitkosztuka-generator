import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAdmin } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.deliveryMethod.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Nie znaleziono metody dostawy' })

  const orderCount = await prisma.order.count({ where: { deliveryMethodId: id } })
  if (orderCount > 0) {
    throw createError({ statusCode: 409, message: `Nie można usunąć — przypisana do ${orderCount} zamówień. Dezaktywuj zamiast usuwać.` })
  }

  await prisma.deliveryMethod.delete({ where: { id } })
  await logAudit(event, 'DELETED', 'delivery_method', id)
  return { ok: true }
})
