import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'

interface OrderItemInput {
  id?: string
  name: string
  details?: string
  quantity: number
  unitPrice: number
  materialCost?: number
  sortOrder?: number
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{
    clientId?: string
    brandId?: string
    acceptanceStatus?: string
    paymentStatus?: string
    deliveryStatus?: string
    deliveryMethodId?: string
    deliveryMethodName?: string
    deliveryDetails?: string
    deliveryCost?: number
    leadTime?: string
    discount?: number
    discountNote?: string
    taxRateId?: string
    paymentText?: string
    handmadeText?: string
    shareEnabled?: boolean
    notes?: string
    items?: OrderItemInput[]
  }>(event)

  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Nie znaleziono zamówienia' })

  // Recompute tax if relevant fields changed
  let taxAmount = Number(existing.taxAmount)
  const taxRateId = body.taxRateId !== undefined ? body.taxRateId : existing.taxRateId
  const itemsList = body.items ?? existing.items.map(i => ({
    unitPrice: Number(i.unitPrice), quantity: i.quantity,
  }))
  const itemsTotal = itemsList.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0)
  const discount = body.discount !== undefined ? body.discount : Number(existing.discount)
  const deliveryCost = body.deliveryCost !== undefined ? body.deliveryCost : Number(existing.deliveryCost)
  const revenue = itemsTotal - discount + deliveryCost

  if (taxRateId) {
    const taxRate = await prisma.taxRate.findUnique({ where: { id: taxRateId } })
    if (taxRate) taxAmount = revenue * (Number(taxRate.rate) / 100)
  } else {
    taxAmount = 0
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(body.clientId !== undefined && { clientId: body.clientId }),
      ...(body.brandId !== undefined && { brandId: body.brandId }),
      ...(body.acceptanceStatus !== undefined && { acceptanceStatus: body.acceptanceStatus as never }),
      ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus as never }),
      ...(body.deliveryStatus !== undefined && { deliveryStatus: body.deliveryStatus as never }),
      ...(body.deliveryMethodId !== undefined && { deliveryMethodId: body.deliveryMethodId ?? null }),
      ...(body.deliveryMethodName !== undefined && { deliveryMethodName: body.deliveryMethodName?.trim() ?? null }),
      ...(body.deliveryDetails !== undefined && { deliveryDetails: body.deliveryDetails?.trim() ?? null }),
      ...(body.deliveryCost !== undefined && { deliveryCost: body.deliveryCost }),
      ...(body.leadTime !== undefined && { leadTime: body.leadTime.trim() }),
      ...(body.discount !== undefined && { discount: body.discount }),
      ...(body.discountNote !== undefined && { discountNote: body.discountNote?.trim() ?? null }),
      ...(body.taxRateId !== undefined && { taxRateId: body.taxRateId ?? null }),
      taxAmount,
      ...(body.paymentText !== undefined && { paymentText: body.paymentText.trim() }),
      ...(body.handmadeText !== undefined && { handmadeText: body.handmadeText.trim() }),
      ...(body.shareEnabled !== undefined && { shareEnabled: body.shareEnabled }),
      ...(body.notes !== undefined && { notes: body.notes?.trim() ?? null }),
      ...(body.items !== undefined && {
        items: {
          deleteMany: {},
          create: body.items.map((item, idx) => ({
            name: item.name.trim(),
            details: item.details?.trim() ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            materialCost: item.materialCost ?? 0,
            sortOrder: item.sortOrder ?? idx,
          })),
        },
      }),
    },
    include: { items: true, brand: true, client: true, taxRate: true },
  })

  await logAudit(event, 'UPDATED', 'order', order.id, body as Record<string, unknown>)
  return order
})
