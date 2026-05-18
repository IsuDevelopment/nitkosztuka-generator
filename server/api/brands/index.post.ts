import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{
    name: string
    subtitle?: string
    websiteUrl?: string
    defaultPaymentText?: string
    defaultHandmadeText?: string
    defaultLeadTime?: string
  }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, message: 'Nazwa marki jest wymagana' })
  }

  const brand = await prisma.brand.create({
    data: {
      name: body.name.trim(),
      subtitle: body.subtitle?.trim() ?? null,
      websiteUrl: body.websiteUrl?.trim() ?? null,
      defaultPaymentText: body.defaultPaymentText?.trim() ?? null,
      defaultHandmadeText: body.defaultHandmadeText?.trim() ?? null,
      defaultLeadTime: body.defaultLeadTime?.trim() || '7–10 dni roboczych',
      createdById: user.id,
    },
  })

  await logAudit(event, 'CREATED', 'brand', brand.id)
  return brand
})
