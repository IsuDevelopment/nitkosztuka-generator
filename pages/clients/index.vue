<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.clients') }}</h1>
      <Button icon="pi pi-plus" :label="$t('action.add')" @click="openDialog()" />
    </div>

    <div class="search-bar">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="search" :placeholder="$t('action.search')" @input="debouncedFetch" />
      </IconField>
    </div>

    <DataTable
      :value="clients"
      :loading="pending"
      striped-rows
      class="p-datatable-sm clients-table"
      @row-click="e => router.push(`/clients/${e.data.id}`)"
      row-hover
    >
      <Column :header="$t('field.name')">
        <template #body="{ data }">{{ data.lastName }} {{ data.firstName }}</template>
      </Column>
      <Column field="email" :header="$t('field.email')" />
      <Column field="phone" :header="$t('field.phone')" />
      <Column :header="$t('field.orders')" style="width: 140px">
        <template #body="{ data }">
          <div class="orders-counts">
            <span class="orders-total">{{ data._count?.orders ?? 0 }} {{ $t('info.ordersTotal') }}</span>
            <span v-if="data.pendingOrdersCount > 0" class="orders-pending">{{ data.pendingOrdersCount }} {{ $t('info.ordersInProgress') }}</span>
          </div>
        </template>
      </Column>
      <Column style="width: 100px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button icon="pi pi-pencil" text rounded size="small" @click.stop="openDialog(data)" />
            <Button icon="pi pi-angle-right" text rounded size="small" @click.stop="router.push(`/clients/${data.id}`)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Paginator
      :rows="50"
      :total-records="total"
      @page="onPage"
    />

    <ClientFormDialog v-model:visible="dialogVisible" :edit-client="editingClient" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const router = useRouter()
const search = ref('')
const page = ref(1)

const { data, pending, refresh } = await useFetch('/api/clients', {
  query: computed(() => ({ search: search.value, page: page.value, limit: 50 })),
})

const clients = computed(() => (data.value as { clients: unknown[] } | null)?.clients ?? [])
const total = computed(() => (data.value as { total: number } | null)?.total ?? 0)

const dialogVisible = ref(false)
const editingClient = ref<{ id?: string; firstName?: string; lastName?: string; email?: string; phone?: string; defaultAddress?: string; notes?: string } | null>(null)

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; refresh() }, 350)
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  refresh()
}

function openDialog(client?: Record<string, unknown>) {
  editingClient.value = client ?? null
  dialogVisible.value = true
}

function onSaved() {
  refresh()
}
</script>

<style scoped>
.search-bar {
  margin-bottom: 16px;
}

:deep(.clients-table .p-datatable-tbody > tr) {
  cursor: pointer;
}

:deep(.clients-table .p-datatable-tbody > tr:hover td) {
  background: var(--soft) !important;
}

.orders-counts {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
}

.orders-total {
  font-size: 13px;
  color: var(--text);
}

.orders-pending {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-dark);
}
</style>
