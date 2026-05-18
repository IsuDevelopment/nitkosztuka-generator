import { defineEventHandler, getRouterParam, sendRedirect } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const hash = getRouterParam(event, 'hash')!

  const order = await prisma.order.findUnique({
    where: { shareHash: hash },
    include: {
      brand: true,
      client: true,
      taxRate: true,
      items: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!order || !order.shareEnabled) {
    const fallbackUrl = order?.shareEnabled === false
      ? (await prisma.brand.findUnique({ where: { id: order.brandId } }))?.websiteUrl
      : null
    return sendRedirect(event, fallbackUrl || '/', 302)
  }

  return order
})
