<template>
  <div>
    <div class="page-header">
      <h1>{{ $t('nav.profile') }}</h1>
    </div>

    <div class="profile-grid">
      <div class="profile-card">
        <div class="profile-card-header">{{ $t('section.accountInfo') }}</div>
        <div class="profile-row">
          <span class="profile-label">{{ $t('field.name') }}</span>
          <span>{{ user?.name }}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">{{ $t('field.login') }}</span>
          <span>{{ user?.login }}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">{{ $t('field.admin') }}</span>
          <span>{{ user?.isAdmin ? $t('info.yes') : $t('info.no') }}</span>
        </div>
      </div>

      <div class="profile-card">
        <div class="profile-card-header">{{ $t('section.changePassword') }}</div>
        <form class="dialog-form" @submit.prevent="submit">
          <div class="field">
            <label>{{ $t('field.currentPassword') }} *</label>
            <InputText v-model="form.currentPassword" type="password" class="w-full" autocomplete="current-password" required />
          </div>
          <div class="field">
            <label>{{ $t('field.newPassword') }} *</label>
            <InputText v-model="form.newPassword" type="password" class="w-full" autocomplete="new-password" required />
            <small class="profile-hint">{{ $t('info.passwordMinLength') }}</small>
          </div>
          <div class="field">
            <label>{{ $t('field.confirmPassword') }} *</label>
            <InputText v-model="form.confirmPassword" type="password" class="w-full" autocomplete="new-password" required />
          </div>
          <div class="dialog-footer">
            <Button type="submit" :label="$t('action.changePassword')" :loading="saving" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const { user } = useUserSession()
const toast = useToast()

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const saving = ref(false)

async function submit() {
  if (form.newPassword !== form.confirmPassword) {
    toast.add({ severity: 'warn', summary: $t('error.passwordMismatch'), life: 4000 })
    return
  }
  if (form.newPassword.length < 8) {
    toast.add({ severity: 'warn', summary: $t('info.passwordMinLength'), life: 4000 })
    return
  }

  saving.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
    })
    toast.add({ severity: 'success', summary: $t('info.passwordChanged'), life: 3000 })
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? $t('error.generic')
    toast.add({ severity: 'error', summary: msg, life: 4000 })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
  max-width: 860px;
}

.profile-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px 22px;
}

.profile-card-header {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-dark);
  margin-bottom: 16px;
}

.profile-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
}

.profile-row:last-child {
  border-bottom: none;
}

.profile-label {
  color: var(--muted);
  font-size: 13px;
}

.profile-hint {
  color: var(--muted);
  font-size: 11px;
  margin-top: 2px;
}
</style>
