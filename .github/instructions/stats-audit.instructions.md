---
description: "Stats dashboard and audit log — read-only analytics modules."
applyTo: "server/api/stats/**,server/api/audit/**,pages/index.vue,pages/audit/**"
---

# Stats & Audit Modules

## Stats Dashboard (`pages/index.vue`)

### Purpose
Financial overview with date-range filtering. Shows KPI cards, status counts, and revenue/profit chart.

### API: `GET /api/stats?from=ISO&to=ISO`
Returns:
```ts
{
  period: { from, to },
  totalOrders: number,
  totalRevenue: number,        // sum(itemsTotal - discount + deliveryCost)
  totalMaterialCost: number,   // sum(materialCost * quantity)
  totalNetProfit: number,      // revenue - materialCost
  totalTax: number,            // sum(taxAmount)
  totalProfitAfterTax: number, // netProfit - tax
  avgOrderValue: number,
  statusCounts: { acceptance, payment, delivery },
  byMonth: [{ month, revenue, profit, orders }]
}
```

### Calculation Rules
- Revenue = itemsTotal - discount + deliveryCost (per order)
- Material cost = sum of (item.materialCost × item.quantity)
- Net profit = revenue - material cost
- Tax = stored `taxAmount` (computed at creation)
- Profit after tax = net profit - tax
- `byMonth` array is for Chart.js bar chart

### Frontend Features
- Date range picker with quick presets: "Ten miesiąc", "Ten rok", "30 dni", "90 dni"
- KPI grid (7 cards)
- Status counts summary (3 groups)
- Bar chart: revenue vs profit by month (PrimeVue Chart component)

---

## Audit Log (`pages/audit/index.vue`)

### Purpose
Admin-only view of all system mutations. Provides accountability trail.

### API: `GET /api/audit?page=1&limit=50&entityType=order`
Returns paginated list of audit entries with user name.

### AuditLog Model
```
{ id, userId, action, entityType, entityId, changes (JSON), createdAt }
```

### Logging Rule
Every CRUD mutation endpoint must call:
```ts
await logAudit(event, 'CREATED' | 'UPDATED' | 'DELETED', entityType, entityId, changes?)
```
- `entityType` values: `user`, `brand`, `client`, `order`, `delivery-method`, `tax-rate`
- `changes` is optional object with changed field values (for UPDATE)
- `logAudit()` reads userId from session automatically

### Frontend
- DataTable with columns: date, user, action, entity type, entity ID
- Filter by entityType (Select dropdown)
- Admin-only page (requireAdmin in API)
