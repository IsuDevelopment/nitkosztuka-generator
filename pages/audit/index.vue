<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.audit') }}</h1>
    </div>

    <div class="filters-bar">
      <Select v-model="filters.entityType" :options="entityTypes" option-label="label" option-value="value" :placeholder="$t('field.entityType')" show-clear @change="() => fetch()" />
    </div>

    <DataTable :value="logs" :loading="pending" striped-rows class="p-datatable-sm">
      <Column :header="$t('field.createdAt')" style="width: 140px">
        <template #body="{ data }">{{ formatDateTime(data.createdAt) }}</template>
      </Column>
      <Column :header="$t('field.user')">
        <template #body="{ data }">{{ data.user?.name }}</template>
      </Column>
      <Column :header="$t('field.action')">
        <template #body="{ data }">
          <Tag :value="data.action" :severity="actionSeverity(data.action)" />
        </template>
      </Column>
      <Column field="entityType" :header="$t('field.entityType')" />
      <Column field="entityId" :header="$t('field.entityId')" style="font-size: 11px; font-family: monospace;" />
    </DataTable>

    <Paginator :rows="50" :total-records="total" @page="onPage" />
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const filters = reactive({ entityType: null as string | null })
const page = ref(1)

const { data, pending, refresh: fetch } = await useFetch<{ logs: unknown[]; total: number }>('/api/audit', {
  query: computed(() => ({
    page: page.value,
    limit: 50,
    entityType: filters.entityType || undefined,
  })),
})

const logs = computed(() => data.value?.logs ?? [])
const total = computed(() => data.value?.total ?? 0)

const entityTypes = [
  { label: 'Zamówienia', value: 'order' },
  { label: 'Klienci', value: 'client' },
  { label: 'Marki', value: 'brand' },
  { label: 'Użytkownicy', value: 'user' },
  { label: 'Metody dostawy', value: 'delivery_method' },
  { label: 'Stawki podatkowe', value: 'tax_rate' },
]

function actionSeverity(action: string) {
  if (action === 'CREATED') return 'success'
  if (action === 'DELETED') return 'danger'
  return 'info'
}

function formatDateTime(d: unknown) {
  if (!d) return '—'
  return new Date(d as string).toLocaleString('pl-PL')
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  fetch()
}
</script>

<style scoped>
.filters-bar { display: flex; gap: 10px; margin-bottom: 16px; }
</style>
