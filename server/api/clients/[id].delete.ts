import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAdmin } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.client.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Nie znaleziono klienta' })

  if (existing._count.orders > 0) {
    throw createError({
      statusCode: 409,
      message: `Nie można usunąć klienta — ma ${existing._count.orders} zamówień`,
    })
  }

  await prisma.client.delete({ where: { id } })
  await logAudit(event, 'DELETED', 'client', id)

  return { ok: true }
})
