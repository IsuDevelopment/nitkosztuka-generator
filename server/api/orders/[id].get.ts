import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      brand: true,
      client: true,
      deliveryMethod: true,
      taxRate: true,
      items: { orderBy: { sortOrder: 'asc' } },
      createdBy: { select: { id: true, name: true, login: true } },
    },
  })

  if (!order) throw createError({ statusCode: 404, message: 'Nie znaleziono zamówienia' })
  return order
})
