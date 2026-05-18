<template>
  <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" :header="editClient ? $t('action.edit') : $t('action.addClient')" modal style="width: 480px">
    <form class="dialog-form" @submit.prevent="save">
      <div class="row-2">
        <div class="field">
          <label>{{ $t('field.firstName') }} *</label>
          <InputText v-model="form.firstName" class="w-full" required />
        </div>
        <div class="field">
          <label>{{ $t('field.lastName') }} *</label>
          <InputText v-model="form.lastName" class="w-full" required />
        </div>
      </div>
      <div class="row-2">
        <div class="field">
          <label>{{ $t('field.email') }}</label>
          <InputText v-model="form.email" type="email" class="w-full" />
        </div>
        <div class="field">
          <label>{{ $t('field.phone') }}</label>
          <InputText v-model="form.phone" class="w-full" />
        </div>
      </div>
      <div class="field">
        <label>{{ $t('field.defaultAddress') }}</label>
        <Textarea v-model="form.defaultAddress" class="w-full" rows="2" />
      </div>
      <div class="field">
        <label>{{ $t('field.notes') }}</label>
        <Textarea v-model="form.notes" class="w-full" rows="2" />
      </div>
      <div class="dialog-footer">
        <Button type="button" :label="$t('action.cancel')" severity="secondary" text @click="$emit('update:visible', false)" />
        <Button type="submit" :label="$t('action.save')" :loading="saving" />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
interface ClientRecord {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  defaultAddress?: string
  notes?: string
}

const props = defineProps<{ visible: boolean; editClient?: ClientRecord | null }>()
const emit = defineEmits<{ 'update:visible': [boolean]; saved: [ClientRecord] }>()
const toast = useToast()
const saving = ref(false)

const emptyForm = () => ({ firstName: '', lastName: '', email: '', phone: '', defaultAddress: '', notes: '' })
const form = reactive(emptyForm())

watch(() => props.visible, (v) => {
  if (v) {
    if (props.editClient) {
      Object.assign(form, {
        firstName: props.editClient.firstName ?? '',
        lastName: props.editClient.lastName ?? '',
        email: props.editClient.email ?? '',
        phone: props.editClient.phone ?? '',
        defaultAddress: props.editClient.defaultAddress ?? '',
        notes: props.editClient.notes ?? '',
      })
    } else {
      Object.assign(form, emptyForm())
    }
  }
})

async function save() {
  saving.value = true
  try {
    let result: ClientRecord
    if (props.editClient?.id) {
      result = await $fetch(`/api/clients/${props.editClient.id}`, { method: 'PUT', body: form })
    } else {
      result = await $fetch('/api/clients', { method: 'POST', body: form })
    }
    toast.add({ severity: 'success', summary: 'Zapisano', life: 3000 })
    emit('update:visible', false)
    emit('saved', result)
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ severity: 'error', summary: e?.data?.message ?? 'Błąd', life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>
