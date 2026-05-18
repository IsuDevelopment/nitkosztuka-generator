import { defineEventHandler, createError, getRequestURL } from 'h3'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // Public routes: auth endpoints and share viewer
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/logout',
  ]

  if (!path.startsWith('/api/') || publicPaths.includes(path) || path.startsWith('/api/share/')) {
    return
  }

  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
})
