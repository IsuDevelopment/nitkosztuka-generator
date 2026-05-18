import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{
    firstName: string
    lastName: string
    email?: string
    phone?: string
    defaultAddress?: string
    notes?: string
  }>(event)

  if (!body?.firstName?.trim() || !body?.lastName?.trim()) {
    throw createError({ statusCode: 400, message: 'Imię i nazwisko są wymagane' })
  }

  const client = await prisma.client.create({
    data: {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email?.trim() ?? null,
      phone: body.phone?.trim() ?? null,
      defaultAddress: body.defaultAddress?.trim() ?? null,
      notes: body.notes?.trim() ?? null,
      createdById: user.id,
    },
  })

  await logAudit(event, 'CREATED', 'client', client.id)
  return client
})
