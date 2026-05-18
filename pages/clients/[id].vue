<template>
  <div>
    <div v-if="pending" class="loading">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <template v-else-if="client">
      <div class="page-header">
        <div>
          <Button icon="pi pi-arrow-left" text @click="router.back()" />
          <h1>{{ client.lastName }} {{ client.firstName }}</h1>
        </div>
        <Button icon="pi pi-pencil" :label="$t('action.edit')" @click="openEditDialog" />
      </div>

      <div class="detail-grid">
        <div class="detail-card">
          <h3>{{ $t('section.clientInfo') }}</h3>
          <div class="detail-row"><span>{{ $t('field.email') }}</span><strong>{{ client.email || '—' }}</strong></div>
          <div class="detail-row"><span>{{ $t('field.phone') }}</span><strong>{{ client.phone || '—' }}</strong></div>
          <div class="detail-row"><span>{{ $t('field.defaultAddress') }}</span><strong>{{ client.defaultAddress || '—' }}</strong></div>
          <div class="detail-row"><span>{{ $t('field.notes') }}</span><strong>{{ client.notes || '—' }}</strong></div>
        </div>
      </div>

      <h2 style="margin: 24px 0 12px">{{ $t('section.orderHistory') }}</h2>
      <DataTable :value="client.orders" class="p-datatable-sm" @row-click="e => router.push(`/orders/${e.data.id}`)" row-hover>
        <Column field="orderNumber" :header="$t('field.orderNumber')" />
        <Column :header="$t('field.brand')">
          <template #body="{ data }">{{ data.brand?.name }}</template>
        </Column>
        <Column :header="$t('field.createdAt')">
          <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
        </Column>
        <Column :header="$t('field.acceptanceStatus')">
          <template #body="{ data }"><OrderStatusBadge type="acceptance" :value="data.acceptanceStatus" /></template>
        </Column>
        <Column :header="$t('field.paymentStatus')">
          <template #body="{ data }"><OrderStatusBadge type="payment" :value="data.paymentStatus" /></template>
        </Column>
      </DataTable>
    </template>

    <ClientFormDialog v-model:visible="editDialogVisible" :edit-client="(client as unknown as Record<string, string>)" @saved="refresh" />
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const route = useRoute()
const router = useRouter()

const { data: client, pending, refresh } = await useFetch(`/api/clients/${route.params.id}`)
const editDialogVisible = ref(false)

function formatDate(d: unknown) {
  if (!d) return '—'
  return new Date(d as string).toLocaleDateString('pl-PL')
}

function openEditDialog() {
  editDialogVisible.value = true
}
</script>
