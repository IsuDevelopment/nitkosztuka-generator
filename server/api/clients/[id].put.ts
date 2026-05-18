import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    defaultAddress?: string
    notes?: string
  }>(event)

  const existing = await prisma.client.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Nie znaleziono klienta' })

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(body.firstName !== undefined && { firstName: body.firstName.trim() }),
      ...(body.lastName !== undefined && { lastName: body.lastName.trim() }),
      ...(body.email !== undefined && { email: body.email?.trim() ?? null }),
      ...(body.phone !== undefined && { phone: body.phone?.trim() ?? null }),
      ...(body.defaultAddress !== undefined && { defaultAddress: body.defaultAddress?.trim() ?? null }),
      ...(body.notes !== undefined && { notes: body.notes?.trim() ?? null }),
    },
  })

  await logAudit(event, 'UPDATED', 'client', client.id, body as Record<string, unknown>)
  return client
})
