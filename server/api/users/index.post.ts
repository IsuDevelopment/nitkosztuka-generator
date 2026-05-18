import { defineEventHandler, readBody, createError } from 'h3'
import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const creator = await requireAuth(event)
  const body = await readBody<{ login: string; password: string; name: string; isAdmin?: boolean }>(event)

  if (!body?.login?.trim() || !body?.password || !body?.name?.trim()) {
    throw createError({ statusCode: 400, message: 'Login, hasło i imię są wymagane' })
  }

  if (body.password.length < 8) {
    throw createError({ statusCode: 400, message: 'Hasło musi mieć co najmniej 8 znaków' })
  }

  const existing = await prisma.user.findUnique({ where: { login: body.login.trim().toLowerCase() } })
  if (existing) {
    throw createError({ statusCode: 409, message: 'Użytkownik o tym loginie już istnieje' })
  }

  const passwordHash = await bcrypt.hash(body.password, 12)

  const user = await prisma.user.create({
    data: {
      login: body.login.trim().toLowerCase(),
      passwordHash,
      name: body.name.trim(),
      isAdmin: body.isAdmin ?? false,
      createdById: creator.id,
    },
    select: { id: true, login: true, name: true, isAdmin: true, createdAt: true },
  })

  await logAudit(event, 'CREATED', 'user', user.id)
  return user
})
