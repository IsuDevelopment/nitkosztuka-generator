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
      include: { _count: { select: { orders: true } } },
    }),
    prisma.client.count({ where }),
  ])

  return { clients, total, page: Number(page), limit: take }
})
