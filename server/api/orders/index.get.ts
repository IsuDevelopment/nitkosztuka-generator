import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const {
    page = '1',
    limit = '25',
    acceptanceStatus,
    paymentStatus,
    deliveryStatus,
    brandId,
    search,
    sortBy = 'createdAt',
    sortDir = 'desc',
  } = getQuery(event)

  const where: Record<string, unknown> = {}
  if (acceptanceStatus) where.acceptanceStatus = String(acceptanceStatus)
  if (paymentStatus) where.paymentStatus = String(paymentStatus)
  if (deliveryStatus) where.deliveryStatus = String(deliveryStatus)
  if (brandId) where.brandId = String(brandId)
  if (search) {
    where.OR = [
      { orderNumber: { contains: String(search), mode: 'insensitive' } },
      { client: { firstName: { contains: String(search), mode: 'insensitive' } } },
      { client: { lastName: { contains: String(search), mode: 'insensitive' } } },
    ]
  }

  const take = Math.min(Number(limit), 100)
  const skip = (Number(page) - 1) * take

  const allowedSort = ['createdAt', 'updatedAt', 'orderNumber']
  const orderByKey = allowedSort.includes(String(sortBy)) ? String(sortBy) : 'createdAt'
  const orderByDir = sortDir === 'asc' ? 'asc' : 'desc'

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { [orderByKey]: orderByDir },
      take,
      skip,
      include: {
        brand: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return { orders, total, page: Number(page), limit: take }
})
