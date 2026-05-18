import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  return prisma.user.findMany({
    select: { id: true, login: true, name: true, isAdmin: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
})
