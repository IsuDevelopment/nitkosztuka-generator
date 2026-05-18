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
      <Column style="width: 100px">
        <template #body="{ data }">
          <Button icon="pi pi-key" text rounded size="small" :title="$t('action.changePassword')" @click="openPasswordDialog(data)" />
          <Button icon="pi pi-trash" text rounded size="small" severity="danger" :title="$t('action.delete')" @click="openDeleteDialog(data)" />
        </template>
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

    <Dialog v-model:visible="pwDialogVisible" :header="$t('action.changePassword')" modal style="width: 380px">
      <form class="dialog-form" @submit.prevent="savePassword">
        <div class="field">
          <label>{{ $t('field.name') }}</label>
          <div style="font-weight:700">{{ pwTarget?.name }}</div>
        </div>
        <div class="field">
          <label>{{ $t('field.newPassword') }} *</label>
          <Password v-model="pwForm.newPassword" :feedback="false" toggle-mask class="w-full" required />
        </div>
        <div class="field">
          <label>{{ $t('field.confirmPassword') }} *</label>
          <Password v-model="pwForm.confirmPassword" :feedback="false" toggle-mask class="w-full" required />
        </div>
        <div class="dialog-footer">
          <Button type="button" :label="$t('action.cancel')" severity="secondary" text @click="pwDialogVisible = false" />
          <Button type="submit" :label="$t('action.save')" :loading="pwSaving" />
        </div>
      </form>
    </Dialog>

    <Dialog :visible="!!deleteTarget" header="Usuń użytkownika" modal style="width: 460px" @update:visible="deleteTarget = null">
      <p>Użytkownik <strong>{{ deleteTarget?.name }}</strong> zostanie trwale usunięty. Wskaż użytkownika, który przejmie całą przypisaną zawartość (zamówienia, klientów, marki itp.):</p>
      <div class="field" style="margin-top: 1rem">
        <label>Przekaż zawartość do *</label>
        <Select
          v-model="deleteReassignId"
          :options="otherUsers"
          option-label="name"
          option-value="id"
          placeholder="Wybierz użytkownika"
          class="w-full"
        />
      </div>
      <div class="dialog-footer">
        <Button :label="$t('action.cancel')" severity="secondary" text @click="deleteTarget = null" />
        <Button label="Usuń i przekaż" severity="danger" :disabled="!deleteReassignId" :loading="deleting" @click="doDeleteUser" />
      </div>
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
const pwDialogVisible = ref(false)
const pwSaving = ref(false)
const pwTarget = ref<{ id: string; name: string } | null>(null)
const pwForm = reactive({ newPassword: '', confirmPassword: '' })

function openPasswordDialog(user: { id: string; name: string }) {
  pwTarget.value = user
  pwForm.newPassword = ''
  pwForm.confirmPassword = ''
  pwDialogVisible.value = true
}

async function savePassword() {
  if (pwForm.newPassword !== pwForm.confirmPassword) {
    toast.add({ severity: 'warn', summary: $t('error.passwordMismatch'), life: 3000 })
    return
  }
  pwSaving.value = true
  try {
    await $fetch(`/api/users/${pwTarget.value!.id}/password`, { method: 'PUT', body: { newPassword: pwForm.newPassword } })
    toast.add({ severity: 'success', summary: 'Hasło zmienione', life: 3000 })
    pwDialogVisible.value = false
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ severity: 'error', summary: e?.data?.message ?? 'Błąd', life: 4000 })
  } finally {
    pwSaving.value = false
  }
}

const deleteTarget = ref<{ id: string; name: string } | null>(null)
const deleteReassignId = ref<string | null>(null)
const deleting = ref(false)

const otherUsers = computed(() =>
  (users.value as { id: string; name: string }[]).filter((u) => u.id !== deleteTarget.value?.id)
)

function openDeleteDialog(user: { id: string; name: string }) {
  deleteTarget.value = user
  deleteReassignId.value = null
}

async function doDeleteUser() {
  if (!deleteTarget.value || !deleteReassignId.value) return
  deleting.value = true
  try {
    await $fetch(`/api/users/${deleteTarget.value.id}`, {
      method: 'DELETE',
      body: { reassignToId: deleteReassignId.value },
    })
    toast.add({ severity: 'success', summary: 'Użytkownik usunięty', life: 3000 })
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
