import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async () => {
  return prisma.brand.findMany({ orderBy: { name: 'asc' } })
})
