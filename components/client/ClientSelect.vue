<template>
  <div class="client-select">
    <AutoComplete
      v-model="selectedClient"
      :suggestions="suggestions"
      option-label="fullName"
      :placeholder="$t('field.selectOrAddClient')"
      force-selection
      class="w-full"
      @complete="searchClients"
      @item-select="onSelect"
    >
      <template #option="{ option }">
        <div>
          <div>{{ option.fullName }}</div>
          <div style="font-size: 12px; color: var(--muted)">{{ option.email }} {{ option.phone }}</div>
        </div>
      </template>
      <template #footer>
        <div class="autocomplete-add" @mousedown.prevent="openAddDialog">
          <i class="pi pi-plus" /> {{ $t('action.addClient') }}
        </div>
      </template>
    </AutoComplete>

    <ClientFormDialog v-model:visible="addDialogVisible" @saved="onNewClientSaved" />
  </div>
</template>

<script setup lang="ts">
interface ClientOption {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email?: string
  phone?: string
  defaultAddress?: string
}

const props = defineProps<{ modelValue: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [string | null]; 'client-selected': [ClientOption] }>()

const selectedClient = ref<ClientOption | null>(null)
const suggestions = ref<ClientOption[]>([])
const addDialogVisible = ref(false)

async function searchClients(event: { query: string }) {
  const data = await $fetch<{ clients: ClientOption[] }>('/api/clients', {
    query: { search: event.query, limit: 20 },
  })
  suggestions.value = (data.clients ?? []).map(c => ({
    ...c,
    fullName: `${c.lastName} ${c.firstName}`,
  }))
}

function onSelect(event: { value: ClientOption }) {
  emit('update:modelValue', event.value.id)
  emit('client-selected', event.value)
}

function openAddDialog() {
  addDialogVisible.value = true
}

function onNewClientSaved(client: Record<string, unknown>) {
  const option: ClientOption = {
    id: client.id as string,
    firstName: client.firstName as string,
    lastName: client.lastName as string,
    fullName: `${client.lastName} ${client.firstName}`,
    email: client.email as string | undefined,
    phone: client.phone as string | undefined,
    defaultAddress: client.defaultAddress as string | undefined,
  }
  selectedClient.value = option
  emit('update:modelValue', option.id)
  emit('client-selected', option)
}

// Sync external value reset
watch(() => props.modelValue, (v) => {
  if (!v) selectedClient.value = null
})
</script>

<style scoped>
.autocomplete-add {
  padding: 10px 14px;
  cursor: pointer;
  color: var(--accent-dark);
  font-weight: 700;
  font-size: 13px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 6px;
}

.autocomplete-add:hover {
  background: var(--soft);
}
</style>
