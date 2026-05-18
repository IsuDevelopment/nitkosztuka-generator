import type { H3Event } from 'h3'
import { prisma } from '~/server/utils/db'

type AuditAction = 'CREATED' | 'UPDATED' | 'DELETED'

export async function logAudit(
  event: H3Event,
  action: AuditAction,
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown>,
) {
  const session = await getUserSession(event)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return

  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      changes: changes ?? null,
    },
  })
}
