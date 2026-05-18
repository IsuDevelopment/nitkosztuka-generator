import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          acceptanceStatus: true,
          paymentStatus: true,
          deliveryStatus: true,
          brand: { select: { name: true } },
        },
      },
    },
  })

  if (!client) throw createError({ statusCode: 404, message: 'Nie znaleziono klienta' })
  return client
})
