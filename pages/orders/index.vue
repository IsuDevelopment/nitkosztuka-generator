<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.orders') }}</h1>
      <NuxtLink to="/orders/new">
        <Button icon="pi pi-plus" :label="$t('action.newOrder')" />
      </NuxtLink>
    </div>

    <div class="filters-bar">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="filters.search" :placeholder="$t('action.search')" @input="debouncedFetch" />
      </IconField>
      <Select v-model="filters.brandId" :options="brandOptions" option-label="label" option-value="value" :placeholder="$t('field.brand')" show-clear @change="() => fetch()" />
      <Select v-model="filters.acceptanceStatus" :options="acceptanceOptions" option-label="label" option-value="value" :placeholder="$t('field.acceptanceStatus')" show-clear @change="() => fetch()" />
      <Select v-model="filters.paymentStatus" :options="paymentOptions" option-label="label" option-value="value" :placeholder="$t('field.paymentStatus')" show-clear @change="() => fetch()" />
      <Select v-model="filters.deliveryStatus" :options="deliveryOptions" option-label="label" option-value="value" :placeholder="$t('field.deliveryStatus')" show-clear @change="() => fetch()" />
    </div>

    <DataTable
      :value="orders"
      :loading="pending"
      striped-rows
      class="p-datatable-sm"
      @row-click="e => router.push(`/orders/${e.data.id}`)"
      row-hover
    >
      <Column field="orderNumber" :header="$t('field.orderNumber')" style="width: 140px" />
      <Column :header="$t('field.client')">
        <template #body="{ data }">{{ data.client?.lastName }} {{ data.client?.firstName }}</template>
      </Column>
      <Column :header="$t('field.brand')">
        <template #body="{ data }">{{ data.brand?.name }}</template>
      </Column>
      <Column :header="$t('field.createdAt')" style="width: 120px">
        <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
      </Column>
      <Column :header="$t('field.acceptanceStatus')" style="width: 140px">
        <template #body="{ data }"><OrderStatusBadge type="acceptance" :value="data.acceptanceStatus" /></template>
      </Column>
      <Column :header="$t('field.paymentStatus')" style="width: 130px">
        <template #body="{ data }"><OrderStatusBadge type="payment" :value="data.paymentStatus" /></template>
      </Column>
      <Column :header="$t('field.deliveryStatus')" style="width: 130px">
        <template #body="{ data }"><OrderStatusBadge type="delivery" :value="data.deliveryStatus" /></template>
      </Column>
      <Column :header="$t('stats.revenue')" style="width: 110px; text-align: right">
        <template #body="{ data }">
          <span class="profit-pos">{{ fmtMoney(data.revenue) }}</span>
        </template>
      </Column>
      <Column :header="$t('stats.netProfit')" style="width: 110px; text-align: right">
        <template #body="{ data }">
          <span :class="data.netProfit >= 0 ? 'profit-pos' : 'profit-neg'">{{ fmtMoney(data.netProfit) }}</span>
        </template>
      </Column>
      <Column style="width: 50px">
        <template #body="{ data }">
          <Button icon="pi pi-angle-right" text rounded size="small" @click.stop="router.push(`/orders/${data.id}`)" />
        </template>
      </Column>
    </DataTable>

    <Paginator :rows="25" :total-records="total" @page="onPage" />
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const router = useRouter()

const { data: brandsData } = await useFetch<{ id: string; name: string }[]>('/api/brands')
const brandOptions = computed(() => (brandsData.value ?? []).map(b => ({ label: b.name, value: b.id })))

const filters = reactive({
  search: '',
  brandId: null as string | null,
  acceptanceStatus: null as string | null,
  paymentStatus: null as string | null,
  deliveryStatus: null as string | null,
})

const page = ref(1)
const { data, pending, refresh: fetch } = await useFetch('/api/orders', {
  query: computed(() => ({
    page: page.value,
    limit: 25,
    search: filters.search || undefined,
    brandId: filters.brandId || undefined,
    acceptanceStatus: filters.acceptanceStatus || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    deliveryStatus: filters.deliveryStatus || undefined,
  })),
})

const orders = computed(() => (data.value as { orders: unknown[] } | null)?.orders ?? [])
const total = computed(() => (data.value as { total: number } | null)?.total ?? 0)

const acceptanceOptions = [
  { label: 'Oczekuje', value: 'PENDING' },
  { label: 'Zaakceptowane', value: 'ACCEPTED' },
]
const paymentOptions = [
  { label: 'Do opłacenia', value: 'PENDING' },
  { label: 'Zaliczka', value: 'DEPOSIT_PAID' },
  { label: 'Opłacone', value: 'PAID' },
]
const deliveryOptions = [
  { label: 'Oczekuje', value: 'PENDING' },
  { label: 'W trakcie', value: 'IN_PRODUCTION' },
  { label: 'W dostawie', value: 'IN_DELIVERY' },
  { label: 'Dostarczone', value: 'DELIVERED' },
  { label: 'Zakończone', value: 'COMPLETED' },
]

function formatDate(d: unknown) {
  if (!d) return '—'
  return new Date(d as string).toLocaleDateString('pl-PL')
}

function fmtMoney(v: number) {
  return Number(v).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł'
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; fetch() }, 350)
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  fetch()
}
</script>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.profit-pos { color: #2e7d32; font-weight: 600; }
.profit-neg { color: #c62828; font-weight: 600; }

:deep(.p-datatable) {
  font-size: 12px;
}
:deep(.p-datatable .p-datatable-thead > tr > th) {
  font-size: 11px;
  padding: 8px 10px;
}
:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 6px 10px;
}
</style>
