<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.users') }}</h1>
      <Button icon="pi pi-plus" :label="$t('action.add')" @click="openDialog()" />
    </div>

    <DataTable :value="users" :loading="pending" striped-rows class="p-datatable-sm">
      <Column field="name" :header="$t('field.name')" />
      <Column field="login" :header="$t('field.login')" />
      <Column :header="$t('field.admin')">
        <template #body="{ data }">
          <Tag v-if="data.isAdmin" value="Admin" severity="warn" />
        </template>
      </Column>
      <Column :header="$t('field.createdAt')">
        <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" :header="$t('action.addUser')" modal style="width: 440px">
      <form class="dialog-form" @submit.prevent="save">
        <div class="field">
          <label>{{ $t('field.name') }} *</label>
          <InputText v-model="form.name" class="w-full" required />
        </div>
        <div class="field">
          <label>{{ $t('field.login') }} *</label>
          <InputText v-model="form.login" class="w-full" autocomplete="off" required />
        </div>
        <div class="field">
          <label>{{ $t('field.password') }} *</label>
          <Password v-model="form.password" :feedback="false" toggle-mask class="w-full" required />
        </div>
        <div class="field-row">
          <label>{{ $t('field.admin') }}</label>
          <ToggleSwitch v-model="form.isAdmin" />
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
const { data: usersData, pending, refresh } = await useFetch('/api/users')
const toast = useToast()

const users = computed(() => (usersData.value as Record<string, unknown>[] | null) ?? [])

const dialogVisible = ref(false)
const saving = ref(false)
const form = reactive({ name: '', login: '', password: '', isAdmin: false })

function formatDate(d: unknown) {
  if (!d) return '—'
  return new Date(d as string).toLocaleDateString('pl-PL')
}

function openDialog() {
  Object.assign(form, { name: '', login: '', password: '', isAdmin: false })
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    await $fetch('/api/users', { method: 'POST', body: form })
    toast.add({ severity: 'success', summary: 'Użytkownik dodany', life: 3000 })
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
