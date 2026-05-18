<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.deliveryMethods') }}</h1>
      <Button icon="pi pi-plus" :label="$t('action.add')" @click="openDialog()" />
    </div>

    <DataTable :value="methods" :loading="pending" striped-rows class="p-datatable-sm">
      <Column field="name" :header="$t('field.name')" />
      <Column :header="$t('field.brand')">
        <template #body="{ data }">{{ data.brand?.name ?? '—' }}</template>
      </Column>
      <Column :header="$t('field.defaultCost')">
        <template #body="{ data }">{{ formatMoney(data.defaultCost) }}</template>
      </Column>
      <Column :header="$t('field.active')">
        <template #body="{ data }">
          <Tag :value="data.isActive ? $t('status.active') : $t('status.inactive')" :severity="data.isActive ? 'success' : 'secondary'" />
        </template>
      </Column>
      <Column :header="$t('action.actions')" style="width: 100px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded size="small" @click="openDialog(data)" />
          <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="deleteMethod(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" :header="editItem ? $t('action.edit') : $t('action.add')" modal style="width: 480px">
      <form class="dialog-form" @submit.prevent="save">
        <div class="field">
          <label>{{ $t('field.brand') }} *</label>
          <Select v-model="form.brandId" :options="brands" option-label="name" option-value="id" class="w-full" required />
        </div>
        <div class="field">
          <label>{{ $t('field.name') }} *</label>
          <InputText v-model="form.name" class="w-full" required />
        </div>
        <div class="field">
          <label>{{ $t('field.defaultCost') }}</label>
          <InputNumber v-model="form.defaultCost" mode="decimal" :min-fraction-digits="2" :max-fraction-digits="2" class="w-full" />
        </div>
        <div class="field">
          <label>{{ $t('field.description') }}</label>
          <Textarea v-model="form.description" class="w-full" rows="2" />
        </div>
        <div v-if="editItem" class="field">
          <label>{{ $t('field.active') }}</label>
          <ToggleSwitch v-model="form.isActive" />
        </div>
        <div class="dialog-footer">
          <Button type="button" :label="$t('action.cancel')" severity="secondary" text @click="dialogVisible = false" />
          <Button type="submit" :label="$t('action.save')" :loading="saving" :disabled="saving" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const { data: methodsData, pending, refresh } = await useFetch('/api/delivery-methods')
const { data: brandsData } = await useFetch('/api/brands')
const toast = useToast()

const methods = computed(() => (methodsData.value as Record<string, unknown>[] | null) ?? [])
const brands = computed(() => (brandsData.value as Record<string, string>[] | null) ?? [])

const dialogVisible = ref(false)
const saving = ref(false)
const editItem = ref<{ id: string } | null>(null)

function formatMoney(v: unknown) {
  return Number(v).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł'
}

const emptyForm = () => ({
  brandId: brands.value[0]?.id ?? '',
  name: '',
  defaultCost: 0,
  description: '',
  isActive: true,
})

const form = reactive(emptyForm())

function openDialog(item?: Record<string, unknown>) {
  editItem.value = item ? { id: item.id as string } : null
  if (item) {
    Object.assign(form, {
      brandId: (item.brandId as string) ?? '',
      name: item.name ?? '',
      defaultCost: Number(item.defaultCost ?? 0),
      description: item.description ?? '',
      isActive: item.isActive ?? true,
    })
  } else {
    Object.assign(form, emptyForm())
  }
  dialogVisible.value = true
}

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    if (editItem.value) {
      await $fetch(`/api/delivery-methods/${editItem.value.id}`, { method: 'PUT', body: form })
    } else {
      await $fetch('/api/delivery-methods', { method: 'POST', body: form })
    }
    toast.add({ severity: 'success', summary: 'Zapisano', life: 3000 })
    dialogVisible.value = false
    refresh()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ severity: 'error', summary: e?.data?.message ?? 'Błąd', life: 4000 })
  } finally {
    saving.value = false
  }
}
async function deleteMethod(item: Record<string, unknown>) {
  if (!confirm(`Usunąć metodę dostawy "${item.name}"?`)) return
  try {
    await $fetch(`/api/delivery-methods/${item.id}`, { method: 'DELETE' })
    toast.add({ severity: 'success', summary: 'Usunięto', life: 3000 })
    refresh()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ severity: 'error', summary: e?.data?.message ?? 'Błąd', life: 4000 })
  }
}
</script>
