import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{
    brandId: string
    name: string
    defaultCost?: number
    description?: string
  }>(event)

  if (!body?.brandId || !body?.name?.trim()) {
    throw createError({ statusCode: 400, message: 'brandId i nazwa są wymagane' })
  }

  const method = await prisma.deliveryMethod.create({
    data: {
      brandId: body.brandId,
      name: body.name.trim(),
      defaultCost: body.defaultCost ?? 0,
      description: body.description?.trim() ?? null,
      createdById: user.id,
    },
  })

  await logAudit(event, 'CREATED', 'delivery_method', method.id)
  return method
})
