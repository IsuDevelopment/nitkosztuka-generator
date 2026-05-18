import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { brandId, activeOnly } = getQuery(event)
  return prisma.deliveryMethod.findMany({
    where: {
      ...(brandId ? { brandId: String(brandId) } : {}),
      ...(activeOnly === 'true' ? { isActive: true } : {}),
    },
    orderBy: { name: 'asc' },
  })
})
