<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.taxRates') }}</h1>
      <Button icon="pi pi-plus" :label="$t('action.add')" @click="openDialog()" />
    </div>

    <DataTable :value="rates" :loading="pending" striped-rows class="p-datatable-sm">
      <Column field="name" :header="$t('field.name')" />
      <Column :header="$t('field.rate')">
        <template #body="{ data }">{{ data.rate }}%</template>
      </Column>
      <Column :header="$t('field.default')">
        <template #body="{ data }">
          <Tag v-if="data.isDefault" value="Domyślna" severity="info" />
        </template>
      </Column>
      <Column :header="$t('action.actions')" style="width: 120px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded size="small" @click="openDialog(data)" />
          <Button icon="pi pi-trash" text rounded size="small" severity="danger" :disabled="data.isDefault" :title="data.isDefault ? 'Domyślna stawka — nie można usunąć' : $t('action.delete')" @click="confirmDelete(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" :header="editItem ? $t('action.edit') : $t('action.add')" modal style="width: 400px">      <form class="dialog-form" @submit.prevent="save">
        <div class="field">
          <label>{{ $t('field.name') }} *</label>
          <InputText v-model="form.name" class="w-full" placeholder="np. Ryczałt 12%" required />
        </div>
        <div class="field">
          <label>{{ $t('field.rate') }} % *</label>
          <InputNumber v-model="form.rate" :min-fraction-digits="1" :max-fraction-digits="2" :min="0" :max="100" class="w-full" required />
        </div>
        <div class="field-row">
          <label>{{ $t('field.default') }}</label>
          <ToggleSwitch v-model="form.isDefault" />
        </div>
        <div v-if="editItem" class="field-row">
          <label>{{ $t('field.active') }}</label>
          <ToggleSwitch v-model="form.isActive" />
        </div>
        <div class="dialog-footer">
          <Button type="button" :label="$t('action.cancel')" severity="secondary" text @click="dialogVisible = false" />
          <Button type="submit" :label="$t('action.save')" :loading="saving" />
        </div>
      </form>
    </Dialog>

    <Dialog :visible="!!deleteTarget" :header="$t('action.delete')" modal style="width: 420px" @update:visible="deleteTarget = null">
      <p>Czy na pewno chcesz usunąć stawkę <strong>{{ deleteTarget?.name }}</strong>? Zamówienia używające tej stawki zachowają wyliczoną kwotę podatku, ale stracą powiązanie ze stawką.</p>
      <div class="dialog-footer">
        <Button :label="$t('action.cancel')" severity="secondary" text @click="deleteTarget = null" />
        <Button :label="$t('action.delete')" severity="danger" :loading="deleting" @click="doDelete" />
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const { data: ratesData, pending, refresh } = await useFetch('/api/tax-rates')
const toast = useToast()

const rates = computed(() => (ratesData.value as Record<string, unknown>[] | null) ?? [])

const dialogVisible = ref(false)
const saving = ref(false)
const editItem = ref<{ id: string } | null>(null)

const emptyForm = () => ({ name: '', rate: 12, isDefault: false, isActive: true })
const form = reactive(emptyForm())

function openDialog(item?: Record<string, unknown>) {
  editItem.value = item ? { id: item.id as string } : null
  if (item) {
    Object.assign(form, {
      name: item.name ?? '',
      rate: Number(item.rate ?? 12),
      isDefault: item.isDefault ?? false,
      isActive: item.isActive ?? true,
    })
  } else {
    Object.assign(form, emptyForm())
  }
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    if (editItem.value) {
      await $fetch(`/api/tax-rates/${editItem.value.id}`, { method: 'PUT', body: form })
    } else {
      await $fetch('/api/tax-rates', { method: 'POST', body: form })
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

const deleteTarget = ref<{ id: string; name: string } | null>(null)
const deleting = ref(false)

function confirmDelete(item: { id: string; name: string }) {
  deleteTarget.value = item
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/tax-rates/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ severity: 'success', summary: 'Stawka usunięta', life: 3000 })
    deleteTarget.value = null
    refresh()
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ severity: 'error', summary: e?.data?.message ?? 'Błąd', life: 4000 })
  } finally {
    deleting.value = false
  }
}
</script>
