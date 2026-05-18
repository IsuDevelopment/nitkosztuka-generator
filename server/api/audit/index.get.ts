import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const { page = '1', limit = '50', entityType, userId } = getQuery(event)

  const take = Math.min(Number(limit), 100)
  const skip = (Number(page) - 1) * take

  const where: Record<string, unknown> = {}
  if (entityType) where.entityType = String(entityType)
  if (userId) where.userId = String(userId)

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: { user: { select: { id: true, name: true, login: true } } },
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total, page: Number(page), limit: take }
})
