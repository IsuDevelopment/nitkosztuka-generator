<template>
  <article class="paper">
    <header class="paper-brand">
      <div>
        <div class="paper-logo">{{ order.brand?.name }}</div>
        <div class="paper-sublogo">{{ order.brand?.subtitle }}</div>
      </div>
      <div class="paper-date">
        <strong>Podsumowanie ustaleń</strong><br>
        Data: {{ formatDate(order.createdAt) }}<br>
        <span class="paper-order-number">{{ order.orderNumber }}</span>
      </div>
    </header>

    <h2>Podsumowanie ustaleń zamówienia</h2>
    <p class="paper-intro">Poniżej znajduje się potwierdzenie najważniejszych informacji dotyczących zamówienia.</p>

    <section class="paper-box">
      <div class="paper-box-title">Dane klienta</div>
      <div class="paper-details-grid">
        <div>
          <span class="paper-label">Imię i nazwisko</span>
          <span class="paper-value">{{ order.client?.lastName }} {{ order.client?.firstName }}</span>
        </div>
        <div v-if="order.client?.phone || order.client?.email">
          <span class="paper-label">Kontakt</span>
          <span class="paper-value">{{ [order.client?.phone, order.client?.email].filter(Boolean).join(' / ') }}</span>
        </div>
      </div>
    </section>

    <section class="paper-box">
      <div class="paper-box-title">Dostawa</div>
      <div class="paper-details-grid">
        <div>
          <span class="paper-label">Forma dostawy</span>
          <span class="paper-value">{{ order.deliveryMethodName || order.deliveryMethod?.name || '—' }}</span>
        </div>
        <div>
          <span class="paper-label">Dane do wysyłki</span>
          <span class="paper-value">{{ order.deliveryDetails || '—' }}</span>
        </div>
      </div>
    </section>

    <section class="paper-box">
      <div class="paper-box-title">Produkty / ustalenia</div>
      <div v-if="!order.items?.length" class="paper-no-items">Brak produktów.</div>
      <div v-for="item in order.items" :key="item.id" class="paper-product">
        <div class="paper-product-line">
          <div>
            <strong>{{ item.name }}</strong>
            <div v-if="item.details" style="white-space: pre-line; color: var(--muted); font-size: 13px;">{{ item.details }}</div>
            <div style="font-size: 13px; margin-top: 4px;">Ilość: {{ item.quantity }} × {{ formatMoney(item.unitPrice) }}</div>
          </div>
          <div class="paper-product-price">{{ formatMoney(Number(item.unitPrice) * item.quantity) }}</div>
        </div>
      </div>
    </section>

    <section class="paper-box">
      <div class="paper-box-title">Płatność</div>
      <table class="paper-money-table">
        <tbody>
          <tr>
            <td>Produkty</td>
            <td>{{ formatMoney(itemsTotal) }}</td>
          </tr>
          <tr v-if="Number(order.discount) > 0">
            <td>Rabat<span v-if="order.discountNote"> ({{ order.discountNote }})</span></td>
            <td>−{{ formatMoney(order.discount) }}</td>
          </tr>
          <tr>
            <td>Dostawa: {{ order.deliveryMethodName || order.deliveryMethod?.name || '—' }}</td>
            <td>{{ formatMoney(order.deliveryCost) }}</td>
          </tr>
          <tr class="paper-total">
            <td>Razem</td>
            <td>{{ formatMoney(grandTotal) }}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 10px; font-size: 14px;">
        Status płatności: <strong>{{ paymentStatusLabel }}</strong>
      </div>
      <div class="paper-note">{{ order.paymentText }}</div>
    </section>

    <section class="paper-box">
      <div class="paper-box-title">Czas realizacji</div>
      <strong>{{ order.leadTime }}</strong>
    </section>

    <section class="paper-handmade-note">
      <strong>Informacja o rękodziele:</strong><br>
      <span>{{ order.handmadeText }}</span>
    </section>

    <footer class="paper-footer">Dziękuję za zamówienie ♡</footer>
  </article>
</template>

<script setup lang="ts">
interface OrderItem {
  id: string
  name: string
  details?: string
  quantity: number
  unitPrice: number | string
  materialCost?: number | string
}

interface OrderData {
  id?: string
  orderNumber?: string
  createdAt?: string
  brand?: { name?: string; subtitle?: string }
  client?: { firstName?: string; lastName?: string; email?: string; phone?: string }
  deliveryMethod?: { name?: string }
  deliveryMethodName?: string
  deliveryDetails?: string
  deliveryCost?: number | string
  discount?: number | string
  discountNote?: string
  taxRateId?: string
  taxAmount?: number | string
  paymentText?: string
  handmadeText?: string
  leadTime?: string
  paymentStatus?: string
  items?: OrderItem[]
}

const props = defineProps<{ order: OrderData }>()

const itemsTotal = computed(() =>
  (props.order.items ?? []).reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0),
)

const grandTotal = computed(() =>
  itemsTotal.value - Number(props.order.discount ?? 0) + Number(props.order.deliveryCost ?? 0),
)

const paymentStatusLabel = computed(() => {
  const map: Record<string, string> = {
    PENDING: 'do opłacenia',
    DEPOSIT_PAID: 'zaliczka opłacona',
    PAID: 'opłacono',
  }
  return map[props.order.paymentStatus ?? ''] ?? '—'
})

function formatMoney(v: number | string | undefined | null) {
  return Number(v ?? 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł'
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pl-PL')
}
</script>

<style scoped>
.paper { font-family: Arial, sans-serif; line-height: 1.45; color: #2d2825; }
.paper h2 { margin: 0 0 6px; font-size: 22px; }
.paper-brand {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 2px solid var(--line);
}
.paper-logo { font-size: 24px; font-weight: 900; color: var(--accent-dark); }
.paper-sublogo { color: var(--muted); font-size: 12px; margin-top: 2px; }
.paper-date { text-align: right; color: var(--muted); font-size: 12px; }
.paper-order-number { font-weight: 800; color: var(--accent-dark); }
.paper-intro { color: var(--muted); font-size: 13px; margin: 0 0 18px; }
.paper-box { margin-bottom: 12px; padding: 13px 15px; border: 1px solid var(--line); border-radius: 14px; }
.paper-box-title { color: var(--accent-dark); font-weight: 900; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }
.paper-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
.paper-label { display: block; color: var(--muted); font-size: 11px; }
.paper-value { display: block; font-weight: 700; font-size: 13px; white-space: pre-line; }
.paper-no-items { color: var(--muted); font-size: 13px; }
.paper-product { padding: 10px 11px; border-radius: 10px; background: var(--soft); margin-bottom: 8px; font-size: 13px; }
.paper-product-line { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start; }
.paper-product-price { font-weight: 800; text-align: right; white-space: nowrap; }
.paper-money-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.paper-money-table td { padding: 6px 0; border-bottom: 1px solid var(--line); }
.paper-money-table td:last-child { text-align: right; font-weight: 800; }
.paper-total td { font-size: 17px; color: var(--accent-dark); border-bottom: 0 !important; padding-top: 10px; }
.paper-note { margin-top: 10px; padding: 10px 12px; border-radius: 12px; background: #fff8f2; border: 1px solid #ead8ca; color: #5f514a; font-size: 12px; }
.paper-handmade-note { margin-top: 10px; padding: 11px 13px; border-radius: 12px; background: #fff8f2; border: 1px solid #ead8ca; color: #5f514a; font-size: 12px; }
.paper-footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid var(--line); text-align: center; color: var(--muted); font-size: 12px; }
</style>
