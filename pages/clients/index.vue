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
      class="p-datatable-sm"
      @row-click="e => router.push(`/clients/${e.data.id}`)"
      row-hover
    >
      <Column :header="$t('field.name')">
        <template #body="{ data }">{{ data.lastName }} {{ data.firstName }}</template>
      </Column>
      <Column field="email" :header="$t('field.email')" />
      <Column field="phone" :header="$t('field.phone')" />
      <Column :header="$t('field.orders')">
        <template #body="{ data }">{{ data._count?.orders ?? 0 }}</template>
      </Column>
      <Column style="width: 60px">
        <template #body="{ data }">
          <Button icon="pi pi-angle-right" text rounded size="small" @click.stop="router.push(`/clients/${data.id}`)" />
        </template>
      </Column>
    </DataTable>

    <Paginator
      :rows="50"
      :total-records="total"
      @page="onPage"
    />

    <ClientFormDialog v-model:visible="dialogVisible" @saved="() => refresh()" />
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

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; refresh() }, 350)
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  refresh()
}

function openDialog() {
  dialogVisible.value = true
}
</script>
