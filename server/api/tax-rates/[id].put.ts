import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ name?: string; rate?: number; isDefault?: boolean; isActive?: boolean }>(event)

  const existing = await prisma.taxRate.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Nie znaleziono stawki podatkowej' })

  if (body.isDefault) {
    await prisma.taxRate.updateMany({ where: { id: { not: id } }, data: { isDefault: false } })
  }

  const taxRate = await prisma.taxRate.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.rate !== undefined && { rate: body.rate }),
      ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })

  await logAudit(event, 'UPDATED', 'tax_rate', taxRate.id, body as Record<string, unknown>)
  return taxRate
})
