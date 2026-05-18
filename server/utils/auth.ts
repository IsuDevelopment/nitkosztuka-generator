import type { H3Event } from 'h3'
import { createError } from 'h3'

export async function requireAuth(event: H3Event) {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return session.user as { id: string; login: string; name: string; isAdmin: boolean }
}

export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event)
  if (!user.isAdmin) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return user
}
