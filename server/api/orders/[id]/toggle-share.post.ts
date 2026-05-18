import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!

  const order = await prisma.order.findUnique({ where: { id }, select: { id: true, shareEnabled: true } })
  if (!order) throw createError({ statusCode: 404, message: 'Nie znaleziono zamówienia' })

  return prisma.order.update({
    where: { id },
    data: { shareEnabled: !order.shareEnabled },
    select: { id: true, shareEnabled: true },
  })
})
