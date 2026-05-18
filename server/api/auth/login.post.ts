import { defineEventHandler, readBody, createError } from 'h3'
import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ login: string; password: string }>(event)

  if (!body?.login || !body?.password) {
    throw createError({ statusCode: 400, message: 'Login i hasło są wymagane' })
  }

  const user = await prisma.user.findUnique({
    where: { login: body.login.trim().toLowerCase() },
  })

  if (!user) {
    throw createError({ statusCode: 401, message: 'Nieprawidłowy login lub hasło' })
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Nieprawidłowy login lub hasło' })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      login: user.login,
      name: user.name,
      isAdmin: user.isAdmin,
    },
  })

  return { ok: true }
})
