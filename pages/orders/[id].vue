<template>
  <div v-if="!pending && order">
    <div class="page-header">
      <div class="flex items-center gap-3">
        <Button icon="pi pi-arrow-left" text @click="router.back()" />
        <div>
          <h1>{{ order.orderNumber }}</h1>
          <div class="flex gap-2 mt-1">
            <OrderStatusBadge type="acceptance" :value="(order.acceptanceStatus as string)" />
            <OrderStatusBadge type="payment" :value="(order.paymentStatus as string)" />
            <OrderStatusBadge type="delivery" :value="(order.deliveryStatus as string)" />
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <Button icon="pi pi-share-alt" :label="order.shareEnabled ? $t('action.disableShare') : $t('action.enableShare')" :severity="order.shareEnabled ? 'warn' : 'success'" outlined @click="toggleShare" />
        <Button icon="pi pi-print" :label="$t('action.print')" outlined @click="printPage()" />
        <Button icon="pi pi-trash" :label="$t('action.delete')" severity="danger" outlined @click="confirmDelete" />
      </div>
    </div>

    <div class="order-detail-layout">
      <!-- Status panel -->
      <div class="status-panel no-print">
        <div class="status-section">
          <div class="label">{{ $t('field.acceptanceStatus') }}</div>
          <Select v-model="statusForm.acceptanceStatus" :options="acceptanceOptions" option-label="label" option-value="value" class="w-full" @change="saveStatus('acceptanceStatus', statusForm.acceptanceStatus)" />
        </div>
        <div class="status-section">
          <div class="label">{{ $t('field.paymentStatus') }}</div>
          <Select v-model="statusForm.paymentStatus" :options="paymentOptions" option-label="label" option-value="value" class="w-full" @change="saveStatus('paymentStatus', statusForm.paymentStatus)" />
        </div>
        <div class="status-section">
          <div class="label">{{ $t('field.deliveryStatus') }}</div>
          <Select v-model="statusForm.deliveryStatus" :options="deliveryOptions" option-label="label" option-value="value" class="w-full" @change="saveStatus('deliveryStatus', statusForm.deliveryStatus)" />
        </div>

        <Divider />

        <div class="status-section">
          <div class="label">{{ $t('field.shareLink') }}</div>
          <div class="share-link" :class="{ disabled: !order.shareEnabled }">
            <code>{{ shareUrl }}</code>
            <Button icon="pi pi-copy" text size="small" @click="copyShare" />
          </div>
          <div v-if="!order.shareEnabled" class="share-disabled-note">{{ $t('info.shareDisabled') }}</div>
        </div>

        <Divider />

        <div class="status-section">
          <div class="label">{{ $t('field.internalNotes') }}</div>
          <Textarea v-model="notesForm.notes" class="w-full" rows="3" @blur="saveNotes" />
        </div>

        <Divider />

        <div class="status-section">
          <div class="label">{{ $t('field.createdBy') }}</div>
          <div>{{ (order.createdBy as { name?: string } | undefined)?.name }}</div>
          <div class="muted">{{ formatDate(order.createdAt) }}</div>
        </div>
      </div>

      <!-- Preview -->
      <div class="order-preview-wrap">
        <div class="paper">
          <OrderPreview :order="order" />
        </div>

        <div class="copy-section no-print">
          <h3>{{ $t('section.copyMessage') }}</h3>
          <Textarea :value="messageText" readonly class="w-full" rows="12" />
          <Button icon="pi pi-copy" :label="$t('action.copy')" outlined @click="copyMessage" />
        </div>
      </div>
    </div>

    <ConfirmDialog />
  </div>
  <div v-else-if="pending" class="loading">
    <ProgressSpinner />
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const { data: order, pending, refresh } = await useFetch<Record<string, unknown>>(`/api/orders/${route.params.id}`)

const statusForm = reactive({
  acceptanceStatus: '',
  paymentStatus: '',
  deliveryStatus: '',
})

const notesForm = reactive({ notes: '' })

watch(order, (o) => {
  if (!o) return
  statusForm.acceptanceStatus = o.acceptanceStatus as string
  statusForm.paymentStatus = o.paymentStatus as string
  statusForm.deliveryStatus = o.deliveryStatus as string
  notesForm.notes = (o.notes as string) ?? ''
}, { immediate: true })

const shareUrl = computed(() => {
  const hash = order.value?.shareHash as string
  if (!hash || !process.client) return ''
  return `${globalThis.location.origin}/share/${hash}`
})

const messageText = computed(() => {
  if (!order.value) return ''
  const o = order.value
  const items = (o.items as Record<string, unknown>[] ?? [])
  const client = o.client as Record<string, unknown> | undefined
  const delivery = (o.deliveryMethodName as string) || (o.deliveryMethod as Record<string, string> | undefined)?.name || '—'
  const itemsTotal = items.reduce((s, i) => s + Number(i.unitPrice) * Number(i.quantity), 0)
  const grandTotal = itemsTotal - Number(o.discount ?? 0) + Number(o.deliveryCost ?? 0)
  const fmt = (v: number) => v.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł'

  const productLines = items.map((i) =>
    `- ${i.name}\n  Ustalenia: ${i.details || '—'}\n  Ilość: ${i.quantity} × ${fmt(Number(i.unitPrice))} = ${fmt(Number(i.unitPrice) * Number(i.quantity))}`,
  ).join('\n\n')

  return `Dzień dobry 😊\n\nPrzesyłam podsumowanie ustaleń dotyczących zamówienia ${o.orderNumber}.\n\nDANE KLIENTA\nImię i nazwisko: ${client?.lastName} ${client?.firstName}\nKontakt: ${[client?.phone, client?.email].filter(Boolean).join(' / ') || '—'}\n\nDOSTAWA\nForma dostawy: ${delivery}\nDane do wysyłki:\n${o.deliveryDetails || '—'}\n\nPRODUKTY / USTALENIA\n${productLines || '—'}\n\nPŁATNOŚĆ\nProdukty: ${fmt(itemsTotal)}\nDostawa: ${fmt(Number(o.deliveryCost ?? 0))}\nRazem: ${fmt(grandTotal)}\n\n${o.paymentText || ''}\n\nCZAS REALIZACJI\n${o.leadTime}\n\nINFORMACJA O RĘKODZIELE\n${o.handmadeText || ''}\n\nDziękuję za zamówienie ❤️`
})

async function saveStatus(field: string, value: string) {
  try {
    await $fetch(`/api/orders/${route.params.id}`, { method: 'PUT', body: { [field]: value } })
    toast.add({ severity: 'success', summary: 'Zapisano', life: 2000 })
    refresh()
  } catch {
    toast.add({ severity: 'error', summary: 'Błąd zapisu', life: 3000 })
  }
}

async function saveNotes() {
  await $fetch(`/api/orders/${route.params.id}`, { method: 'PUT', body: { notes: notesForm.notes } })
}

async function toggleShare() {
  await $fetch(`/api/orders/${route.params.id}/toggle-share`, { method: 'POST' })
  refresh()
}

function copyShare() {
  navigator.clipboard.writeText(shareUrl.value)
  toast.add({ severity: 'info', summary: 'Skopiowano link', life: 2000 })
}

function copyMessage() {
  navigator.clipboard.writeText(messageText.value)
  toast.add({ severity: 'info', summary: 'Skopiowano wiadomość', life: 2000 })
}

function formatDate(d: unknown) {
  if (!d) return '—'
  return new Date(d as string).toLocaleDateString('pl-PL')
}

function confirmDelete() {
  confirm.require({
    header: 'Usuń zamówienie',
    message: `Czy na pewno chcesz usunąć zamówienie ${order.value?.orderNumber}? Ta operacja jest nieodwracalna.`,
    accept: async () => {
      await $fetch(`/api/orders/${route.params.id}`, { method: 'DELETE' })
      toast.add({ severity: 'success', summary: 'Zamówienie usunięte', life: 3000 })
      router.push('/orders')
    },
    acceptLabel: 'Usuń',
    rejectLabel: 'Anuluj',

  })
}

const acceptanceOptions = [
  { label: 'Oczekuje', value: 'PENDING' },
  { label: 'Zaakceptowane', value: 'ACCEPTED' },
]
const paymentOptions = [
  { label: 'Do opłacenia', value: 'PENDING' },
  { label: 'Zaliczka opłacona', value: 'DEPOSIT_PAID' },
  { label: 'Opłacone', value: 'PAID' },
]
const deliveryOptions = [
  { label: 'Oczekuje', value: 'PENDING' },
  { label: 'W dostawie', value: 'IN_DELIVERY' },
  { label: 'Dostarczone', value: 'DELIVERED' },
  { label: 'Zakończone', value: 'COMPLETED' },
]

// Print helper
function printPage() {
  if (process.client) window.print()
}
</script>

<style scoped>
.order-detail-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
  align-items: start;
}

.status-panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 18px;
  position: sticky;
  top: 24px;
}

.status-section { margin-bottom: 14px; }
.label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
.muted { color: var(--muted); font-size: 12px; }

.share-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--soft);
  border-radius: 8px;
  font-size: 11px;
  word-break: break-all;
}

.share-link.disabled {
  opacity: 0.5;
  text-decoration: line-through;
}

.share-disabled-note { font-size: 11px; color: #a24d4d; margin-top: 4px; }

.order-preview-wrap { min-width: 0; }

.copy-section {
  margin-top: 24px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 18px;
}

.copy-section h3 { margin: 0 0 12px; font-size: 14px; }

@media (max-width: 900px) {
  .order-detail-layout {
    grid-template-columns: 1fr;
  }
  .status-panel { position: static; }
}
</style>
