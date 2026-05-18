import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ name: string; rate: number; isDefault?: boolean }>(event)

  if (!body?.name?.trim() || body?.rate == null) {
    throw createError({ statusCode: 400, message: 'Nazwa i stawka są wymagane' })
  }

  if (body.isDefault) {
    await prisma.taxRate.updateMany({ data: { isDefault: false } })
  }

  const taxRate = await prisma.taxRate.create({
    data: {
      name: body.name.trim(),
      rate: body.rate,
      isDefault: body.isDefault ?? false,
      createdById: user.id,
    },
  })

  await logAudit(event, 'CREATED', 'tax_rate', taxRate.id)
  return taxRate
})
