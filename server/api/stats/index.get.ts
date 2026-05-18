import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { from, to } = getQuery(event)

  const fromDate = from ? new Date(String(from)) : new Date(new Date().getFullYear(), 0, 1)
  const toDate = to ? new Date(String(to)) : new Date()
  toDate.setHours(23, 59, 59, 999)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate } },
    include: { items: true },
    select: {
      id: true,
      createdAt: true,
      acceptanceStatus: true,
      paymentStatus: true,
      deliveryStatus: true,
      deliveryCost: true,
      discount: true,
      taxAmount: true,
      items: {
        select: {
          unitPrice: true,
          materialCost: true,
          quantity: true,
        },
      },
    },
  })

  let totalRevenue = 0
  let totalMaterialCost = 0
  let totalTax = 0

  const byMonth: Record<string, { revenue: number; profit: number; orders: number }> = {}

  for (const order of orders) {
    const itemsTotal = order.items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0)
    const materialsTotal = order.items.reduce((s, i) => s + Number(i.materialCost) * i.quantity, 0)
    const revenue = itemsTotal - Number(order.discount) + Number(order.deliveryCost)
    const tax = Number(order.taxAmount)
    const profit = revenue - materialsTotal

    totalRevenue += revenue
    totalMaterialCost += materialsTotal
    totalTax += tax

    const monthKey = order.createdAt.toISOString().slice(0, 7) // YYYY-MM
    if (!byMonth[monthKey]) byMonth[monthKey] = { revenue: 0, profit: 0, orders: 0 }
    byMonth[monthKey].revenue += revenue
    byMonth[monthKey].profit += profit
    byMonth[monthKey].orders += 1
  }

  const totalNetProfit = totalRevenue - totalMaterialCost
  const totalProfitAfterTax = totalNetProfit - totalTax

  const statusCounts = {
    acceptance: {
      PENDING: orders.filter(o => o.acceptanceStatus === 'PENDING').length,
      ACCEPTED: orders.filter(o => o.acceptanceStatus === 'ACCEPTED').length,
    },
    payment: {
      PENDING: orders.filter(o => o.paymentStatus === 'PENDING').length,
      DEPOSIT_PAID: orders.filter(o => o.paymentStatus === 'DEPOSIT_PAID').length,
      PAID: orders.filter(o => o.paymentStatus === 'PAID').length,
    },
    delivery: {
      PENDING: orders.filter(o => o.deliveryStatus === 'PENDING').length,
      IN_DELIVERY: orders.filter(o => o.deliveryStatus === 'IN_DELIVERY').length,
      DELIVERED: orders.filter(o => o.deliveryStatus === 'DELIVERED').length,
      COMPLETED: orders.filter(o => o.deliveryStatus === 'COMPLETED').length,
    },
  }

  return {
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    totalOrders: orders.length,
    totalRevenue,
    totalMaterialCost,
    totalNetProfit,
    totalTax,
    totalProfitAfterTax,
    avgOrderValue: orders.length ? totalRevenue / orders.length : 0,
    statusCounts,
    byMonth: Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data })),
  }
})
