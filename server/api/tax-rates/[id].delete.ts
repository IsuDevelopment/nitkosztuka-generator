import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.taxRate.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Nie znaleziono stawki podatkowej' })

  if (existing.isDefault) {
    throw createError({ statusCode: 409, message: 'Nie można usunąć domyślnej stawki podatkowej. Ustaw inną jako domyślną przed usunięciem.' })
  }

  await prisma.taxRate.delete({ where: { id } })
  await logAudit(event, 'DELETED', 'tax_rate', id)

  return { ok: true }
})
