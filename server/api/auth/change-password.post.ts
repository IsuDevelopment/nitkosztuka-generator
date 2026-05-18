import { defineEventHandler, readBody, createError } from 'h3'
import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ currentPassword: string; newPassword: string }>(event)

  if (!body?.currentPassword || !body?.newPassword) {
    throw createError({ statusCode: 400, message: 'Wszystkie pola są wymagane' })
  }
  if (body.newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'Nowe hasło musi mieć co najmniej 8 znaków' })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) throw createError({ statusCode: 404, message: 'Użytkownik nie istnieje' })

  const valid = await bcrypt.compare(body.currentPassword, dbUser.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Aktualne hasło jest nieprawidłowe' })
  }

  const newHash = await bcrypt.hash(body.newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  return { ok: true }
})
