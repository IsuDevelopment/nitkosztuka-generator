import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  return session?.user ?? null
})
