import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { search, page = '1', limit = '50' } = getQuery(event)

  const where = search
    ? {
        OR: [
          { firstName: { contains: String(search), mode: 'insensitive' as const } },
          { lastName: { contains: String(search), mode: 'insensitive' as const } },
          { email: { contains: String(search), mode: 'insensitive' as const } },
          { phone: { contains: String(search), mode: 'insensitive' as const } },
        ],
      }
    : {}

  const take = Math.min(Number(limit), 100)
  const skip = (Number(page) - 1) * take

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take,
      skip,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        defaultAddress: true,
        notes: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          where: { deliveryStatus: { in: ['PENDING', 'IN_PRODUCTION', 'IN_DELIVERY'] } },
          select: { id: true },
        },
      },
    }),
    prisma.client.count({ where }),
  ])

  const clientsWithPending = clients.map(c => ({
    ...c,
    pendingOrdersCount: c.orders.length,
    orders: undefined,
  }))

  return { clients: clientsWithPending, total, page: Number(page), limit: take }
})
