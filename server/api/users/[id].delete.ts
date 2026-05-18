import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAdmin } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

export default defineEventHandler(async (event) => {
  const actor = await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ reassignToId: string }>(event)

  if (!body?.reassignToId?.trim()) {
    throw createError({ statusCode: 400, message: 'Wymagane jest wskazanie użytkownika do przejęcia zawartości' })
  }

  if (id === actor.id) {
    throw createError({ statusCode: 400, message: 'Nie możesz usunąć własnego konta' })
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) throw createError({ statusCode: 404, message: 'Nie znaleziono użytkownika' })

  const reassignTo = await prisma.user.findUnique({ where: { id: body.reassignToId } })
  if (!reassignTo) throw createError({ statusCode: 404, message: 'Nie znaleziono użytkownika docelowego' })

  if (reassignTo.id === id) {
    throw createError({ statusCode: 400, message: 'Użytkownik docelowy musi być inny niż usuwany' })
  }

  // Prevent deleting the last admin
  if (target.isAdmin) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } })
    if (adminCount <= 1) {
      throw createError({ statusCode: 409, message: 'Nie można usunąć ostatniego administratora' })
    }
  }

  // Reassign all content to target user in a transaction
  await prisma.$transaction([
    prisma.brand.updateMany({ where: { createdById: id }, data: { createdById: body.reassignToId } }),
    prisma.client.updateMany({ where: { createdById: id }, data: { createdById: body.reassignToId } }),
    prisma.deliveryMethod.updateMany({ where: { createdById: id }, data: { createdById: body.reassignToId } }),
    prisma.taxRate.updateMany({ where: { createdById: id }, data: { createdById: body.reassignToId } }),
    prisma.order.updateMany({ where: { createdById: id }, data: { createdById: body.reassignToId } }),
    prisma.auditLog.updateMany({ where: { userId: id }, data: { userId: body.reassignToId } }),
    // Users created by deleted user — set createdById to null (optional field)
    prisma.user.updateMany({ where: { createdById: id }, data: { createdById: null } }),
  ])

  await prisma.user.delete({ where: { id } })
  await logAudit(event, 'DELETED', 'user', id, { reassignedTo: body.reassignToId })

  return { ok: true }
})
