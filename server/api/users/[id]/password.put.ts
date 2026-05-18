import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/db'
import { requireAdmin } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ newPassword: string }>(event)

  if (!body?.newPassword) {
    throw createError({ statusCode: 400, message: 'Nowe hasło jest wymagane' })
  }
  if (body.newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'Hasło musi mieć co najmniej 8 znaków' })
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) throw createError({ statusCode: 404, message: 'Użytkownik nie istnieje' })

  const passwordHash = await bcrypt.hash(body.newPassword, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash } })

  await logAudit(event, 'UPDATED', 'user', id, { passwordChanged: true })

  return { ok: true }
})
