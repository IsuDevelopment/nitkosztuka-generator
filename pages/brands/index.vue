<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.brands') }}</h1>
      <Button icon="pi pi-plus" :label="$t('action.add')" @click="openDialog()" />
    </div>

    <DataTable :value="brands" :loading="pending" striped-rows class="p-datatable-sm">
      <Column field="name" :header="$t('field.name')" />
      <Column field="subtitle" :header="$t('field.subtitle')" />
      <Column field="defaultLeadTime" :header="$t('field.defaultLeadTime')" />
      <Column :header="$t('action.actions')" style="width: 100px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded size="small" @click="openDialog(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" :header="editItem ? $t('action.edit') : $t('action.add')" modal style="width: 540px">
      <form class="dialog-form" @submit.prevent="save">
        <div class="field">
          <label>{{ $t('field.name') }} *</label>
          <InputText v-model="form.name" class="w-full" required />
        </div>
        <div class="field">
          <label>{{ $t('field.subtitle') }}</label>
          <InputText v-model="form.subtitle" class="w-full" />
        </div>
        <div class="field">
          <label>{{ $t('field.websiteUrl') }}</label>
          <InputText v-model="form.websiteUrl" class="w-full" placeholder="https://" />
        </div>
        <div class="field">
          <label>{{ $t('field.defaultLeadTime') }}</label>
          <InputText v-model="form.defaultLeadTime" class="w-full" />
        </div>
        <div class="field">
          <label>{{ $t('field.defaultPaymentText') }}</label>
          <Textarea v-model="form.defaultPaymentText" class="w-full" rows="3" />
        </div>
        <div class="field">
          <label>{{ $t('field.defaultHandmadeText') }}</label>
          <Textarea v-model="form.defaultHandmadeText" class="w-full" rows="3" />
        </div>
        <div class="dialog-footer">
          <Button type="button" :label="$t('action.cancel')" severity="secondary" text @click="dialogVisible = false" />
          <Button type="submit" :label="$t('action.save')" :loading="saving" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const { data: brands, pending, refresh } = await useFetch('/api/brands')
const toast = useToast()

const dialogVisible = ref(false)
const saving = ref(false)
const editItem = ref<{ id: string } | null>(null)

const emptyForm = () => ({
  name: '',
  subtitle: '',
  websiteUrl: '',
  defaultLeadTime: '7–10 dni roboczych',
  defaultPaymentText: '',
  defaultHandmadeText: '',
})

const form = reactive(emptyForm())

function openDialog(item?: Record<string, string>) {
  editItem.value = item ? { id: item.id } : null
  if (item) {
    Object.assign(form, {
      name: item.name ?? '',
      subtitle: item.subtitle ?? '',
      websiteUrl: item.websiteUrl ?? '',
      defaultLeadTime: item.defaultLeadTime ?? '7–10 dni roboczych',
      defaultPaymentText: item.defaultPaymentText ?? '',
      defaultHandmadeText: item.defaultHandmadeText ?? '',
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
      await $fetch(`/api/brands/${editItem.value.id}`, { method: 'PUT', body: form })
    } else {
      await $fetch('/api/brands', { method: 'POST', body: form })
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
</script>
