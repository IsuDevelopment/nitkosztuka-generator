import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{
    name?: string
    subtitle?: string
    websiteUrl?: string
    defaultPaymentText?: string
    defaultHandmadeText?: string
    defaultLeadTime?: string
  }>(event)

  const existing = await prisma.brand.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Nie znaleziono marki' })

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.subtitle !== undefined && { subtitle: body.subtitle?.trim() ?? null }),
      ...(body.websiteUrl !== undefined && { websiteUrl: body.websiteUrl?.trim() ?? null }),
      ...(body.defaultPaymentText !== undefined && { defaultPaymentText: body.defaultPaymentText?.trim() ?? null }),
      ...(body.defaultHandmadeText !== undefined && { defaultHandmadeText: body.defaultHandmadeText?.trim() ?? null }),
      ...(body.defaultLeadTime !== undefined && { defaultLeadTime: body.defaultLeadTime?.trim() || '7–10 dni roboczych' }),
    },
  })

  await logAudit(event, 'UPDATED', 'brand', brand.id, body as Record<string, unknown>)
  return brand
})
