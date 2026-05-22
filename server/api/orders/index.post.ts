import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { logAudit } from '~/server/utils/audit'
import { generateShareHash, buildOrderNumber } from '~/server/utils/helpers'

interface OrderItemInput {
  name: string
  details?: string
  quantity: number
  unitPrice: number
  materialCost?: number
  sortOrder?: number
}

interface CreateOrderBody {
  brandId: string
  clientId: string
  deliveryMethodId?: string
  deliveryDetails?: string
  deliveryCost?: number
  leadTime?: string
  discount?: number
  discountNote?: string
  taxRateId?: string
  paymentText: string
  handmadeText: string
  notes?: string
  items: OrderItemInput[]
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<CreateOrderBody>(event)

  if (!body?.brandId || !body?.clientId) {
    throw createError({ statusCode: 400, message: 'brandId i clientId są wymagane' })
  }
  if (!body.items?.length) {
    throw createError({ statusCode: 400, message: 'Zamówienie musi mieć co najmniej jeden produkt' })
  }

  const brand = await prisma.brand.findUnique({ where: { id: body.brandId } })
  if (!brand) throw createError({ statusCode: 404, message: 'Nie znaleziono marki' })

  // Generate order number
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const count = await prisma.order.count({
    where: { brandId: body.brandId, createdAt: { gte: new Date(`${year}-01-01`) } },
  })
  const orderNumber = buildOrderNumber(brand.name, year, month, count + 1)

  // Snapshot delivery method name from DB — never trust frontend string
  let snapshotDeliveryMethodName: string | null = null
  if (body.deliveryMethodId) {
    const method = await prisma.deliveryMethod.findUnique({ where: { id: body.deliveryMethodId } })
    if (!method) throw createError({ statusCode: 400, message: 'Nie znaleziono metody dostawy' })
    snapshotDeliveryMethodName = method.name
  }

  // Compute tax
  const itemsTotal = body.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const revenue = itemsTotal - (body.discount ?? 0) + (body.deliveryCost ?? 0)
  let taxAmount = 0
  if (body.taxRateId) {
    const taxRate = await prisma.taxRate.findUnique({ where: { id: body.taxRateId } })
    if (taxRate) {
      taxAmount = revenue * (Number(taxRate.rate) / 100)
    }
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      brandId: body.brandId,
      clientId: body.clientId,
      deliveryMethodId: body.deliveryMethodId ?? null,
      deliveryMethodName: snapshotDeliveryMethodName,
      deliveryDetails: body.deliveryDetails?.trim() ?? null,
      deliveryCost: body.deliveryCost ?? 0,
      leadTime: body.leadTime?.trim() || brand.defaultLeadTime,
      discount: body.discount ?? 0,
      discountNote: body.discountNote?.trim() ?? null,
      taxRateId: body.taxRateId ?? null,
      taxAmount,
      paymentText: body.paymentText?.trim() || (brand.defaultPaymentText ?? ''),
      handmadeText: body.handmadeText?.trim() || (brand.defaultHandmadeText ?? ''),
      shareHash: generateShareHash(),
      notes: body.notes?.trim() ?? null,
      createdById: user.id,
      items: {
        create: body.items.map((item, idx) => ({
          name: item.name.trim(),
          details: item.details?.trim() ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          materialCost: item.materialCost ?? 0,
          sortOrder: item.sortOrder ?? idx,
        })),
      },
    },
    include: {
      items: true,
      brand: true,
      client: true,
      taxRate: true,
    },
  })

  await logAudit(event, 'CREATED', 'order', order.id)
  return order
})
